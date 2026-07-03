# 🌍 CultureAlign – AI-Powered Cultural Analysis Platform

CultureAlign is a full-stack AI-powered platform that evaluates how well movies align with different cultures, countries, and regional audiences using Large Language Models (LLMs), intelligent scoring algorithms, and real-world cultural insights.

The platform helps distributors, streaming platforms, and content teams understand whether a movie is suitable for release in a particular market by generating cultural compatibility scores, identifying potential sensitivities, and providing AI-generated reasoning.

Built with a modern React frontend, FastAPI backend, MongoDB caching, and Gemini-powered cultural intelligence, CultureAlign delivers enterprise-grade analysis through a scalable and modular architecture.

---

# 📂 Project Structure

```
CultureAlign/
│
├── backend/
│   ├── db/
│   │   ├── connection.py
│   │   ├── models.py
│   │   └── __init__.py
│   │
│   ├── modules/
│   │   ├── scorer.py
│   │   ├── translator.py
│   │   ├── tmdb.py
│   │   ├── llm.py
│   │   ├── hybrid_fetcher.py
│   │   ├── ollama_client.py
│   │   └── region.py
│   │
│   ├── routers/
│   │   ├── analyze.py
│   │   ├── compare.py
│   │   ├── history.py
│   │   ├── cineai.py
│   │   └── translate.py
│   │
│   ├── utils/
│   │   └── screenplay_parser.py
│   │
│   ├── main.py
│   ├── config.py
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── public/
│   └── package.json
│
└── README.md
```

---

# ✨ Features

### 🌍 AI Cultural Compatibility Analysis

Analyze how well a movie aligns with different countries based on regional culture, language preferences, audience expectations, and censorship guidelines.

---

### 🎬 Intelligent Movie Search

Search movies using:

- Movie Title
- TMDB URL
- IMDb URL

Automatically retrieves metadata and prepares content for AI analysis.

---

### 🌎 Multi-Region Analysis

Evaluate a single movie across multiple countries simultaneously and compare cultural acceptance scores between regions.

---

### ⚖️ Movie Comparison

Compare:

- One movie across multiple countries
- Two different movies within the same country

to understand regional audience preferences.

---

### 🤖 AI Explain More

Generate detailed AI explanations describing why a movie performs well (or poorly) in a selected country using Gemini-powered reasoning.

---

### 📊 Cultural Breakdown

Each analysis produces detailed category scores including:

- Language Compatibility
- Religious & Cultural Values
- Censorship Risk
- Audience Demographics
- Regional Acceptance

---

### ⭐ Favorites

Save analyses for future reference and organize frequently accessed movies.

---

### 📜 Analysis History

Track previous analyses with filtering, searching, and sorting capabilities.

---

### 📈 Cultural Score Visualization

Visualize cultural scores and compare results across different regions.

---

### 🌐 Multi-language Support

Supports multiple interface languages including:

- English
- Chinese
- Japanese
- Spanish
- French
- German
- Hindi

---

### ⚡ Smart Caching

Uses MongoDB caching to significantly reduce repeated AI requests and improve response times.

---

### 🔌 REST API Architecture

Modular FastAPI backend exposing scalable REST endpoints for analysis, comparison, translation, recommendations, and history management.

---

# 🛠️ Technologies Used

## Frontend

- React.js
- Next.js
- TypeScript
- CSS Modules
- React Hooks

---

## Backend

- FastAPI
- Python
- MongoDB
- REST APIs
- Pydantic

---

## Artificial Intelligence

- Google Gemini
- Large Language Models (LLMs)
- Prompt Engineering
- Cultural Scoring Engine
- Translation Pipeline
- Intelligent Recommendation System

---

## External APIs

- TMDB API
- IMDb
- Google Translation
- Gemini API

---

## Tools

- Git
- GitHub
- VS Code
- Postman

---

# 💻 System Requirements

Minimum Requirements

- Python 3.10+
- Node.js 18+
- MongoDB
- npm / yarn
- Internet connection for external APIs

Recommended

- Python 3.11
- Node.js 20+
- MongoDB Community Edition

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/CultureAlign.git

cd CultureAlign
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

---

## Configure Environment

Create a `.env` file inside the backend directory.

Example:

```env
GEMINI_API_KEY=YOUR_KEY

TMDB_API_KEY=YOUR_KEY

MONGODB_URI=YOUR_DATABASE

TRANSLATE_API_KEY=YOUR_KEY
```

---

## Run Backend

```bash
uvicorn main:app --reload
```

Backend runs on

```
http://localhost:8000
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on

```
http://localhost:3000
```

---

# 🧠 How It Works

1. User searches for a movie by title or link.

2. Movie metadata is collected from TMDB and supporting APIs.

3. The backend gathers regional rules and cultural knowledge.

4. Gemini analyzes the content for cultural compatibility.

5. The scoring engine calculates multiple cultural metrics.

6. Results are cached in MongoDB for faster future requests.

7. The frontend visualizes the analysis with charts, breakdowns, comparisons, and AI-generated explanations.

---

# 📊 Analysis Pipeline

```
Movie Search
        │
        ▼
Metadata Collection
        │
        ▼
Translation & Processing
        │
        ▼
Gemini Cultural Analysis
        │
        ▼
Scoring Engine
        │
        ▼
MongoDB Cache
        │
        ▼
React Dashboard
```

---

# 🔧 Troubleshooting

### Gemini API Errors

Ensure your API key is valid and correctly configured in the `.env` file.

---

### MongoDB Connection Issues

Verify the MongoDB connection string and ensure the database service is running.

---

### TMDB API Errors

Confirm that the TMDB API key has sufficient quota and is correctly configured.

---

### Frontend Cannot Connect to Backend

Verify that the backend server is running and CORS settings allow requests from the frontend.

---

# 🚀 Future Enhancements

- User Authentication
- Team Workspaces
- Role-Based Access Control
- AI Recommendation Engine
- Analytics Dashboard
- Export Reports (PDF & Excel)
- Batch Movie Analysis
- Cloud Deployment
- CI/CD Pipeline
- Docker Support

---

# 📝 License

This project is developed for educational, research, and enterprise AI demonstration purposes.

---

## 👨‍💻 Developer

**Vedant Vyas**

AI Engineer | Full Stack Developer

Built as an enterprise AI platform for intelligent cultural analysis of global media content.
