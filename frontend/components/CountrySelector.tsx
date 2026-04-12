"use client";

export const COUNTRIES = [
  // South Asia
  { name: "India",          flag: "🇮🇳", group: "South Asia"  },
  { name: "Bangladesh",     flag: "🇧🇩", group: "South Asia"  },
  { name: "Pakistan",       flag: "🇵🇰", group: "South Asia"  },
  // East Asia
  { name: "Japan",          flag: "🇯🇵", group: "East Asia"   },
  { name: "South Korea",    flag: "🇰🇷", group: "East Asia"   },
  { name: "China",          flag: "🇨🇳", group: "East Asia"   },
  { name: "Singapore",      flag: "🇸🇬", group: "East Asia"   },
  // Europe
  { name: "France",         flag: "🇫🇷", group: "Europe"      },
  { name: "Germany",        flag: "🇩🇪", group: "Europe"      },
  { name: "Italy",          flag: "🇮🇹", group: "Europe"      },
  { name: "Spain",          flag: "🇪🇸", group: "Europe"      },
  { name: "United Kingdom", flag: "🇬🇧", group: "Europe"      },
  { name: "Russia",         flag: "🇷🇺", group: "Europe"      },
  // Americas
  { name: "United States",  flag: "🇺🇸", group: "Americas"   },
  { name: "Brazil",         flag: "🇧🇷", group: "Americas"   },
  { name: "Mexico",         flag: "🇲🇽", group: "Americas"   },
  // Middle East
  { name: "UAE",            flag: "🇦🇪", group: "Middle East" },
  { name: "Saudi Arabia",   flag: "🇸🇦", group: "Middle East" },
  { name: "Egypt",          flag: "🇪🇬", group: "Middle East" },
  // Oceania
  { name: "Australia",      flag: "🇦🇺", group: "Oceania"    },
];

const GROUPS = ["South Asia", "East Asia", "Europe", "Americas", "Middle East", "Oceania"];

interface Props {
  selected:  string;
  onChange:  (v: string) => void;
  disabled?: boolean;
  label?:    string;
}

export default function CountrySelector({ selected, onChange, disabled, label }: Props) {
  const current = COUNTRIES.find((c) => c.name === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && (
        <label style={{ fontSize: "12px", fontWeight: 600, color: "#8896b3" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "inline-block" }}>
        {/* Flag overlay */}
        {current && (
          <span style={{
            position:    "absolute",
            left:        "12px",
            top:         "50%",
            transform:   "translateY(-50%)",
            fontSize:    "18px",
            pointerEvents: "none",
            zIndex:      1,
          }}>
            {current.flag}
          </span>
        )}
        <select
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{
            appearance:    "none",
            WebkitAppearance: "none",
            background:    "#141824",
            border:        "1.5px solid #252d45",
            borderRadius:  "10px",
            padding:       "10px 40px 10px 42px",
            color:         "#f0f4ff",
            fontSize:      "14px",
            fontWeight:    600,
            cursor:        disabled ? "not-allowed" : "pointer",
            opacity:       disabled ? 0.5 : 1,
            minWidth:      "220px",
            outline:       "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
          onBlur={(e)  => (e.target.style.borderColor = "#252d45")}
        >
          {GROUPS.map((group) => (
            <optgroup key={group} label={`── ${group} ──`}>
              {COUNTRIES
                .filter((c) => c.group === group)
                .map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.flag}  {c.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        {/* Chevron icon */}
        <span style={{
          position:      "absolute",
          right:         "12px",
          top:           "50%",
          transform:     "translateY(-50%)",
          color:         "#8896b3",
          pointerEvents: "none",
          fontSize:      "12px",
        }}>
          ▼
        </span>
      </div>
    </div>
  );
}