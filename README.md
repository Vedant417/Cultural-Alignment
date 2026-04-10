# 🎬 CultureAlign — AI-Powered Cultural Suitability Analyzer

## 📌 Overview

**CultureAlign** is a full-stack AI application that evaluates how culturally suitable a movie is for a specific region. It combines movie metadata with AI-driven analysis to generate a **cultural compatibility score**, highlight sensitive content, and recommend similar films.

The system integrates:

* Movie data (via TMDB)
* AI reasoning (via Ollama)
* Region-based cultural evaluation
* Persistent storage (MongoDB)

---

## 🚀 Key Features

* 🔍 Search any movie by name
* 🌍 Automatic region detection based on context
* 🧠 AI-based cultural suitability scoring
* ⚠️ Content sensitivity flags (violence, religion, etc.)
* 🎯 Audience suitability insights
* 🎬 Similar movie recommendations
* 🕘 History tracking of all analyses

---

## 🏗️ Tech Stack

| Layer     | Technology               |
| --------- | ------------------------ |
| Frontend  | Next.js 14 + TypeScript  |
| Backend   | FastAPI (Python)         |
| Database  | MongoDB (Motor - async)  |
| AI Engine | Ollama (LLM inference)   |
| Styling   | Tailwind CSS + shadcn/ui |

---

## 📥 Input

The system takes a simple user input:

```json
{
  "movie_name": "Inception"
}
```

---

## ⚙️ Processing Pipeline

1. **User Input (Frontend)**

   * User enters a movie name.

2. **Backend Processing**

   * Fetch movie details from TMDB
   * Detect relevant cultural region using AI
   * Evaluate cultural suitability using AI scoring model

3. **Data Storage**

   * Store results in MongoDB for history tracking

---

## 📤 Output

The system returns structured cultural analysis:

```json
{
  "movie": {
    "title": "Inception",
    "overview": "...",
    "release_date": "2010-07-16",
    "language": "en"
  },
  "region": {
    "country": "United States",
    "state": "California",
    "lat": 34.05,
    "lon": -118.24
  },
  "result": {
    "score": 8,
    "label": "Great Fit",
    "reason": "Minimal cultural conflicts",
    "content_flags": {
      "violence": "Mild",
      "adult_content": "None",
      "religion_sensitivity": "None",
      "drug_glorification": "None"
    },
    "audience_note": "Suitable for general audience",
    "similar_movies": ["Interstellar", "Tenet"]
  }
}
```

---

## 🧠 How It Works

### 1. Movie Data Extraction

* Retrieves metadata such as title, overview, language, and release date.

### 2. Region Detection

* AI determines the most relevant cultural region for evaluation.

### 3. Cultural Scoring

* AI evaluates:

  * Violence level
  * Adult content
  * Religious sensitivity
  * Social norms alignment

### 4. Output Generation

* Produces:

  * Score (1–10)
  * Fit label (Good / Medium / Not Fit)
  * Explanation
  * Content flags
  * Recommendations

---

## 📁 Project Structure

```
culture-align/
├── frontend/        # Next.js app
├── backend/         # FastAPI server
```

---

## 🔌 API Endpoints

| Method | Endpoint        | Description                        |
| ------ | --------------- | ---------------------------------- |
| POST   | `/analyze`      | Analyze movie cultural suitability |
| GET    | `/history`      | Get all past analyses              |
| GET    | `/history/{id}` | Get specific analysis              |
| GET    | `/health`       | Check system status                |

---

## 🛠️ Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/<your-username>/culture-align.git
cd culture-align
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file:

```
TMDB_API_KEY=your_key
MONGO_URI=your_mongodb_uri
OLLAMA_URL=http://localhost:11434
```

---

## 📊 Use Cases

* Content moderation platforms
* OTT recommendation systems
* Regional censorship analysis
* Personalized movie suggestions
* Cultural research tools

---

## 🔮 Future Enhancements

* Multi-language support
* User profile-based recommendations
* Real-time streaming integration
* Advanced analytics dashboard
* Fine-tuned domain-specific AI model

---

## 🤝 Contribution

Contributions are welcome. Fork the repo, create a feature branch, and submit a pull request.

---

## 📜 License

This project is open-source and available under the MIT License.

---
