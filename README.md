# CultureAlign 🎬
AI-powered cultural alignment analysis for movies.
Check how well any movie fits a country's culture — or compare across multiple regions at once.

📸 **Project Outputs & Screenshots:** Check the `project-OUTPUT/` folder at the root of this repository for PNG previews of the UI, analysis cards, map, and comparisons.

---

## ✨ Features

- 🔍 Smart Analysis (title / TMDB / IMDB)
- 🌍 Multi-country cultural scoring
- 📊 Compare: 1 Movie × Many Countries
- 🎬 2 Movies × 1 Country **[Experimental]**
- 🗺️ Cultural Fit Map **[Experimental]**
- 🔬 AI Deep Dive ("Explain More")
- 📈 Cultural Breakdown (4 sub-scores)
- ⭐ Favorites system
- 📅 History (search, filter, sort)
- 🔗 Share & deep linking
- 📈 Score trend chart
- 🤖 AI recommendations
- ⚡ Smart caching (MongoDB)
- 🌐 Multi-language UI

---

## 🛠 Tech Stack

| Layer    | Tech |
|----------|-----|
| Frontend | Next.js + TypeScript + Tailwind |
| Backend  | FastAPI |
| AI       | Ollama |
| DB       | MongoDB |
| API      | TMDB |

---

## 📁 Project Structure

```
culture-align/
├── backend/
│   ├── main.py
│   ├── modules/
│   ├── routers/
│   └── db/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── hooks/
```

---

## 🚀 Setup (Local Only)

### 1. Clone
```bash
git clone https://github.com/your-username/culture-align.git
cd culture-align
```

### 2. Start MongoDB
```bash
mongod
```

### 3. Start Ollama
```bash
ollama serve
ollama pull llama3
```

---

## ▶ Backend Setup
```bash
cd backend

# create .env
TMDB_API_KEY=YOUR_KEY
OLLAMA_BASE_URL=http://localhost:11434
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=culture_align

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## ▶ Frontend Setup
```bash
cd frontend

npm install

# create .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

Open: http://localhost:3000

---

## 📖 Usage

### Analyze
- Enter movie (title / TMDB / IMDB)
- Select country
- Click Analyze

### Compare
- Select multiple countries
- View ranked results

---

## 🔬 Experimental

- 2 Movies vs 1 Country comparison
- Cultural Fit Map (world view)

---

## 🔌 API Endpoints

| Method | Endpoint |
|--------|---------|
| GET    | /health |
| POST   | /api/analyze |
| POST   | /api/analyze/compare |
| POST   | /api/analyze/explain |
| POST   | /api/analyze/recommend |
| POST   | /api/compare/movie-vs-movie |
| GET    | /api/history |
| GET    | /api/favorites |

---

## ⚡ Performance

- First run: slow (LLM load)
- Cached: instant

---

## 📄 License

MIT
