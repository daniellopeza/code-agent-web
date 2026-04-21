# CodeAgent Web

Web-based interface for CodeAgent - analyze codebases via browser without installing Node.js or cloning the repo.

## Prerequisites

- Node.js 18+
- OpenAI API key

## Setup

1. **Clone the CodeAgent repository** (if not already present):

   ```bash
   cd ..
   git clone https://github.com/your-repo/code-agent.git
   ```

2. **Install dependencies**:

   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

3. **Set your OpenAI API key**:
   ```bash
   export OPENAI_API_KEY=your_api_key_here
   ```

## Running

### Development (both server + client)

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### Manual Start

**Server only:**

```bash
cd server
npm run dev
```

**Client only:**

```bash
cd client
npm run dev
```

### Production Build

```bash
npm run build
npm run start  # starts server only
```

## Environment Variables

| Variable          | Description                     | Default                                 |
| ----------------- | ------------------------------- | --------------------------------------- |
| `OPENAI_API_KEY`  | OpenAI API key (required)       | -                                       |
| `PORT`            | Server port                     | 3001                                    |
| `CODE_AGENT_PATH` | Path to CodeAgent runController | `../../code-agent/src/runController.js` |

## Usage

1. Open http://localhost:5173 in your browser
2. Enter a repository path (local path or GitHub URL)
3. Enter your question about the codebase
4. Click "Analyze Codebase"
5. View the answer and supporting files

## Project Structure

```
code-agent-web/
├── package.json          # Root package with dev scripts
├── server/               # Express backend
│   ├── src/index.ts      # API endpoints
│   └── package.json
└── client/               # React + Vite frontend
    ├── src/
    │   ├── App.tsx       # Main UI component
    │   └── index.css     # Styles
    └── package.json
```

## API Endpoints

- `POST /api/analyze` - Analyze a codebase
  - Body: `{ repoPath: string, question: string }`
  - Response: `{ finalAnswer, topFiles, selectedChunks, steps }`

- `GET /api/health` - Health check
  - Response: `{ status: 'ok', hasApiKey: boolean }`
