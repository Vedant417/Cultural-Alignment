"use client";
import { CountryOption } from "@/types";

export const COUNTRIES: CountryOption[] = [
  // South Asia
  { name: "India",         flag: "🇮🇳", group: "South Asia"   },
  { name: "Bangladesh",    flag: "🇧🇩", group: "South Asia"   },
  { name: "Pakistan",      flag: "🇵🇰", group: "South Asia"   },
  // East Asia
  { name: "Japan",         flag: "🇯🇵", group: "East Asia"    },
  { name: "South Korea",   flag: "🇰🇷", group: "East Asia"    },
  { name: "China",         flag: "🇨🇳", group: "East Asia"    },
  { name: "Singapore",     flag: "🇸🇬", group: "East Asia"    },
  // Europe
  { name: "France",        flag: "🇫🇷", group: "Europe"       },
  { name: "Germany",       flag: "🇩🇪", group: "Europe"       },
  { name: "Italy",         flag: "🇮🇹", group: "Europe"       },
  { name: "Spain",         flag: "🇪🇸", group: "Europe"       },
  { name: "United Kingdom",flag: "🇬🇧", group: "Europe"       },
  { name: "Russia",        flag: "🇷🇺", group: "Europe"       },
  // Americas
  { name: "United States", flag: "🇺🇸", group: "Americas"     },
  { name: "Brazil",        flag: "🇧🇷", group: "Americas"     },
  { name: "Mexico",        flag: "🇲🇽", group: "Americas"     },
  // Middle East / Africa
  { name: "UAE",           flag: "🇦🇪", group: "Middle East"  },
  { name: "Saudi Arabia",  flag: "🇸🇦", group: "Middle East"  },
  { name: "Egypt",         flag: "🇪🇬", group: "Middle East"  },
  // Oceania
  { name: "Australia",     flag: "🇦🇺", group: "Oceania"      },
];

const GROUPS = ["South Asia", "East Asia", "Europe", "Americas", "Middle East", "Oceania"];

interface Props {
  selected:  string;
  onChange:  (country: string) => void;
  disabled?: boolean;
}

export default function CountrySelector({ selected, onChange, disabled }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {GROUPS.map((group) => {
        const items = COUNTRIES.filter((c) => c.group === group);
        return (
          <div key={group}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#8896b3",
                        textTransform: "uppercase", letterSpacing: "0.1em",
                        marginBottom: "8px" }}>
              {group}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {items.map((c) => {
                const isSelected = selected === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => !disabled && onChange(c.name)}
                    disabled={disabled}
                    style={{
                      display:         "flex",
                      alignItems:      "center",
                      gap:             "6px",
                      padding:         "6px 12px",
                      borderRadius:    "8px",
                      border:          isSelected ? "1.5px solid #6366f1" : "1.5px solid #252d45",
                      background:      isSelected ? "#1e1f4a"             : "#141824",
                      color:           isSelected ? "#a5b4fc"             : "#8896b3",
                      fontSize:        "13px",
                      fontWeight:      isSelected ? 700                   : 400,
                      cursor:          disabled ? "not-allowed" : "pointer",
                      opacity:         disabled ? 0.5 : 1,
                      transition:      "all 0.15s",
                      boxShadow:       isSelected ? "0 0 12px rgba(99,102,241,0.25)" : "none",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}