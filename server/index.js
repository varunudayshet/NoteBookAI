import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
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
      const uint8Array = new Uint8Array(dataBuffer);
      const loadingTask = pdfjsLib.getDocument({ 
        data: uint8Array,
        standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/'
      });
      const pdfDocument = await loadingTask.promise;
      let fullText = "";
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + "\n";
      }
      text = fullText;
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

// CRAG Evaluator Helper
async function evaluateDocuments(query, docs) {
  const gradedDocs = [];
  const prompt = `You are a grader assessing relevance of retrieved documents to a user question.
Here is the user question: "${query}"

Here are the retrieved documents:
${docs.map((d, i) => `[Document ${i}]:\n${d.pageContent}`).join("\n\n")}

If a document contains keywords, semantic meaning, or facts related to the question, grade it as relevant.
Return ONLY a valid JSON array containing the indices of the relevant documents. For example, if Document 0 and 2 are relevant, return [0, 2]. If none are relevant, return []. DO NOT return any markdown, just the array.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
      let content = data.choices[0].message.content.trim();
      content = content.replace(/^```json/i, "").replace(/```$/i, "").trim();
      
      const relevantIndices = JSON.parse(content);
      if (Array.isArray(relevantIndices)) {
        relevantIndices.forEach(idx => {
          if (docs[idx]) gradedDocs.push(docs[idx]);
        });
        return gradedDocs;
      }
    }
  } catch (error) {
    console.error("Grading error:", error);
  }
  return docs; // fallback to all docs if evaluation fails
}

// CRAG Wikipedia Fallback Helper
async function fallbackSearch(query) {
  try {
    const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`);
    const data = await response.json();
    if (data.query && data.query.search && data.query.search.length > 0) {
      return data.query.search.slice(0, 3).map(res => res.snippet.replace(/<\/?[^>]+(>|$)/g, "")).join("\n\n");
    }
  } catch (error) {
    console.error("Wikipedia search error:", error);
  }
  return "";
}

app.post('/api/chat', async (req, res) => {
  try {
    const { query, history } = req.body;
    
    if (!vectorStore) {
      return res.status(400).json({ error: "No document indexed yet. Please upload a document first." });
    }

    const retriever = vectorStore.asRetriever({ k: 4 });
    const retrievedDocs = await retriever.invoke(query);
    
    // CRAG: Evaluate Documents
    const gradedDocs = await evaluateDocuments(query, retrievedDocs);
    
    let contextStr = "";
    let usedFallback = false;
    let finalChunks = [];
    
    if (gradedDocs.length > 0) {
      contextStr = gradedDocs.map(d => d.pageContent).join("\n\n");
      finalChunks = gradedDocs.map(d => d.pageContent);
    } else {
      // CRAG: Fallback Web Search
      contextStr = await fallbackSearch(query);
      if (contextStr) {
        usedFallback = true;
        finalChunks = [contextStr];
      } else {
        usedFallback = false;
        contextStr = "No relevant context found in document or web search.";
      }
    }
    
    let systemPrompt = "";
    if (usedFallback) {
       systemPrompt = `You are a helpful assistant. The user's question couldn't be answered by their uploaded documents, so we performed a Wikipedia search. Answer the question using ONLY the provided Wikipedia context. If the answer isn't in the context, say "I couldn't find that in the web search." Be precise and helpful.`;
    } else {
       systemPrompt = `You are a document assistant. Answer questions ONLY using the provided document context. 
If the answer isn't in the context, say "I couldn't find that in the document."
Be precise, helpful, and concise. Do not use outside knowledge.`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: `Context:\n\n${contextStr}\n\n---\nQuestion: ${query}` }
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
      chunks: finalChunks,
      usedFallback
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
