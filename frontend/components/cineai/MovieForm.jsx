import React, { useState } from 'react';

const AVAILABLE_GENRES = ["Action", "Comedy", "Drama", "Thriller", "Sci-Fi", "Horror", "Romance"];

export default function MovieForm({ onSubmit, isLoading }) {
  const [title, setTitle] = useState('');
  const [screenplayFile, setScreenplayFile] = useState(null);
  const [synopsis, setSynopsis] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [budget, setBudget] = useState(30); // default $30M
  const [starPower, setStarPower] = useState(5); // default 5/10
  
  const [targetEmotions, setTargetEmotions] = useState({
    joy: 40,
    sadness: 20,
    fear: 10,
    anger: 10,
    suspense: 30
  });

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      if (selectedGenres.length > 1) {
        setSelectedGenres(selectedGenres.filter(g => g !== genre));
      }
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleEmotionChange = (emotion, value) => {
    setTargetEmotions({
      ...targetEmotions,
      [emotion]: parseFloat(value)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) return;
    
    if (!screenplayFile && !synopsis.trim()) {
      return;
    }
    
    const formData = new FormData();

    formData.append("title", title.trim());
    formData.append("genres", JSON.stringify(selectedGenres));
    formData.append("budget", budget);
    formData.append("cast_star_power", starPower);
    formData.append(
      "target_emotions",
      JSON.stringify(targetEmotions)
    );

    if (screenplayFile) {
      formData.append("screenplay", screenplayFile);
    }

    formData.append("synopsis", synopsis);

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card interactive">
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--accent)' }}>
        Cinematography Studio
      </h2>

      {/* Movie Title */}
      <div className="form-group">
        <label className="form-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>
          Movie Title
        </label>
        <input 
          type="text" 
          placeholder="e.g. Inception 2, The Laughing Corpse..." 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {/* Genre Tags */}
      <div className="form-group">
        <label className="form-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
          Select Genres
        </label>
        <div className="genre-grid">
          {AVAILABLE_GENRES.map(genre => (
            <div 
              key={genre}
              className={`genre-tag ${selectedGenres.includes(genre) ? 'selected' : ''}`}
              onClick={() => !isLoading && toggleGenre(genre)}
            >
              {genre}
            </div>
          ))}
        </div>
      </div>

      {/* Budget & Cast Star Power */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="mb-4">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            Budget (Est.)
          </label>
          <div className="slider-container">
            <input 
              type="range" 
              min="1" 
              max="300" 
              value={budget} 
              onChange={(e) => setBudget(e.target.value)}
              disabled={isLoading}
            />
            <span className="slider-val">${budget}M</span>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            Cast Star Power
          </label>
          <div className="slider-container">
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={starPower} 
              onChange={(e) => setStarPower(e.target.value)}
              disabled={isLoading}
            />
            <span className="slider-val">{starPower}/10</span>
          </div>
        </div>
      </div>

      {/* Target Emotions Weighting */}
      <div className="form-group">
        <label className="form-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>
          Creative Emotional Targets
        </label>
        <div className="emotion-weights-grid">
          {Object.entries(targetEmotions).map(([emotion, val]) => (
            <div key={emotion} className={`emotion-control ${emotion}`}>
              <div className="emotion-control-header">
                <span className={`emotion-name ${emotion}`}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></span>
                  {emotion}
                </span>
                <span className="slider-val" style={{ color: 'var(--text-muted)' }}>{val}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={val}
                onChange={(e) => handleEmotionChange(emotion, e.target.value)}
                disabled={isLoading}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Screenplay Upload */}
      <div className="form-group">
        <label className="form-label">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>

          Upload Screenplay / Script
        </label>

        <input
          type="file"
          accept=".txt,.pdf,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) {
              setScreenplayFile(file);
            }
          }}
          disabled={isLoading}
          style={{
            padding: "14px",
            border: "1px dashed #6d5efc",
            borderRadius: "12px",
            background: "#0b1020",
            color: "#fff",
            width: "100%",
            cursor: "pointer"
          }}
        />

        <p
          style={{
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            marginTop: "0.4rem"
          }}
        >
          Upload full screenplay, script draft, scene pages, or story treatment.
        </p>
        {/* Manual Screenplay Input */}
        <div style={{ marginTop: "20px" }}>
          <label className="form-label">
            ✍️ Write Screenplay / Plot Manually
          </label>

          <textarea
            placeholder="Write screenplay scenes, plot synopsis, dialogue excerpts, character arcs, or full story treatment..."
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            disabled={isLoading}
            style={{
              minHeight: "180px",
              marginTop: "10px"
            }}
          />

          <p
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginTop: "0.4rem"
            }}
          >
            You can either upload screenplay files OR directly paste your script here.
          </p>
        </div>
      </div>

      <button 
        type="submit" 
        className="predict-btn"
        disabled={
          isLoading ||
          !title.trim() ||
          selectedGenres.length === 0 ||
          (!screenplayFile && !synopsis.trim())
        }
      >
        {isLoading ? 'Agent Running Simulation...' : 'Execute Predictive Analysis'}
        <div className="btn-shimmer"></div>
      </button>
    </form>
  );
}