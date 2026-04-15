# CultureAlign 🎬

> AI-powered cultural alignment analysis for movies.  
> Check how well any movie fits a country's culture — or compare across multiple regions at once.

---

## What It Does

- **Search** by movie title, TMDB link, or IMDB link
- **Pick a target country** from a dropdown (20 countries across 6 regions)
- **Get an AI score** (1–10) with reasoning, content flags, and similar movie suggestions
- **Compare across countries** — one AI call scores all selected countries simultaneously
- **Caching** — repeat searches return instantly from MongoDB instead of re-calling Ollama
- **History page** — browse and delete all past analyses

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | FastAPI (Python 3.11) |
| AI / LLM | Ollama (local — llama3 / mistral / phi3) |
| Movie Data | TMDB API |
| Database | MongoDB 7 (Motor async driver) |

---

## Project Structure

```
culture-align/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   ├── .env
│   ├── Dockerfile
│   ├── modules/
│   │   ├── ollama_client.py    ← shared Ollama HTTP client
│   │   ├── tmdb.py             ← movie fetch (title / TMDB link / IMDB link)
│   │   ├── region.py           ← production country detection
│   │   └── scorer.py           ← cultural scoring (single + multi-country)
│   ├── db/
│   │   ├── connection.py       ← MongoDB Motor connection
│   │   └── models.py           ← Pydantic schemas
│   └── routers/
│       ├── analyze.py          ← POST /api/analyze, POST /api/analyze/compare
│       └── history.py          ← GET/DELETE /api/history
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            ← main analyze + compare page
│   │   ├── globals.css
│   │   └── history/page.tsx
│   ├── components/
│   │   ├── CountrySelector.tsx
│   │   ├── ComparisonCards.tsx
│   │   ├── MovieDetailsCard.tsx
│   │   ├── ScoreBadge.tsx
│   │   ├── ContentFlags.tsx
│   │   ├── SimilarMovies.tsx
│   │   └── HistoryTable.tsx
│   ├── lib/api.ts
│   ├── types/index.ts
│   └── package.json
│
└── docker-compose.yml
```

---

## Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Install |
|---|---|---|
| Python | 3.11+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| MongoDB | 7 | [mongodb.com](https://mongodb.com/try/download/community) or Docker |
| Ollama | Latest | [ollama.com](https://ollama.com) |
| Git | Any | [git-scm.com](https://git-scm.com) |

---

## Option A — Run Locally (Recommended for Development)

### Step 1 — Clone the repo

```bash
git clone https://github.com/your-username/culture-align.git
cd culture-align
```

---

### Step 2 — Start MongoDB

**Option 1: Docker (easiest)**
```bash
docker run -d \
  --name culture_mongo \
  -p 27017:27017 \
  mongo:7
```

**Option 2: Local MongoDB (if installed)**
```bash
# macOS / Linux
mongod --dbpath ~/data/db

# Windows PowerShell
mongod --dbpath "$env:USERPROFILE\data\db"
```

Verify it's running:
```bash
# Should print { ok: 1 }
mongosh --eval "db.adminCommand('ping')"
```

---

### Step 3 — Set up Ollama

```bash
# 1. Start the Ollama server
ollama serve

# 2. In a new terminal — pull the model (only needed once, ~4 GB download)
ollama pull llama3

# 3. Verify model is available
ollama list
# Should show: llama3:latest
```

> **Note:** CultureAlign auto-detects any available model.  
> Supported: `llama3`, `llama3.2`, `mistral`, `phi3`  
> llama3 gives the best cultural reasoning quality.

---

### Step 4 — Configure the backend

```bash
cd backend
```

Create the `.env` file:
```bash
# backend/.env
TMDB_API_KEY=YOUR_TMDB_API KEY FROM TMDB SETTINGS/API
OLLAMA_BASE_URL=http://localhost:11434
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=culture_align
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

`requirements.txt` contents:
```
fastapi
uvicorn[standard]
httpx
motor
pydantic
pydantic-settings
python-dotenv
```

---

### Step 5 — Run the backend

```bash
# From the backend/ directory
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
✅ MongoDB connected: culture_align
INFO:     Application startup complete.
```

Test it's working:
```bash
curl http://localhost:8000/health
# → {"status":"ok","service":"CultureAlign API"}
```

Interactive API docs (Swagger UI):
```
http://localhost:8000/docs
```

---

### Step 6 — Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
```

Create the environment file:
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### Step 7 — Run the frontend

```bash
# From the frontend/ directory
npm run dev
```

You should see:
```
▲ Next.js 14.2.3
- Local: http://localhost:3000
```

Open your browser: **http://localhost:3000** ✅

---

## Option B — Run with Docker Compose (One Command)

### Prerequisites
- Docker Desktop installed and running
- Ollama installed on your host machine (Docker can't run Ollama easily)

### Step 1 — Start Ollama on your host

```bash
ollama serve
ollama pull llama3   # if not already downloaded
```

### Step 2 — Launch everything

```bash
# From the project root (where docker-compose.yml is)
docker compose up --build
```

This starts:
- **MongoDB** on port `27017`
- **FastAPI backend** on port `8000`
- **Next.js frontend** on port `3000`

Open: **http://localhost:3000** ✅

### Stop everything
```bash
docker compose down

# To also delete stored MongoDB data:
docker compose down -v
```

---

## Option C — Windows Specific Steps

```powershell
# Step 1: Clone
git clone https://github.com/your-username/culture-align.git
cd culture-align

# Step 2: MongoDB via Docker
docker run -d --name culture_mongo -p 27017:27017 mongo:7

# Step 3: Ollama
# Download installer from https://ollama.com
# Then in PowerShell:
ollama serve
# New terminal:
ollama pull llama3

# Step 4: Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Create .env (PowerShell)
@"
TMDB_API_KEY=a3d117500dc275ba72d9e9268a7c579d
OLLAMA_BASE_URL=http://localhost:11434
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=culture_align
"@ | Out-File -FilePath .env -Encoding utf8

uvicorn main:app --reload --port 8000

# Step 5: Frontend (new terminal)
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

---

## How to Use

### Analyze a Movie

1. Enter a movie in any of these formats:
   - **Title:** `Inception`
   - **TMDB link:** `https://www.themoviedb.org/movie/27205-inception`
   - **IMDB link:** `https://www.imdb.com/title/tt1375666/`
   - **Bare IMDB ID:** `tt1375666`

2. Select a **Target Country** from the dropdown

3. Click **🔍 Analyze**

4. Wait 1–3 minutes on first run (Ollama processing). **Cached results are instant.**

### Compare Across Countries

1. Enter the same movie (or a different one in the Compare section)

2. Select countries using the toggle buttons (your target country is automatically excluded)

3. Click **📊 Compare**

4. Results appear ranked by score with AI reasoning per country

> **Speed tip:** Countries already in MongoDB load from cache instantly.  
> Only new country+movie combos call Ollama.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `POST` | `/api/analyze` | Single movie × single country |
| `POST` | `/api/analyze/compare` | Single movie × multiple countries |
| `GET` | `/api/history` | All past analyses (newest first) |
| `GET` | `/api/history/{id}` | Single analysis by ID |
| `DELETE` | `/api/history/{id}` | Delete one analysis |

### Example: Analyze

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "movie_input": "Inception",
    "target_region": "India"
  }'
```

```bash
# With TMDB link
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "movie_input": "https://www.themoviedb.org/movie/27205",
    "target_region": "France"
  }'
```

### Example: Compare

```bash
curl -X POST http://localhost:8000/api/analyze/compare \
  -H "Content-Type: application/json" \
  -d '{
    "movie_input": "KGF Chapter 2",
    "regions": ["United States", "France", "Japan", "UAE", "South Korea"]
  }'
```

---

## MongoDB — Useful Commands

```bash
# Connect to MongoDB shell
mongosh

# Switch to the database
use culture_align

# View recent analyses
db.alignments.find().sort({ searched_at: -1 }).limit(10).pretty()

# Count total analyses
db.alignments.countDocuments()

# Find all analyses for a specific movie
db.alignments.find({ "movie.title": /inception/i }).pretty()

# Find all analyses for a specific country
db.alignments.find({ "target_region": "India" }).pretty()

# Clear all data (use carefully)
db.alignments.deleteMany({})

# Create index for faster cache lookups (run once)
db.alignments.createIndex(
  { "movie.title": 1, "target_region": 1 },
  { collation: { locale: "en", strength: 2 } }
)
```

---

## Troubleshooting

### ❌ "Ollama not detected"

```bash
# Make sure Ollama is running
ollama serve

# Check it's accessible
curl http://localhost:11434/api/tags
```

### ❌ "Movie not found on TMDB"

- Check spelling of the movie title
- Try the TMDB or IMDB link instead of the title
- Some regional films may have different English titles on TMDB

### ❌ "Cultural scoring failed or timed out"

- Ollama is running but took too long (CPU can be slow)
- Try again — first inference after model load is slowest
- Check: `ollama list` — confirm the model is downloaded

### ❌ MongoDB connection error

```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# If using Docker
docker ps | grep mongo
docker start culture_mongo   # if stopped
```

### ❌ Frontend shows blank page / nav only

```bash
# Make sure backend is running
curl http://localhost:8000/health

# Check .env.local exists in frontend/
cat frontend/.env.local
# Should show: NEXT_PUBLIC_API_URL=http://localhost:8000

# Restart Next.js
npm run dev
```

### ❌ Score is always the same number

- This was a bug in V1 — fixed in V3 scorer prompt
- If still seeing this, ensure you replaced `backend/modules/scorer.py` with the V3 version
- Try clearing MongoDB cache and re-analyzing: `db.alignments.deleteMany({})`

---

## Environment Variables Reference

### `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `TMDB_API_KEY` | (set in file) | TMDB API key for movie data |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DB` | `culture_align` | Database name |

### `frontend/.env.local`

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | FastAPI backend URL |

---

## Performance Notes

| Scenario | Time |
|---|---|
| First analysis (cold Ollama) | 3–5 min |
| Cached analysis (MongoDB hit) | < 1 second |
| Compare 5 countries (all fresh) | 3–5 min |
| Compare 5 countries (all cached) | < 1 second |
| Compare 5 countries (mixed) | ~1–2 min |

Caching is automatic — every analysis is saved to MongoDB.  
If you analyze the same movie + country again, it loads instantly.

---

## Getting a TMDB API Key (if needed)

1. Go to [themoviedb.org](https://www.themoviedb.org/)
2. Create a free account
3. Go to **Settings → API → Create**
4. Copy your **API Key (v3 auth)**
5. Paste it in `backend/.env` as `TMDB_API_KEY`

---

## License

MIT — free to use and modify.
