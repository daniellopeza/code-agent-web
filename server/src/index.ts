import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// Dynamic import for CodeAgent - import directly from modules, not index.js
let askCodebase: any;
let loadFilesRecursive: any;

async function loadCodeAgent() {
  try {
    // @ts-ignore - dynamic import paths
    const askModule = await import("../../../CodeAgent/src/ask.js");
    const loadModule = await import("../../../CodeAgent/src/loadFiles.js");
    askCodebase = askModule.askCodebase;
    loadFilesRecursive = loadModule.loadFilesRecursive;
    return true;
  } catch (err) {
    console.error("Failed to load CodeAgent:", err);
    return false;
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

interface AnalyzeRequest {
  repoPath: string;
  question: string;
}

interface AnalyzeResponse {
  finalAnswer: string;
  topFiles: string[];
  selectedChunks: Array<{
    file: string;
    content: string;
    score: number;
  }>;
  steps: string[];
  error?: string;
}

app.post(
  "/api/analyze",
  async (req: Request<{}, {}, AnalyzeRequest>, res: Response) => {
    const { repoPath, question } = req.body;

    if (!repoPath || !question) {
      res.status(400).json({ error: "repoPath and question are required" });
      return;
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      res
        .status(500)
        .json({ error: "OPENAI_API_KEY not configured on server" });
      return;
    }

    // Load CodeAgent if not loaded yet
    if (!askCodebase) {
      const loaded = await loadCodeAgent();
      if (!loaded) {
        res.status(500).json({
          error:
            "CodeAgent module not found. Ensure code-agent is in sibling directory.",
        });
        return;
      }
    }

    try {
      // Load files from the repository
      const files = loadFilesRecursive(repoPath);

      // Ask the question using the CodeAgent
      const result = await askCodebase(files, question);

      res.json({
        finalAnswer: result.answer,
        // topFiles: result.topFiles || [],
        // selectedChunks: result.selectedChunks || [],
        // steps: [],
      });
    } catch (error) {
      console.error("Error running controller:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        finalAnswer: "",
        topFiles: [],
        selectedChunks: [],
        steps: [],
      });
    }
  },
);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", hasApiKey: !!process.env.OPENAI_API_KEY });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
