"use client";

interface PopularityTrendChartProps {
  popularity?: number;
  title?: string;
  country?: string;
}

export default function PopularityTrendChart({
  popularity = 0,
  title = "Popularity",
  country = "United States",
}: PopularityTrendChartProps) {
  if (!popularity || popularity <= 0) return null;

  const regionalBoosts: Record<string, number> = {
    India: 1.0,
    Nepal: 0.72,
    Bangladesh: 0.76,
    Pakistan: 0.68,
    "Sri Lanka": 0.70,

    "United States": 0.52,
    Canada: 0.50,
    "United Kingdom": 0.58,

    Japan: 0.34,
    "South Korea": 0.36,
    China: 0.40,

    UAE: 0.75,
    "Saudi Arabia": 0.62,

    France: 0.46,
    Germany: 0.42,

    Australia: 0.48,
  };

const countryBoost = regionalBoosts[country] || 0.45;

const localizedPopularity =
  Math.min(
    100,
    (Math.log10(popularity + 1) * 85) * countryBoost
  );

const base = Math.max(localizedPopularity / 12, 1.2);
  // Scale popularity to 0-100 for display
  const normalizedPopularity = Math.min(localizedPopularity, 100);
  const percentage = Math.round(normalizedPopularity);

  // Generate mock trend data (simulates historical data since TMDB doesn't provide it)
  const generateTrendPoints = () => {
    const stages = [
      "Launch",
      "Buzz",
      "Peak",
      "Hype",
      "Streams",
      "Fans",
      "Social",
      "Legacy",
    ];

    // normalize TMDB popularity

    // create realistic blockbuster curve
    const curve = [
      0.72,
      0.85,
      0.98,
      1.12,
      1.05,
      0.92,
      0.84,
      0.76,
    ];

    return stages.map((stage, i) => ({
      x: i,
      y: +(base * curve[i]).toFixed(1),
      stage,
    }));
  };

  const trendPoints = generateTrendPoints();
  const maxY = Math.max(
    5,
    Math.max(...trendPoints.map((p) => p.y)) * 1.15
  );
  const SVG_WIDTH = 280;
  const SVG_HEIGHT = 120;
  const PADDING = { top: 12, right: 12, bottom: 20, left: 30 };

  const chartWidth = SVG_WIDTH - PADDING.left - PADDING.right;
  const chartHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;

  // Create path data for line chart
  const pathData = trendPoints
    .map((point, idx) => {
      const x = PADDING.left + (point.x / (trendPoints.length - 1)) * chartWidth;
      const y = PADDING.top + chartHeight - (point.y / maxY) * chartHeight;
      return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div style={{
      background: "var(--bg-2)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      padding: "20px",
      overflow: "hidden",
      width: "100%",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "14px" }}>
        <p style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "8px",
        }}>
          📈 Popularity Trend
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--accent)",
          }}>
            {localizedPopularity.toFixed(1)}
          </span>
          <span style={{
            fontSize: "13px",
            color: "var(--text-2)",
          }}>
            / 100
          </span>
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ overflow: "hidden", width: "100%" }}>
        <svg
          width="100%"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            display: "block", 
            overflow: "hidden",
            minHeight: "140px",
          }}
        >
        {/* Background grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = PADDING.top + chartHeight * (1 - ratio);
          return (
            <g key={`grid-${i}`}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={SVG_WIDTH - PADDING.right}
                y2={y}
                stroke="var(--border)"
                strokeWidth="0.5"
                opacity="0.3"
              />
              <text
                x={PADDING.left - 8}
                y={y + 3}
                fontSize="9"
                fill="var(--text-3)"
                textAnchor="end"
              >
                {Math.round(maxY * ratio)}
              </text>
            </g>
          );
        })}

        {/* Trend line */}
        <path
          d={pathData}
          stroke="var(--accent)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Trend area (under the line) */}
        <defs>
          <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: "var(--accent)", stopOpacity: 0.15 }} />
            <stop offset="100%" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <path
          d={`${pathData} L ${SVG_WIDTH - PADDING.right} ${PADDING.top + chartHeight} L ${PADDING.left} ${PADDING.top + chartHeight} Z`}
          fill="url(#trendGradient)"
        />

        {/* Data points */}
        {trendPoints.map((point, idx) => {
          const x = PADDING.left + (point.x / (trendPoints.length - 1)) * chartWidth;
          const y = PADDING.top + chartHeight - (point.y / maxY) * chartHeight;
          return (
            <circle
              key={`point-${idx}`}
              cx={x}
              cy={y}
              r="3"
              fill="var(--accent)"
              opacity={0.9}
            />
          );
        })}

        {/* X-axis labels (audience lifecycle) */}
        {trendPoints.map((point, idx) => {
          if (idx % 2 !== 0) return null;
          const x = PADDING.left + (point.x / (trendPoints.length - 1)) * chartWidth;
          return (
            <text
              key={`label-${idx}`}
              x={x}
              y={SVG_HEIGHT - 6}
              fontSize="7"
              fill="var(--text-3)"
              textAnchor="middle"
            >
              {point.stage}
            </text>
          );
        })}
        </svg>
      </div>

      {/* Footer */}
      <p style={{
        fontSize: "11px",
        color: "var(--text-3)",
        marginTop: "12px",
        fontStyle: "italic",
      }}>
        AI-estimated audience engagement lifecycle based on TMDB public popularity signals.
      </p>
    </div>
  );
}
