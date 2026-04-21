import express, { Request, Response } from "express";
import cors from "cors";

// Dynamic import for CodeAgent - will be loaded from code-agent sibling directory
// Use CODE_AGENT_PATH env var to override, defaults to sibling directory
const CODE_AGENT_PATH =
  process.env.CODE_AGENT_PATH || "../../code-agent/src/runController.js";

let runController: any;
let ControllerInput: any;

async function loadCodeAgent() {
  try {
    // @ts-ignore - dynamic import path
    const codeAgent = await import(CODE_AGENT_PATH);
    runController = codeAgent.runController;
    ControllerInput = codeAgent.ControllerInput;
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
    if (!runController) {
      const loaded = await loadCodeAgent();
      if (!loaded) {
        res
          .status(500)
          .json({
            error:
              "CodeAgent module not found. Ensure code-agent is in sibling directory.",
          });
        return;
      }
    }

    try {
      const input: typeof ControllerInput = {
        repoPath,
        question,
        model: "gpt-4o-mini",
      };

      const result = await runController(input);

      res.json({
        finalAnswer: result.finalAnswer,
        topFiles: result.topFiles || [],
        selectedChunks: result.selectedChunks || [],
        steps: result.steps || [],
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
