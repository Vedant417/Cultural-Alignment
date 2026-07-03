"use client";

import { createContext, useContext } from "react";

const ThemeCtx = createContext({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeCtx.Provider
      value={{
        theme: "dark",
        toggle: () => {},
      }}
    >
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);