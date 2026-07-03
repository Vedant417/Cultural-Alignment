"use client";

import { useState, useEffect } from "react";

import MovieForm from "@/components/cineai/MovieForm";
import Dashboard from "@/components/cineai/Dashboard";

const LOADING_STEPS = [
  "Initializing CinemAI Predictor Engine...",
  "Running token scanners and semantic filters...",
  "Evaluating emotional resonance curves...",
  "Cross-referencing budget against theatrical ROI...",
  "Executing Monte Carlo success simulations..."
];

export default function CineAIPage() {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let interval: any;

    if (loading) {
      setActiveStep(0);

      interval = setInterval(() => {
        setActiveStep((prev) => {
          if (prev < LOADING_STEPS.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 700);
    }

    return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyze = async (formData: any) => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/api/cineai/analyze", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      setResult({
        ...data,
        synopsis: formData.synopsis,
        budget: formData.budget,
        cast_star_power: formData.cast_star_power,
        genres: formData.genres,
        target_emotions: formData.target_emotions
      });
    } catch (err: any) {
      setError("Backend connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        <div
        style={{
            padding: "10px 0 25px 0",
        }}
        >
        <a
            href="/"
            style={{
            color: "#a78bfa",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "14px",
            }}
        >
            ← Back to CultureAlign
        </a>
        </div>

    <div className="container">
      <div className="studio-layout">

        {!loading && !result && (
          <>
  <div className="cineai-hero">

    <div className="cineai-badge">
      🎬 Predictor Agent Online
    </div>

    <h1 className="cineai-title">
      CineAI
    </h1>

    <p className="cineai-subtitle">
      EMOTION ARC & ROI PREDICTOR
    </p>

    <div className="cineai-divider" />

    <h2 className="cineai-heading">
      Analyze Movie Commercial Viability
    </h2>

    <p className="cineai-description">
      Welcome to the CinemAI Studio. Write your film concept,
      define genres, configure production variables, and run
      our Agentic AI model to forecast screenplay emotional
      dynamics, audience appeal, and box office success.
    </p>

    <div className="cineai-feature-card">
      <h3>Predictive Metrics</h3>

      <p>
        The agent combines semantic text analyzers with
        budget-revenue historical statistics to simulate
        critical and audience reception scores, generating
        clear script fixes to maximize theatrical performance.
      </p>
    </div>

  </div>

  <MovieForm
  onSubmit={handleAnalyze}
  isLoading={loading}
/>
</>
)}

{loading && (
          <div className="glass-card loading-panel">
            <h2 className="loading-title">
              AI analyzing screenplay...
            </h2>

            <ul className="loading-steps-list">
              {LOADING_STEPS.map((step, index) => (
                <li
                  key={index}
                  className={`loading-step-item ${
                    index <= activeStep ? "active" : ""
                  }`}
                >
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result && !loading && (
          <Dashboard
            data={result}
            onReset={() => setResult(null)}
            onReAnalyze={handleAnalyze}
          />
        )}

        {error && (
          <div style={{ color: "red" }}>
            {error}
          </div>
        )}

      </div>
        </div>
  </>
);
}