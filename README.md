# CultureAlign 🎬
AI-powered cultural alignment analysis for movies.
Check how well any movie fits a country's culture — or compare across multiple regions at once.

📸 **Project Outputs & Screenshots:** Check the attached `screenshots/` folder at the root of this repository for PNG previews of the UI, analysis cards, world map, and comparison views. Perfect for a quick visual overview for end users!

## 🆕 What's New in V6
Version 6 introduces deep cultural breakdowns, advanced UI controls, and new visualization tools:
- 🔍 **AI Deep Dive:** "Explain More" button expands short summaries into 5 detailed cultural factors.
- 📊 **Cultural Factors Breakdown:** 4 sub-scores (Cultural Fit, Censorship Risk, Language Fit, Market Appeal) with visual progress bars.
- 🗺️ **Interactive Cultural Fit Map:** 🔬 *Experimental* — Visualize how a movie scores globally on a clickable world map.
- 🎬 **2 Movies × 1 Country:** 🔬 *Experimental* — Smart Compare mode to pit two films head-to-head for a single region.
- 📅 **Enhanced History:** Search, filter by country/score, and sort by latest or highest rating.
- ⭐ **Favorites System:** Save and manage your top analyses.
- 🔗 **Share & Deep-Linking:** Copy direct URLs or use native OS sharing; pasting a link auto-triggers the analysis.
- 📈 **Score Trend Chart:** Visual bar chart ranking all analyzed countries by score.
- 🤖 **AI Recommendation Engine:** Get 3 culturally aligned movie suggestions based on your analysis.
- ⚡ **Enhanced Cache Indicator:** Shows `🆕 fresh` or `⚡ cached (2h ago)` with precise timestamp diffs.
- 🌐 **Multi-Language Support:** Full UI translation for English, Hindi, Spanish, and Japanese.

## What It Does
- Search by movie title, TMDB link, or IMDB link
- Pick a target country from a dropdown (20 countries across 6 regions)
- Get an AI score (1–10) with reasoning, content flags, and similar movie suggestions
- Compare across countries — one AI call scores all selected regions simultaneously
- Caching — repeat searches return instantly from MongoDB instead of re-calling Ollama
- History page — browse, search, filter, sort, and delete all past analyses

## Tech Stack
| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Frontend     | Next.js 14 + TypeScript + Tailwind CSS + `react-simple-maps` |
| Backend      | FastAPI (Python 3.11)               |
| AI / LLM     | Ollama (local — llama3 / mistral / phi3) |
| Movie Data   | TMDB API                            |
| Database     | MongoDB 7 (Motor async driver)      |

## Project Structure