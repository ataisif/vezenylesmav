import React from 'react';
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
  Plus
} from 'lucide-react';
import { StationConfig } from '../types';

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
  violationCount,
  isGenerating = false
}) => {
  const monthsHu = [
    'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
    'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30 no-print">
      {/* Main Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                MÁV PÁLYAMŰKÖDTETÉS
              </span>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                Kollektív Szerződés Vezényléstervező
              </p>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Vezénylési Rács</span>
            </button>

            <button
              onClick={() => setActiveTab('compliance')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap relative cursor-pointer ${
                activeTab === 'compliance'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Szabályossági Audit</span>
              {violationCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">
                  {violationCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('leaves')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'leaves'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Szabadságok & Igények</span>
            </button>

            <button
              onClick={() => setActiveTab('worktime')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'worktime'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Munkaidő Mérleg</span>
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>MÁV KSz Szabálytár</span>
            </button>
          </nav>

          {/* Zone 3: Primary Actions and Selectors */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Station selector & Add Station button group */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
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
                className="bg-transparent text-slate-200 text-xs px-2 py-1 focus:outline-none max-w-[140px] sm:max-w-[190px] truncate"
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
                title="Szolgálati helyek beállítása és új állomás hozzáadása"
                className="p-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors flex items-center gap-0.5 text-xs font-medium ml-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Új hely</span>
              </button>
            </div>

            {/* Month & Year Selectors */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-slate-200 text-xs px-2 py-1 focus:outline-none"
              >
                <option value={2025} className="bg-slate-900">2025</option>
                <option value={2026} className="bg-slate-900">2026</option>
              </select>
              <span className="text-slate-600 text-xs">/</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-slate-200 text-xs px-2 py-1 focus:outline-none"
              >
                {monthsHu.map((m, idx) => (
                  <option key={idx} value={idx} className="bg-slate-900">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Team manager button */}
            <button
              onClick={onOpenTeamModal}
              title="Vasúti munkavállalók és munkarendek szerkesztése"
              className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" />
            </button>

            {/* CSV export */}
            <button
              onClick={onExportCSV}
              title="Exportálás Excel-kompatibilis CSV formátumban"
              className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            {/* Print button */}
            <button
              onClick={onPrint}
              title="Hivatalos MÁV Havi Vezénylési Lap nyomtatása / PDF"
              className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Primary Action Button: Smart Schedule Auto-Generator */}
            <button
              onClick={onAutoGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Tervezés...' : 'Automatikus Tervezés'}</span>
            </button>

          </div>
        </div>
      </div>

      {/* Mobile navigation bar */}
      <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-800 gap-2 bg-slate-950">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-3 py-1 text-xs rounded whitespace-nowrap ${activeTab === 'schedule' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
        >
          Vezénylés
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`px-3 py-1 text-xs rounded whitespace-nowrap ${activeTab === 'compliance' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
        >
          Audit ({violationCount})
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-3 py-1 text-xs rounded whitespace-nowrap ${activeTab === 'leaves' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
        >
          Szabadságok
        </button>
        <button
          onClick={() => setActiveTab('worktime')}
          className={`px-3 py-1 text-xs rounded whitespace-nowrap ${activeTab === 'worktime' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
        >
          Munkaidő Mérleg
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-3 py-1 text-xs rounded whitespace-nowrap ${activeTab === 'rules' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
        >
          MÁV Szabálytár
        </button>
        <button
          onClick={onOpenStationModal}
          className="px-3 py-1 text-xs rounded whitespace-nowrap bg-amber-500/10 text-amber-300 border border-amber-500/30"
        >
          + Szolgálati helyek
        </button>
      </div>
    </header>
  );
};
