import React, { useState, useEffect, useRef } from 'react';

export default function Dashboard({ data, onReAnalyze, onReset }) {
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [terminalIndex, setTerminalIndex] = useState(0);
  const [sandboxText, setSandboxText] = useState(data.synopsis || '');
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);
  const terminalEndRef = useRef(null);

  // Animate Terminal Logs
  useEffect(() => {
    setTerminalLogs([]);
    setTerminalIndex(0);
  }, [data]);

  useEffect(() => {
    if (terminalIndex < data.agent_logs.length) {
      const timeout = setTimeout(() => {
        setTerminalLogs(prev => [...prev, data.agent_logs[terminalIndex]]);
        setTerminalIndex(prev => prev + 1);
      }, 450); // delay per line
      return () => clearTimeout(timeout);
    }
  }, [terminalIndex, data]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  const handleSandboxSubmit = async () => {
    if (!sandboxText.trim() || sandboxText.trim().length < 10) return;
    setIsSandboxRunning(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onReAnalyze({
      ...data,
      synopsis: sandboxText
    });
    setIsSandboxRunning(false);
  };

  // SVG Chart Dimensions
  const chartWidth = 500;
  const chartHeight = 160;
  const paddingX = 45;
  const paddingY = 20;

  // X positions for 4 acts (evenly spaced)
  const getX = (index) => {
    const usableWidth = chartWidth - paddingX * 2;
    return paddingX + (index * (usableWidth / 3));
  };

  // Y positions for 0-100 score
  const getY = (val) => {
    const usableHeight = chartHeight - paddingY * 2;
    return chartHeight - paddingY - ((val / 100) * usableHeight);
  };

  // Generate SVG path for a specific emotion
  const getLinePath = (emotionKey) => {
    if (!data.emotional_arc || data.emotional_arc.length === 0) return '';
    return data.emotional_arc.map((point, index) => {
      const x = getX(index);
      const y = getY(point[emotionKey] || 0);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Circular Gauge Calculations
  const gaugeRadius = 36;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius; // 226.2

  const getStrokeDash = (score) => {
    const strokeValue = (score / 100) * gaugeCircumference;
    return `${strokeValue} ${gaugeCircumference}`;
  };

  const isHit = data.box_office_outcome === 'Blockbuster Hit' || data.box_office_outcome === 'Box Office Success';
  const outcomeClass = isHit ? 'hit' : 'flop';

  return (
    <div className="dashboard-grid">
      {/* Left Column */}
      <div className="dashboard-left">
        {/* Main Verdict & Performance */}
        <div className="glass-card verdict-widget">
          <div className="verdict-header">
            <h3 style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Commercial Viability Model
            </h3>
            {data.status === 'fallback' && (
              <span className="fallback-badge">Heuristic Simulation</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Project Success Rating
            </span>
            <div className={`verdict-badge ${outcomeClass}`}>
              {data.box_office_outcome.toUpperCase()}
            </div>
          </div>

          <div className="verdict-main">
            <div className="outcome-card">
              <span className="outcome-label">Hit Probability</span>
              <span className="outcome-value highlight-gold">{data.hit_probability}%</span>
              <span className="outcome-desc">Based on budget, cast draw, and emotional hooks.</span>
            </div>

            <div className="outcome-card">
              <span className="outcome-label">Est. Financial ROI</span>
              <span className="outcome-value">{data.predicted_roi}%</span>
              <div className="roi-meter-container">
                <div 
                  className="roi-meter-fill" 
                  style={{ width: `${Math.min(100, (data.predicted_roi / 400) * 100)}%` }}
                ></div>
              </div>
              <span className="outcome-desc">Predicted theatrical multiplier.</span>
            </div>
          </div>

          {/* Metric Circular Gauges */}
          <div className="gauges-grid">
            {/* Audience Score */}
            <div className="outcome-card gauge-card">
              <span className="gauge-name" style={{ marginBottom: '0.5rem' }}>Audience Appeal</span>
              <svg className="svg-gauge">
                <circle cx="45" cy="45" r={gaugeRadius} className="gauge-bg" />
                <circle 
                  cx="45" cy="45" 
                  r={gaugeRadius} 
                  className="gauge-fill audience" 
                  strokeDasharray={getStrokeDash(data.audience_score)}
                />
              </svg>
              <div className="gauge-val-text">{Math.round(data.audience_score)}%</div>
            </div>

            {/* Critics Score */}
            <div className="outcome-card gauge-card">
              <span className="gauge-name" style={{ marginBottom: '0.5rem' }}>Critic Appeal</span>
              <svg className="svg-gauge">
                <circle cx="45" cy="45" r={gaugeRadius} className="gauge-bg" />
                <circle 
                  cx="45" cy="45" 
                  r={gaugeRadius} 
                  className="gauge-fill critics" 
                  strokeDasharray={getStrokeDash(data.critical_score)}
                />
              </svg>
              <div className="gauge-val-text">{Math.round(data.critical_score)}%</div>
            </div>

            {/* Emotional Resonance */}
            <div className="outcome-card gauge-card">
              <span className="gauge-name" style={{ marginBottom: '0.5rem' }}>Resonance Fit</span>
              <svg className="svg-gauge">
                <circle cx="45" cy="45" r={gaugeRadius} className="gauge-bg" />
                <circle 
                  cx="45" cy="45" 
                  r={gaugeRadius} 
                  className="gauge-fill resonance" 
                  strokeDasharray={getStrokeDash(data.emotional_resonance)}
                />
              </svg>
              <div className="gauge-val-text">{Math.round(data.emotional_resonance)}%</div>
            </div>
          </div>
        </div>

        {/* Emotional Arc Curve Line Chart */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <div className="chart-title-group">
              <h3>Screenplay Emotional Curve</h3>
              <p>Trajectory of primary emotions across screen elements</p>
            </div>
            <div className="chart-legend">
              <div className="legend-item"><span className="legend-color joy"></span><span>Joy</span></div>
              <div className="legend-item"><span className="legend-color sadness"></span><span>Drama</span></div>
              <div className="legend-item"><span className="legend-color suspense"></span><span>Suspense</span></div>
            </div>
          </div>

          <div className="svg-chart-container">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg-main">
              {/* Y Axis Grid lines */}
              {[0, 25, 50, 75, 100].map(val => (
                <g key={val}>
                  <line 
                    x1={paddingX} 
                    y1={getY(val)} 
                    x2={chartWidth - paddingX} 
                    y2={getY(val)} 
                    className="chart-grid-line"
                  />
                  <text 
                    x={paddingX - 10} 
                    y={getY(val) + 3} 
                    textAnchor="end" 
                    className="chart-label-y"
                  >
                    {val}%
                  </text>
                </g>
              ))}

              {/* X Axis Checkpoints */}
              {data.emotional_arc.map((point, index) => (
                <g key={index}>
                  <line 
                    x1={getX(index)} 
                    y1={paddingY} 
                    x2={getX(index)} 
                    y2={chartHeight - paddingY} 
                    className="chart-grid-line" 
                  />
                  <text 
                    x={getX(index)} 
                    y={chartHeight - 4} 
                    textAnchor="middle" 
                    className="chart-label-x"
                  >
                    {point.checkpoint.split(': ')[1] || point.checkpoint}
                  </text>
                </g>
              ))}

              {/* Emotional lines */}
              <path d={getLinePath('joy')} className="chart-line joy" />
              <path d={getLinePath('drama')} className="chart-line sadness" />
              <path d={getLinePath('suspense')} className="chart-line suspense" />

              {/* Node points */}
              {data.emotional_arc.map((point, index) => (
                <g key={index}>
                  <circle cx={getX(index)} cy={getY(point.joy)} r="4" className="chart-point joy" />
                  <circle cx={getX(index)} cy={getY(point.drama)} r="4" className="chart-point sadness" />
                  <circle cx={getX(index)} cy={getY(point.suspense)} r="4" className="chart-point suspense" />
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Detailed Insights & Breakdown */}
        <div className="glass-card insights-card">
          <h3>Screenplay Structural Analysis</h3>
          <div className="insight-summary">
            {data.executive_summary}
          </div>
          <div className="insight-split">
            <div className="insight-column strengths">
              <h4>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Core Strengths
              </h4>
              <p>{data.strengths}</p>
            </div>
            <div className="insight-column weaknesses">
              <h4>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Vulnerabilities
              </h4>
              <p>{data.weaknesses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="dashboard-right">
        {/* Agent Console */}
        <div className="glass-card terminal-card">
          <div className="terminal-header">
            <div className="terminal-buttons">
              <span className="terminal-dot close"></span>
              <span className="terminal-dot minimize"></span>
              <span className="terminal-dot maximize"></span>
            </div>
            <span className="terminal-title">cinemai-agent-session.log</span>
            <span style={{ width: '30px' }}></span>
          </div>
          <div className="terminal-body">
            {terminalLogs.map((log, index) => (
              <div key={index} className="terminal-log-row">
                <span className="terminal-prompt">&gt;</span>
                {log}
              </div>
            ))}
            {terminalIndex < data.agent_logs.length && (
              <div className="terminal-log-row">
                <span className="terminal-prompt">&gt;</span>
                <span className="terminal-cursor"></span>
              </div>
            )}
            <div ref={terminalEndRef}></div>
          </div>
        </div>

        {/* Script Doctor Recommendations */}
        <div className="glass-card recs-card">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
            Agent Script-Doctor Fixes
          </h3>
          <div className="recs-list">
            {data.agent_recommendations.map((rec, i) => (
              <div key={i} className="rec-item">
                <span className="rec-number">0{i+1}</span>
                <p className="rec-text">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Plot Sandbox */}
        <div className="glass-card sandbox-card">
          <div className="sandbox-header">
            <h3>Interactive Script Sandbox</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>
              Live Recalculator
            </span>
          </div>
          <div className="sandbox-body">
            <textarea 
              rows="5"
              value={sandboxText}
              onChange={(e) => setSandboxText(e.target.value)}
              placeholder="Paste modified scenes or change characters and run simulation..."
              disabled={isSandboxRunning}
            />
          </div>
          <div className="sandbox-footer">
            <button 
              className="action-btn secondary" 
              onClick={onReset}
              disabled={isSandboxRunning}
            >
              Analyze New Film
            </button>
            <button 
              className="action-btn primary" 
              onClick={handleSandboxSubmit}
              disabled={isSandboxRunning || sandboxText.trim().length < 10 || sandboxText === data.synopsis}
            >
              {isSandboxRunning ? 'Simulating Sandbox...' : 'Re-Run Simulation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
