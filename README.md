# 🎬 CultureAlign @EntertainmentTechnologies

**🚀 Live Demo:** [https://culturealign.up.railway.app/](https://culturealign.up.railway.app/)

---

## 📋 Overview

**CultureAlign** is an AI-powered platform that analyzes how well movies align with different cultures and regions. Using advanced AI models and cultural knowledge, the platform provides cultural fit scores for movies across multiple countries, enabling users to discover culturally relevant entertainment and understand content sensitivities.

Whether you're a content curator, international distributor, or film enthusiast, CultureAlign helps you understand which movies resonate best with specific audiences around the world.

---

## ✨ Features

- 🔍 **Smart Movie Analysis** - Search by title, TMDB link, or IMDB link
- 🌍 **Multi-Country Scoring** - Analyze one movie across multiple countries instantly
- 📊 **Side-by-Side Comparison** - Compare one movie against multiple regions to see which markets it fits best
- 🎬 **Movie vs Movie** - Compare two different movies in a single country to see which aligns better
- 🔬 **Deep Analysis** - AI-powered "Explain More" feature providing detailed cultural insights
- 📈 **Cultural Breakdown** - Four-part sub-scoring system: Language, Religion/Values, Censorship Risk, Audience Demographics
- ⭐ **Favorites System** - Save and organize your favorite analyses
- 📅 **Search History** - Full-featured history with search, filter, and sort capabilities
- 📈 **Score Trend Chart** - Visualize score trends over time
- 🤖 **AI Recommendations** - Get movie recommendations tailored to selected regions
- ⚡ **Smart Caching** - MongoDB-based caching for instant repeat queries
- 🌐 **Multi-Language UI** - Support for English, Chinese, Japanese, Spanish, and more

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                      │
│  - React Components, TypeScript, Tailwind CSS               │
│  - Pages: Analyze, Compare, History, Favorites              │
│  - Hooks: useLanguage, useTranslation                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────────────┐
│                  Backend (FastAPI)                          │
│  - Routers: analyze, compare, history, translate            │
│  - Modules: LLM, TMDB, Scorer, Region Detector              │
│  - Database Connection Pool, CORS Middleware                │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
   MongoDB          TMDB API      LLM (Ollama/Groq)
   (Cache)          (Movie Data)   (Cultural Analysis)
```

**Data Flow:**
1. User enters movie + target countries
2. Frontend calls `/api/analyze` or `/api/analyze/multi-country`
3. Backend fetches movie data from TMDB (or hybrid fetch)
4. Backend detects origin region of movie
5. Backend calls LLM for cultural scoring
6. Results cached in MongoDB
7. Frontend displays scores and breakdowns

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 14.2.3 | React framework, SSR, API routes |
| **React** | 18+ | UI library |
| **TypeScript** | 6.0.2 | Type safety |
| **Tailwind CSS** | 3.4.1 | Styling framework |
| **Chart.js** | 4.5.1 | Data visualization |
| **Lucide Icons** | 0.383.0 | Icon library |
| **Netlify** | - | Deployment (Netlify CI/CD) |

### Backend
| Technology | Purpose |
|-----------|---------|
| **FastAPI** | Web framework, async APIs |
| **Python 3.9+** | Backend language |
| **Pydantic** | Data validation |
| **asyncio** | Async operations |
| **aiohttp/httpx** | HTTP client |

### AI & Data
| Technology | Purpose |
|-----------|---------|
| **Ollama** / **Groq** | LLM provider for cultural analysis |
| **MongoDB** | NoSQL database for caching analyses |
| **TMDB API** | Movie metadata (ratings, genres, etc.) |

### DevOps & Deployment
| Platform | Purpose |
|----------|---------|
| **Railway App** | Backend hosting |
| **Docker** | Containerization (optional) |
| **Git** | Version control |

---

## ⚠️ Limitations

1. **LLM Dependency** - Requires Ollama/Groq API running; slow first-time analyses (~20-30 seconds)
2. **Movie Database** - Limited to movies available in TMDB API
3. **Cultural Bias** - AI analysis may reflect biases in training data; not 100% culturally accurate
4. **No Real-Time Trends** - Scores are static based on movie metadata, not real audience data
5. **Limited Regions** - Currently supports ~20 major countries/regions
6. **API Rate Limits** - TMDB API has rate limiting; Groq API has quota restrictions
7. **Experimental Features** - Map visualization and 2-movie comparison are experimental
8. **Language Support** - Multi-language UI, but LLM analysis primarily in English
9. **Mobile Responsiveness** - Optimized for desktop; mobile UX could be improved
10. **Memory Usage** - Large LLM models require significant RAM/VRAM
11. **No User Authentication** - Public access, no user accounts or profiles
12. **Accuracy Variability** - LLM outputs can vary between runs for same movie

---

## 📦 Installation

### Prerequisites
- **Node.js** ≥ 18 (for frontend)
- **Python** ≥ 3.9 (for backend)
- **MongoDB** (local or Atlas URI)
- **Ollama** or **Groq API key**
- **TMDB API Key** (get from [tmdb.org](https://www.themoviedb.org/settings/api))

### Step 1: Clone Repository
```bash
git clone https://github.com/soorajs06/culture-alignment.git
cd culture-alignment
```

### Step 2: Backend Setup

#### 2a. Create Virtual Environment
```bash
cd backend
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate
```

#### 2b. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 2c. Create `.env` File
```bash
# backend/.env
TMDB_API_KEY=your_tmdb_api_key_here
OLLAMA_BASE_URL=http://localhost:11434
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=culture_align
LLM_PROVIDER=ollama  # or 'groq'
GROQ_API_KEY=your_groq_key_here  # if using Groq
```

#### 2d. Start MongoDB (if local)
```bash
# macOS
brew services start mongodb-community

# Windows (with MongoDB installed)
mongod

# Or use MongoDB Atlas cloud for MONGODB_URI
```

#### 2e. Start Ollama (if using local)
```bash
ollama serve
# In another terminal:
ollama pull llama3  # or your preferred model
```

### Step 3: Frontend Setup

#### 3a. Install Dependencies
```bash
cd ../frontend
npm install
```

#### 3b. Create `.env.local` File
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## ▶️ How to Run

### Development Mode

#### Start Backend
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn main:app --reload --port 8000
```
Backend runs at: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

#### Start Frontend (new terminal)
```bash
cd frontend
npm run dev
```
Frontend runs at: `http://localhost:3000`

### Production Build

#### Backend
```bash
cd backend
uvicorn main:app --port 8000
```

#### Frontend
```bash
cd frontend
npm run build
npm run start
```

### Using Docker (Optional)
```bash
# Backend
docker build -f Dockerfile.backend -t culture-align-backend .
docker run -p 8000:8000 culture-align-backend

# Frontend
docker build -f Dockerfile.frontend -t culture-align-frontend .
docker run -p 3000:3000 culture-align-frontend
```

### Health Check
```bash
curl http://localhost:8000/health
```

---

## 📖 Usage Guide

### Analyze a Movie
1. Go to **"Analyze"** tab
2. Enter movie title, TMDB link, or IMDB link
3. Select target country
4. Click "Analyze"
5. View cultural fit score and breakdown

### Compare Across Countries
1. Go to **"Compare"** tab
2. Switch to **"1 Movie × Countries"** mode
3. Enter movie title
4. Select multiple countries
5. Click "Compare"
6. View ranked results

### Compare Two Movies
1. Go to **"Compare"** tab
2. Switch to **"2 Movies × 1 Country"** mode
3. Enter two different movies
4. Select country
5. Click "Compare"
6. View which movie fits better

### View History
1. Go to **"History"** tab
2. Search by title or filter by country
3. Click any entry to view details
4. Delete old entries if needed

### Save to Favorites
1. After analyzing a movie, click ⭐ icon
2. Go to **"Favorites"** to view saved analyses
3. Click to expand details

---

## 🔌 API Endpoints

### Core Analysis
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/analyze` | Single movie, single country |
| POST | `/api/analyze/multi-country` | Single movie, multiple countries |
| POST | `/api/analyze/compare` | Two movies, one country |

### Additional Features
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/analyze/deep` | Deep cultural analysis |
| POST | `/api/analyze/explain` | Explain cultural fit |
| POST | `/api/analyze/recommend` | Get recommendations |
| GET | `/api/analyze/genre-movies` | Fetch movies by genre |

### History & Metadata
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/history` | Get all analyses |
| DELETE | `/api/history/{id}` | Delete analysis |
| GET | `/api/history/grouped/all` | Grouped by movie |

### System
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | Health check |
| GET | `/health` | Detailed health info |

---

## 🔮 Future Improvements

### Short Term (v2)
- [ ] **User Authentication** - Sign up, log in, personal profiles
- [ ] **User Profiles** - Save preferences, watch lists, custom regions
- [ ] **Advanced Filtering** - Filter by genre, year, rating, language
- [ ] **PDF Export** - Download analysis reports as PDF
- [ ] **Dark Mode Improvements** - Better dark mode UX
- [ ] **Mobile App** - React Native mobile application

### Medium Term (v3)
- [ ] **Batch Analysis** - Analyze multiple movies at once
- [ ] **Trending Dashboard** - Show trending movies by region
- [ ] **Influencer Mode** - Content creator recommendations
- [ ] **Integration with Streaming Platforms** - Netflix, Amazon Prime, etc.
- [ ] **Real-Time User Data** - Incorporate actual audience feedback
- [ ] **Review System** - Community ratings and reviews
- [ ] **AI Model Improvement** - Fine-tuned models for better accuracy
- [ ] **Multi-Language LLM** - Non-English cultural analysis

### Long Term (v4)
- [ ] **Market Intelligence** - ROI predictions for international releases
- [ ] **Distribution Optimization** - Suggest best release countries/dates
- [ ] **Competitor Analysis** - Compare similar movies across regions
- [ ] **Censorship Prediction** - Predict which regions may ban content
- [ ] **Custom Region Profiles** - Create custom cultural profiles
- [ ] **API Monetization** - Premium API tier for studios
- [ ] **ML Model Training** - Use feedback to improve models
- [ ] **Blockchain Verification** - Verify analysis authenticity
- [ ] **Augmented Reality** - AR movie recommendations
- [ ] **Voice Analysis** - Audio/dialogue cultural analysis

---

## 🐛 Troubleshooting

### Backend Issues
- **LLM Timeout**: Increase timeout in `/backend/modules/llm.py`
- **MongoDB Connection Failed**: Check `MONGODB_URI` in `.env`
- **TMDB API Error**: Verify `TMDB_API_KEY` is valid
- **Ollama Not Running**: Start with `ollama serve` first

### Frontend Issues
- **API 404**: Ensure backend is running on correct port
- **Blank Page**: Check browser console and network tab
- **Translation Not Working**: Verify language files in `/frontend/lib/i18n.ts`

### Environment Issues
- **Port Already in Use**: Change port with `--port 8001` or kill existing process
- **Module Not Found**: Run `pip install -r requirements.txt` or `npm install`
- **Python Version Mismatch**: Use Python 3.9+ with `python --version`

---

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Last Updated**: April 2026

*Made with ❤️ by the EntertainmentTech team*
