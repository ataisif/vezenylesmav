import React, { useState, useRef, useEffect } from 'react';
import { 
  Train, 
  Calendar, 
  Sparkles, 
  FileSpreadsheet, 
  Printer, 
  ShieldCheck, 
  Users, 
  Clock, 
  BookOpen,
  BarChart3,
  Building2,
  Plus,
  ChevronDown,
  Layers,
  Sun,
  Moon
} from 'lucide-react';
import { StationConfig } from '../types';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  activeTab: 'schedule' | 'compliance' | 'leaves' | 'worktime' | 'rules';
  setActiveTab: (tab: 'schedule' | 'compliance' | 'leaves' | 'worktime' | 'rules') => void;
  stations: StationConfig[];
  selectedStation: StationConfig;
  setSelectedStation: (station: StationConfig) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  onAutoGenerate: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
  onOpenTeamModal: () => void;
  onOpenStationModal: () => void;
  onOpenLeavesModal: () => void;
  onOpenWorkTimeModal: () => void;
  onOpenRulesDrawer: () => void;
  violationCount: number;
  isGenerating?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  stations,
  selectedStation,
  setSelectedStation,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  onAutoGenerate,
  onExportCSV,
  onPrint,
  onOpenTeamModal,
  onOpenStationModal,
  onOpenLeavesModal,
  onOpenWorkTimeModal,
  onOpenRulesDrawer,
  violationCount,
  isGenerating = false
}) => {
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const { colorMode, toggleColorMode } = useTheme();

  const monthsHu = [
    'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
    'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
  ];

  // Close dropdown on click outside and escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur sticky top-0 z-40 no-print select-none">
      {/* 1. SOR: Szolgálati hely, Időszak, Tervezés & Globális Vezérlők (Minden balra igazítva) */}
      <div className="px-4 sm:px-6 py-2 border-b border-slate-800/70">
        <div className="flex items-center justify-start gap-2.5 flex-wrap">
          
          {/* MÁV Brand Wordmark - kompakt bal sarok */}
          <div className="flex items-center gap-2 shrink-0 pr-1">
            <div className="h-7 w-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Train className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold tracking-tight text-white">
                MÁV PÁLYAMŰKÖDTETÉS
              </span>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                KSz Vezényléstervező
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800 shrink-0" aria-hidden="true" />

          {/* Szolgálati hely választó & + Új hely */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-md p-0.5 shrink-0">
            <div className="pl-1.5 pr-0.5 text-amber-400/80 shrink-0" title="Aktív állomás">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedStation.id}
              onChange={(e) => {
                if (e.target.value === '__add_new__') {
                  onOpenStationModal();
                  return;
                }
                const s = stations.find(item => item.id === e.target.value);
                if (s) setSelectedStation(s);
              }}
              className="bg-transparent text-slate-200 text-xs px-1.5 py-1 focus:outline-none max-w-[150px] sm:max-w-[200px] truncate cursor-pointer font-medium"
              title="Szolgálati hely kiválasztása"
            >
              {stations.map((st) => (
                <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                  {st.name} {st.category === 'MAJOR_HIGH_TRAFFIC' ? '★ (12/A)' : ''}
                </option>
              ))}
              <option value="__add_new__" className="bg-slate-900 text-amber-400 font-semibold">
                + Új szolgálati hely felvétele...
              </option>
            </select>

            <button
              type="button"
              onClick={onOpenStationModal}
              title="Szolgálati hely konfigurálása és új állomás felvétele"
              className="px-1.5 py-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded text-[11px] font-semibold transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Új hely</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 shrink-0" aria-hidden="true" />

          {/* Év & Hónap választó */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-md p-0.5 shrink-0">
            <div className="pl-1.5 pr-0.5 text-slate-400 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-slate-200 text-xs px-1.5 py-1 focus:outline-none cursor-pointer font-medium"
              title="Év"
            >
              <option value={2025} className="bg-slate-900">2025</option>
              <option value={2026} className="bg-slate-900">2026</option>
            </select>
            <span className="text-slate-600 text-xs px-0.5">/</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-slate-200 text-xs px-1.5 py-1 focus:outline-none cursor-pointer font-medium"
              title="Hónap"
            >
              {monthsHu.map((m, idx) => (
                <option key={idx} value={idx} className="bg-slate-900">
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-800 shrink-0" aria-hidden="true" />

          {/* Fő Művelet: Automatikus Tervezés */}
          <button
            onClick={onAutoGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs px-3 py-1.5 rounded-md shadow-xs transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer shrink-0"
            title="Havi vezénylési rács automatikus feltöltése a MÁV KSz szabályai szerint"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Tervezés...' : 'Automatikus Tervezés'}</span>
          </button>

          {/* Dolgozók / Személyzet gomb */}
          <button
            onClick={onOpenTeamModal}
            title="Vasúti személyzet, képesítések és munkarendek kezelése"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Személyzet</span>
          </button>

          {/* Gyors Export & Nyomtatás ikonok */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onExportCSV}
              title="Exportálás Excel-kompatibilis CSV formátumban"
              className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onPrint}
              title="Hivatalos MÁV Havi Vezénylési Lap nyomtatása / PDF"
              className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 shrink-0" aria-hidden="true" />

          {/* Sötét / Világos Mód Váltó */}
          <button
            type="button"
            onClick={toggleColorMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 font-medium"
            title={colorMode === 'dark' ? 'Váltás Világos Módra (Light)' : 'Váltás Sötét Módra (Dark)'}
          >
            {colorMode === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Világos mód</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px]">Sötét mód</span>
              </>
            )}
          </button>

        </div>
      </div>

      {/* 2. SOR: Navigációs Fülek & Almenük (Teljesen balra igazítva, overflow nélkül a lenyíló menünek) */}
      <div className="px-4 sm:px-6 py-1 bg-slate-900/40 flex items-center justify-start gap-1 flex-wrap relative z-20">
        
        {/* Navigációs fül: Vezénylési Rács */}
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'schedule'
              ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-xs font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Vezénylési Rács</span>
        </button>

        {/* Navigációs fül: Szabályossági Audit */}
        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'compliance'
              ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-xs font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>Szabályossági Audit</span>
          {violationCount > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">
              {violationCount}
            </span>
          )}
        </button>

        {/* Navigációs fül: Szabadságok & Igények (modalt nyit meg) */}
        <button
          onClick={onOpenLeavesModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors whitespace-nowrap cursor-pointer shrink-0"
        >
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Szabadságok & Igények</span>
        </button>

        {/* Navigációs fül: Munkaidő Mérleg (modalt nyit meg) */}
        <button
          onClick={onOpenWorkTimeModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors whitespace-nowrap cursor-pointer shrink-0"
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Munkaidő Mérleg</span>
        </button>

        {/* Navigációs fül: MÁV KSz Szabálytár (fiókot nyit meg) */}
        <button
          onClick={onOpenRulesDrawer}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors whitespace-nowrap cursor-pointer shrink-0"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-300" />
          <span>MÁV KSz Szabálytár</span>
        </button>

        <div className="h-3.5 w-px bg-slate-800 shrink-0 mx-1" aria-hidden="true" />

        {/* Almenü: További Eszközök és Műveletek */}
        <div className="relative shrink-0" ref={toolsMenuRef}>
          <button
            type="button"
            onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              isToolsMenuOpen 
                ? 'bg-slate-800 text-amber-400 border border-slate-700' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>További Műveletek</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isToolsMenuOpen ? 'rotate-180 text-amber-400' : 'text-slate-400'}`} />
          </button>

          {/* Lenyíló almenü panel */}
          {isToolsMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150 backdrop-blur-md">
              <div className="px-3 py-1 border-b border-slate-800 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Adatkezelés & Export
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setIsToolsMenuOpen(false);
                  onExportCSV();
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-medium text-white">Excel / CSV Exportálás</div>
                  <div className="text-[10px] text-slate-400">Havi beosztás táblázatos letöltése</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsToolsMenuOpen(false);
                  onPrint();
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="font-medium text-white">Hivatalos Vezénylési Lap</div>
                  <div className="text-[10px] text-slate-400">A4 formátumú nyomtatás és PDF</div>
                </div>
              </button>

              <div className="px-3 py-1 border-t border-b border-slate-800 text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-1">
                Törzsadatok & Munkarendek
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsToolsMenuOpen(false);
                  onOpenTeamModal();
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-medium text-white">Dolgozók és Munkarendek</div>
                  <div className="text-[10px] text-slate-400">Képesítések, utazási idők, létszám</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsToolsMenuOpen(false);
                  onOpenStationModal();
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-medium text-white">Szolgálati Helyek Beállítása</div>
                  <div className="text-[10px] text-slate-400">Állomások, vonalszámok és műszakigények</div>
                </div>
              </button>

              <div className="px-3 py-1 border-t border-b border-slate-800 text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-1">
                Szabályozás & Igények
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsToolsMenuOpen(false);
                  onOpenLeavesModal();
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-medium text-white">Szabadságok & Műszakcserék</div>
                  <div className="text-[10px] text-slate-400">Kérelmek jóváhagyása és cserék kezelése</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsToolsMenuOpen(false);
                  onOpenWorkTimeModal();
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="font-medium text-white">Munkaidő Mérleg Kimutatás</div>
                  <div className="text-[10px] text-slate-400">Törvényes órák és túlórák áttekintése</div>
                </div>
              </button>

              <div className="px-3 py-1 border-t border-b border-slate-800 text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-1">
                Megjelenés
              </div>

              <div className="px-3 py-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    toggleColorMode();
                    setIsToolsMenuOpen(false);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer"
                >
                  {colorMode === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-sky-400" />}
                  <span>{colorMode === 'dark' ? 'Váltás Világos Módra' : 'Váltás Sötét Módra'}</span>
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  );
};
