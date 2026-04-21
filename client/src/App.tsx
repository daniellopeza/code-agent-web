import { useState, useEffect } from "react";

interface AnalyzeResult {
  finalAnswer: string;
  topFiles: string[];
  selectedChunks: Array<{
    file: string;
    content: string;
    score: number;
  }>;
  steps: string[];
}

function App() {
  const [repoPath, setRepoPath] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState("");
  const [serverStatus, setServerStatus] = useState<{
    ok: boolean;
    hasApiKey: boolean;
  } | null>(null);

  // Check server health on mount
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) =>
        setServerStatus({
          ok: data.status === "ok",
          hasApiKey: !!data.hasApiKey,
        }),
      )
      .catch(() => setServerStatus({ ok: false, hasApiKey: false }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoPath, question }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "An error occurred");
        return;
      }

      setResult(data);
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>CodeAgent</h1>
        <p>Analyze codebases via browser - no installation required</p>
      </header>

      {serverStatus && (
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <span
            className={`status-badge ${serverStatus.ok ? "success" : "error"}`}
          >
            Server: {serverStatus.ok ? "Connected" : "Disconnected"}
          </span>{" "}
          <span
            className={`status-badge ${serverStatus.hasApiKey ? "success" : "warning"}`}
          >
            API Key: {serverStatus.hasApiKey ? "Configured" : "Missing"}
          </span>
        </div>
      )}

      <div className="input-section">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="repoPath">Repository Path</label>
            <input
              id="repoPath"
              type="text"
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              placeholder="/path/to/your/repo or https://github.com/user/repo"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="question">Your Question</label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., How does authentication work in this codebase?"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Codebase"}
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && (
        <div className="results-section">
          <div className="loading">
            <span className="loading-spinner"></span>
            Analyzing codebase...
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="results-section">
          <h2>Analysis Results</h2>

          <div className="answer-box">
            <strong>Answer:</strong>
            {"\n\n"}
            {result.finalAnswer}
          </div>

          {result.topFiles && result.topFiles.length > 0 && (
            <div className="files-section">
              <h3>Top Files</h3>
              <div className="file-list">
                {result.topFiles.map((file, i) => (
                  <span key={i} className="file-tag">
                    {file}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.selectedChunks && result.selectedChunks.length > 0 && (
            <div className="chunks-section">
              <h3>Relevant Code Chunks</h3>
              {result.selectedChunks.map((chunk, i) => (
                <div key={i} className="chunk-item">
                  <div className="chunk-header">
                    <span>{chunk.file}</span>
                    <span>Score: {chunk.score.toFixed(2)}</span>
                  </div>
                  <div className="chunk-content">{chunk.content}</div>
                </div>
              ))}
            </div>
          )}

          {result.steps && result.steps.length > 0 && (
            <div className="steps-section">
              <h3>Analysis Steps</h3>
              <ul className="steps-list">
                {result.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
