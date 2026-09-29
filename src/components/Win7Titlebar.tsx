import React from 'react';
import { Train, Minus, Square, X, Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { StationConfig } from '../types';

interface Win7TitlebarProps {
  station: StationConfig;
}

export const Win7Titlebar: React.FC<Win7TitlebarProps> = ({ station }) => {
  const { colorMode, toggleColorMode, toggleDesignStyle } = useTheme();

  return (
    <div className="win7-titlebar-container select-none no-print border-b border-sky-900/40 relative z-50">
      {/* Specular glass reflection bar across the top */}
      <div className="h-7 px-2.5 flex items-center justify-between text-xs win7-glass-bar">
        {/* Left: Window Icon & Title */}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-gradient-to-b from-sky-400 to-sky-700 p-0.5 shadow-xs flex items-center justify-center text-white shrink-0 border border-sky-300/60">
            <Train className="w-3 h-3 drop-shadow" />
          </div>
          <span className="font-semibold tracking-wide win7-title-text truncate max-w-[280px] sm:max-w-md">
            MÁV KSz Vezényléstervező — {station.name} ({station.lineCode})
          </span>
          <span className="hidden md:inline-block text-[11px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-800 dark:text-sky-200 border border-sky-400/30 font-medium">
            Windows 7 Aero
          </span>
        </div>

        {/* Center: Quick Theme & Mode Switcher right in the titlebar */}
        <div className="hidden sm:flex items-center gap-1.5 mx-2">
          <button
            type="button"
            onClick={toggleColorMode}
            className="win7-titlebar-btn px-2 py-0.5 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
            title={colorMode === 'dark' ? 'Váltás Világos Módra (Light)' : 'Váltás Sötét Módra (Dark)'}
          >
            {colorMode === 'dark' ? (
              <>
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Világos Mód</span>
              </>
            ) : (
              <>
                <Moon className="w-3 h-3 text-sky-600" />
                <span>Sötét Mód</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleDesignStyle}
            className="win7-titlebar-btn px-2 py-0.5 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
            title="Visszaváltás a Modern MÁV dizájnra"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Modern MÁV Dizájn</span>
          </button>
        </div>

        {/* Right: Iconic Windows 7 Window Controls (Minimize, Maximize, Close) */}
        <div className="flex items-center -mr-1.5 h-full">
          <button
            type="button"
            className="win7-sys-btn win7-min-btn"
            title="Kis méret"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            type="button"
            className="win7-sys-btn win7-max-btn"
            title="Teljes méret"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            type="button"
            className="win7-sys-btn win7-close-btn"
            title="Visszatérés a Modern nézetbe"
            onClick={toggleDesignStyle}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
