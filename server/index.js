import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import dotenv from 'dotenv';
import { Document } from '@langchain/core/documents';

function chunkText(text, chunkSize = 600, overlap = 100) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let current = "";
  let overlapBuffer = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize && current.length > 0) {
      chunks.push((overlapBuffer + current).trim());
      overlapBuffer = current.slice(-overlap);
      current = sentence;
    } else {
      current += " " + sentence;
    }
  }
  if (current.trim()) chunks.push((overlapBuffer + current).trim());
  return chunks.filter(c => c.length > 30);
}
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Initialize embeddings using Hugging Face
const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACE_API_KEY,
  model: "sentence-transformers/all-MiniLM-L6-v2", // Fast and good for small RAG
});

let vectorStore = null;
let documentMetadata = null;

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // 1. Extract Text
    let text = "";
    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else {
      text = fs.readFileSync(req.file.path, 'utf8');
    }

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: "Document appears empty or too short." });
    }

    // 2. Chunking
    const chunks = chunkText(text, 600, 100);
    const docs = chunks.map(c => new Document({ pageContent: c }));

    // 3. Embed & Index into Vector Store
    // Free up previous store
    vectorStore = await HNSWLib.fromDocuments(docs, embeddings);
    
    documentMetadata = {
      name: req.file.originalname,
      charCount: text.length,
      chunkCount: docs.length
    };

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ success: true, metadata: documentMetadata });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Failed to process document." });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { query, history } = req.body;
    
    if (!vectorStore) {
      return res.status(400).json({ error: "No document indexed yet. Please upload a document first." });
    }

    const retriever = vectorStore.asRetriever({ k: 4 });
    const retrievedDocs = await retriever.invoke(query);
    const contextStr = retrievedDocs.map(d => d.pageContent).join("\n\n");
    
    const systemPrompt = `You are a document assistant. Answer questions ONLY using the provided document context. 
If the answer isn't in the context, say "I couldn't find that in the document."
Be precise, helpful, and concise. Do not use outside knowledge.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: `Document context:\n\n${contextStr}\n\n---\nQuestion: ${query}` }
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    res.json({ 
      answer: data.choices[0].message.content,
      chunks: retrievedDocs.map(d => d.pageContent) 
    });

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Failed to generate answer." });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route to serve the frontend for any non-API request
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
