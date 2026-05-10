# NotebookAI 📓

NotebookAI is a full-stack, secure RAG (Retrieval-Augmented Generation) application inspired by NotebookLLM. It allows you to upload documents and have grounded conversations with them using a robust Express backend and an AI-powered vector search engine.

## ✨ Features

- **Document Ingestion**: Supports PDF, TXT, MD, and CSV files.
- **RAG Pipeline**: Efficiently chunks documents and builds a local vector index using **HNSWLib**.
- **Smart Embeddings**: Uses high-performance embeddings via **Hugging Face Inference API**.
- **Secure Architecture**: All AI processing and API keys are managed on a Node.js/Express backend to prevent client-side exposure.
- **Modern UI**: A sleek, responsive React interface built with Vite, featuring custom assets and smooth transitions.
- **Deployment Ready**: Optimized for **Railway** with automatic static file serving and build scripts.

## 🛠 Tech Stack

- **Frontend**: React (19), Vite
- **Backend**: Node.js, Express
- **AI/LLM**: OpenRouter (Nvidia Nemotron), Hugging Face (Inference API)
- **Vector Store**: HNSWLib (local, in-process)
- **Orchestration**: LangChain

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd NoteBookLLM_Clone
npm install
cd server && npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```env
OPENROUTER_API_KEY=your_key_here
HUGGINGFACE_API_KEY=your_key_here
```

### 3. Run Locally

From the root directory, run:

```bash
npm run dev
```

This will concurrently start the Vite frontend on port `5173` and the Express backend on port `3000`.

## ☁️ Deployment

This project is configured for one-click deployment to **Railway**.

1. Connect your GitHub repository to Railway.
2. Add `OPENROUTER_API_KEY` and `HUGGINGFACE_API_KEY` to the service variables.
3. Railway will use the root `package.json` to build the frontend and serve it via the backend automatically.

---
Built with ❤️ using React, Express, and LangChain.
