"use client";

export const COUNTRIES = [
  { name: "India",          flag: "🇮🇳", group: "South Asia"  },
  { name: "Bangladesh",     flag: "🇧🇩", group: "South Asia"  },
  { name: "Pakistan",       flag: "🇵🇰", group: "South Asia"  },
  { name: "Japan",          flag: "🇯🇵", group: "East Asia"   },
  { name: "South Korea",    flag: "🇰🇷", group: "East Asia"   },
  { name: "China",          flag: "🇨🇳", group: "East Asia"   },
  { name: "Singapore",      flag: "🇸🇬", group: "East Asia"   },
  { name: "France",         flag: "🇫🇷", group: "Europe"      },
  { name: "Germany",        flag: "🇩🇪", group: "Europe"      },
  { name: "Italy",          flag: "🇮🇹", group: "Europe"      },
  { name: "Spain",          flag: "🇪🇸", group: "Europe"      },
  { name: "United Kingdom", flag: "🇬🇧", group: "Europe"      },
  { name: "Russia",         flag: "🇷🇺", group: "Europe"      },
  { name: "United States",  flag: "🇺🇸", group: "Americas"   },
  { name: "Brazil",         flag: "🇧🇷", group: "Americas"   },
  { name: "Mexico",         flag: "🇲🇽", group: "Americas"   },
  { name: "UAE",            flag: "🇦🇪", group: "Middle East" },
  { name: "Saudi Arabia",   flag: "🇸🇦", group: "Middle East" },
  { name: "Egypt",          flag: "🇪🇬", group: "Middle East" },
  { name: "Australia",      flag: "🇦🇺", group: "Oceania"    },
];

const GROUPS = ["South Asia","East Asia","Europe","Americas","Middle East","Oceania"];

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
        <label style={{
          fontSize:      "11px",
          fontWeight:    700,
          color:         "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}>
          {label}
        </label>
      )}

      <div style={{ position: "relative", display: "inline-block" }}>
        {/* Flag overlay */}
        {current && (
          <span style={{
            position:      "absolute",
            left:          "12px",
            top:           "50%",
            transform:     "translateY(-50%)",
            fontSize:      "18px",
            pointerEvents: "none",
            zIndex:        1,
          }}>
            {current.flag}
          </span>
        )}

        <select
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{
            appearance:       "none",
            WebkitAppearance: "none",
            /* ── theme-aware ── */
            background:       "var(--input-bg)",
            color:            "var(--text)",
            border:           "1.5px solid var(--border)",
            /* ── fixed ── */
            borderRadius:     "11px",
            padding:          "10px 38px 10px 44px",
            fontSize:         "14px",
            fontWeight:       600,
            cursor:           disabled ? "not-allowed" : "pointer",
            opacity:          disabled ? 0.5 : 1,
            minWidth:         "200px",
            outline:          "none",
            transition:       "border-color 0.15s, box-shadow 0.15s",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--accent)";
            e.target.style.boxShadow   = "0 0 0 3px var(--accent-dim)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--border)";
            e.target.style.boxShadow   = "none";
          }}
        >
          {GROUPS.map((group) => (
            <optgroup key={group} label={`── ${group} ──`}>
              {COUNTRIES.filter((c) => c.group === group).map((c) => (
                <option key={c.name} value={c.name}>
                  {c.flag}  {c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Chevron */}
        <span style={{
          position:      "absolute",
          right:         "12px",
          top:           "50%",
          transform:     "translateY(-50%)",
          color:         "var(--text-3)",
          pointerEvents: "none",
          fontSize:      "11px",
        }}>
          ▼
        </span>
      </div>
    </div>
  );
}