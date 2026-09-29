import React, { createContext, useContext, useState, useEffect } from 'react';

export type DesignStyle = 'modern' | 'win7';
export type ColorMode = 'dark' | 'light';

export interface ThemeContextType {
  designStyle: DesignStyle;
  colorMode: ColorMode;
  setDesignStyle: (style: DesignStyle) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  toggleDesignStyle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_STYLE_KEY = 'mav_sched_design_style';
const STORAGE_MODE_KEY = 'mav_sched_color_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [designStyle, setDesignStyleState] = useState<DesignStyle>(() => {
    const saved = localStorage.getItem(STORAGE_STYLE_KEY);
    return saved === 'win7' ? 'win7' : 'modern';
  });

  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    const saved = localStorage.getItem(STORAGE_MODE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  const setDesignStyle = (style: DesignStyle) => {
    setDesignStyleState(style);
    localStorage.setItem(STORAGE_STYLE_KEY, style);
  };

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
    localStorage.setItem(STORAGE_MODE_KEY, mode);
  };

  const toggleColorMode = () => {
    setColorMode(colorMode === 'dark' ? 'light' : 'dark');
  };

  const toggleDesignStyle = () => {
    setDesignStyle(designStyle === 'modern' ? 'win7' : 'modern');
  };

  // Sync classes and attributes to document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing classes
    root.classList.remove('theme-modern', 'theme-win7', 'theme-dark', 'theme-light');
    
    // Add current classes
    root.classList.add(`theme-${designStyle}`);
    root.classList.add(`theme-${colorMode}`);
    
    root.setAttribute('data-design-style', designStyle);
    root.setAttribute('data-color-mode', colorMode);
  }, [designStyle, colorMode]);

  return (
    <ThemeContext.Provider
      value={{
        designStyle,
        colorMode,
        setDesignStyle,
        setColorMode,
        toggleColorMode,
        toggleDesignStyle
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
