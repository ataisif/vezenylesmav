import React, { createContext, useContext, useState, useEffect } from 'react';

export type ColorMode = 'dark' | 'light';

export interface ThemeContextType {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_MODE_KEY = 'mav_sched_color_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    const saved = localStorage.getItem(STORAGE_MODE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
    localStorage.setItem(STORAGE_MODE_KEY, mode);
  };

  const toggleColorMode = () => {
    setColorMode(colorMode === 'dark' ? 'light' : 'dark');
  };

  // Sync classes and attributes to document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Clean up any legacy Win7 or old theme classes
    root.classList.remove('theme-modern', 'theme-win7', 'theme-dark', 'theme-light', 'dark', 'light');
    
    // Add current color mode classes
    root.classList.add(`theme-${colorMode}`);
    if (colorMode === 'dark') {
      root.classList.add('dark');
    }
    
    root.setAttribute('data-color-mode', colorMode);
    root.removeAttribute('data-design-style');
    // Remove obsolete storage key
    localStorage.removeItem('mav_sched_design_style');
  }, [colorMode]);

  return (
    <ThemeContext.Provider
      value={{
        colorMode,
        setColorMode,
        toggleColorMode
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
