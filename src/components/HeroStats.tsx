import React from 'react';
import { MonthSummary, ComplianceViolation, StationConfig, ShiftAssignment, Employee, TeamRequest } from '../types';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  CalendarDays, 
  BellRing,
  Activity,
  Building2,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeroStatsProps {
  monthSummary: MonthSummary;
  station: StationConfig;
  violations: ComplianceViolation[];
  assignments: ShiftAssignment[];
  employees: Employee[];
  requests: TeamRequest[];
  onViewViolations: () => void;
  onViewRequests: () => void;
  onOpenStationModal?: () => void;
}

export const HeroStats: React.FC<HeroStatsProps> = ({
  monthSummary,
  station,
  violations,
  assignments,
  employees,
  requests,
  onViewViolations,
  onViewRequests,
  onOpenStationModal
}) => {
  const { colorMode, designStyle } = useTheme();
  const isLight = colorMode === 'light';
  const isWin7 = designStyle === 'win7';

  const monthsHu = [
    'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
    'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
  ];

  const errorCount = violations.filter(v => v.severity === 'ERROR').length;
  const warningCount = violations.filter(v => v.severity === 'WARNING').length;

  const modifiedWithin120hCount = assignments.filter(a => a.isModifiedWithin120h).length;

  const approvedLeavesCount = requests.filter(
    r => r.status === 'APPROVED' && (r.type === 'ANNUAL_LEAVE' || r.type === 'BLOOD_DONOR_LEAVE' || r.type === 'SPECIAL_MAV_LEAVE')
  ).length;

  // Total scheduled work hours across all employees
  const totalWorkHours = assignments
    .filter(a => a.shiftTypeId !== 'PIH' && a.shiftTypeId !== 'SZAB' && a.shiftTypeId !== 'BETEG')
    .reduce((sum, a) => sum + a.durationHours, 0);

  // Common card styling depending on theme and mode
  const getCardBaseClass = (extraClasses: string = '') => {
    if (isWin7) {
      return isLight
        ? `bg-gradient-to-b from-white via-[#f4f8fc] to-[#e8f1fa] border border-[#a2c5ea] shadow-xs hover:border-[#5ca0e5] rounded transition-all ${extraClasses}`
        : `bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 shadow-md rounded hover:border-sky-500/50 transition-all ${extraClasses}`;
    }
    return isLight
      ? `bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm rounded-xl transition-all ${extraClasses}`
      : `bg-slate-950/70 border border-slate-800 rounded-lg hover:border-slate-700/80 transition-all ${extraClasses}`;
  };

  return (
    <section 
      aria-label="Vezénylési összefoglaló mérőszámok"
      className={`border-b transition-colors duration-150 no-print select-none ${
        isWin7
          ? isLight 
            ? 'bg-gradient-to-b from-[#e8f1fb] to-[#d7e6f5] border-[#9dbfe2]'
            : 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800'
          : isLight
            ? 'bg-slate-100/80 border-slate-200'
            : 'bg-slate-900 border-slate-800'
      } px-4 sm:px-6 lg:px-8 py-3.5`}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Context Strip: Aktív állomás, Vonal, Időszak & Határidő figyelmeztetés */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3.5 pb-2.5 border-b ${
          isLight ? 'border-slate-200/80' : 'border-slate-800/80'
        }`}>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <button
              type="button"
              onClick={onOpenStationModal}
              className={`flex items-center gap-1.5 font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                isLight 
                  ? 'bg-amber-100 hover:bg-amber-200/80 border border-amber-300 text-amber-900 shadow-2xs' 
                  : 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400'
              }`}
              title="Kattintson a szolgálati hely adatainak megtekintéséhez vagy új felvételéhez"
            >
              <Building2 className={`w-3.5 h-3.5 ${isLight ? 'text-amber-800' : 'text-amber-400'}`} />
              <span>{station.name}</span>
            </button>

            <span aria-hidden="true" className={isLight ? 'text-slate-400' : 'text-slate-600'}>·</span>
            
            <span className={`font-mono px-1.5 py-0.2 rounded text-[11px] font-semibold ${
              isLight ? 'bg-slate-200/70 text-slate-800' : 'bg-slate-800 text-slate-300'
            }`}>
              {station.lineCode}
            </span>

            <span aria-hidden="true" className={isLight ? 'text-slate-400' : 'text-slate-600'}>·</span>

            <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {station.category === 'MAJOR_HIGH_TRAFFIC' 
                ? 'Kiemelt 12/A állomás' 
                : station.category === 'DISPATCH_CENTER'
                ? 'Forgalomirányítási központ'
                : 'Általános állomás'}
            </span>

            <span aria-hidden="true" className={isLight ? 'text-slate-400' : 'text-slate-600'}>·</span>

            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
              {monthSummary.year}. {monthsHu[monthSummary.month]}
            </span>
          </div>

          {/* Legal Notice Deadline Alert (Közlési határidő) */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`flex items-center gap-1 font-medium ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
              <BellRing className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              Közlési határidő (KSz 28. § 1.):
            </span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded ${
              isLight 
                ? 'bg-white text-slate-900 border border-slate-300 shadow-2xs' 
                : 'bg-slate-800/80 text-amber-300 border border-slate-700'
            }`}>
              {monthSummary.publicationDeadlineDate}-ig
            </span>
          </div>
        </div>

        {/* 4 Quantitative Metric Tiles (Gyors infó kockák) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* 1. KOCKA: Havi Kötelező Óra */}
          <div className={getCardBaseClass('p-3.5 flex flex-col justify-between')}>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className={`font-semibold tracking-wide ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Havi Kötelező Óra
                </span>
                <span className={`p-1 rounded ${isLight ? 'bg-blue-50 text-blue-700' : 'bg-slate-800 text-slate-400'}`}>
                  <CalendarDays className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black font-mono tracking-tight tabular-nums ${
                  isLight ? 'text-slate-950' : 'text-white'
                }`}>
                  {monthSummary.statutoryRequiredHours}
                </span>
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  óra / fő
                </span>
              </div>
            </div>
            <p className={`text-[11px] font-medium mt-2 pt-2 border-t ${
              isLight ? 'text-slate-600 border-slate-100' : 'text-slate-400 border-slate-800/60'
            }`}>
              {monthSummary.workingDays} munkanap × 8 óra <span className="opacity-80">(KSz 24. § 1.b)</span>
            </p>
          </div>

          {/* 2. KOCKA: MÁV & Mt. Szabályosság */}
          <div 
            onClick={onViewViolations}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewViolations(); } }}
            className={`p-3.5 flex flex-col justify-between cursor-pointer rounded-xl transition-all shadow-xs ${
              errorCount > 0 
                ? isLight 
                  ? 'bg-rose-50/90 border border-rose-300 hover:bg-rose-100/90 hover:border-rose-400' 
                  : 'bg-rose-950/25 border border-rose-800/50 hover:bg-rose-950/40'
                : warningCount > 0 
                ? isLight 
                  ? 'bg-amber-50/90 border border-amber-300 hover:bg-amber-100/90 hover:border-amber-400' 
                  : 'bg-amber-950/25 border border-amber-800/50 hover:bg-amber-950/40'
                : isLight 
                  ? 'bg-emerald-50/90 border border-emerald-300 hover:bg-emerald-100/90 hover:border-emerald-400' 
                  : 'bg-emerald-950/25 border border-emerald-800/50 hover:bg-emerald-950/40'
            }`}
            title="Kattintson a szabályossági audit részleteihez"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className={`font-semibold tracking-wide ${
                  errorCount > 0 
                    ? isLight ? 'text-rose-950' : 'text-rose-200' 
                    : warningCount > 0 
                    ? isLight ? 'text-amber-950' : 'text-amber-200' 
                    : isLight ? 'text-emerald-950' : 'text-emerald-200'
                }`}>
                  MÁV & Mt. Szabályosság
                </span>
                <span className={`p-1 rounded ${
                  errorCount > 0 
                    ? isLight ? 'bg-rose-100 text-rose-700' : 'bg-rose-900/60 text-rose-300' 
                    : warningCount > 0 
                    ? isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-900/60 text-amber-300' 
                    : isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-900/60 text-emerald-300'
                }`}>
                  {errorCount > 0 ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : warningCount > 0 ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black font-mono tracking-tight tabular-nums ${
                  errorCount > 0 
                    ? isLight ? 'text-rose-800' : 'text-rose-400' 
                    : warningCount > 0 
                    ? isLight ? 'text-amber-800' : 'text-amber-400' 
                    : isLight ? 'text-emerald-800' : 'text-emerald-400'
                }`}>
                  {errorCount === 0 && warningCount === 0 ? '100% Megfelelő' : `${errorCount + warningCount} Észrevétel`}
                </span>
              </div>
            </div>
            <div className={`flex items-center justify-between text-[11px] font-semibold mt-2 pt-2 border-t ${
              errorCount > 0 
                ? isLight ? 'text-rose-800 border-rose-200/80' : 'text-rose-300 border-rose-900/40' 
                : warningCount > 0 
                ? isLight ? 'text-amber-800 border-amber-200/80' : 'text-amber-300 border-amber-900/40' 
                : isLight ? 'text-emerald-800 border-emerald-200/80' : 'text-emerald-300 border-emerald-900/40'
            }`}>
              <span>
                {errorCount > 0 
                  ? `${errorCount} tiltás · Ellenőrzés szükséges` 
                  : warningCount > 0 
                  ? `${warningCount} figyelmeztetés · Megnyitás` 
                  : '24/7 pihenőidők és keretek rendben'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
            </div>
          </div>

          {/* 3. KOCKA: Szabadságok & Igények */}
          <div 
            onClick={onViewRequests}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewRequests(); } }}
            className={getCardBaseClass('p-3.5 flex flex-col justify-between cursor-pointer')}
            title="Kattintson a szabadságok és igények kezeléséhez"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className={`font-semibold tracking-wide ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Szabadságok & Igények
                </span>
                <span className={`p-1 rounded ${isLight ? 'bg-amber-50 text-amber-700' : 'bg-slate-800 text-amber-400'}`}>
                  <Clock className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black font-mono tracking-tight tabular-nums ${
                  isLight ? 'text-slate-950' : 'text-white'
                }`}>
                  {approvedLeavesCount}
                </span>
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  jóváhagyva <span className="opacity-80">({requests.length} össz.)</span>
                </span>
              </div>
            </div>
            <div className={`flex items-center justify-between text-[11px] font-medium mt-2 pt-2 border-t ${
              isLight ? 'text-slate-600 border-slate-100' : 'text-slate-400 border-slate-800/60'
            }`}>
              <span>{employees.length} fős aktív vasúti személyzet</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
            </div>
          </div>

          {/* 4. KOCKA: Tervezett Munkaidő */}
          <div className={getCardBaseClass('p-3.5 flex flex-col justify-between')}>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className={`font-semibold tracking-wide ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Tervezett Munkaidő
                </span>
                <span className={`p-1 rounded ${isLight ? 'bg-sky-50 text-blue-700' : 'bg-slate-800 text-sky-400'}`}>
                  <Activity className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black font-mono tracking-tight tabular-nums ${
                  isLight ? 'text-blue-700' : 'text-sky-400'
                }`}>
                  {totalWorkHours}
                </span>
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  óra beosztva
                </span>
              </div>
            </div>
            <p className={`text-[11px] font-medium mt-2 pt-2 border-t ${
              modifiedWithin120hCount > 0 
                ? isLight 
                  ? 'text-amber-800 font-semibold border-slate-100' 
                  : 'text-amber-300 font-semibold border-slate-800/60'
                : isLight 
                  ? 'text-slate-600 border-slate-100' 
                  : 'text-slate-400 border-slate-800/60'
            }`}>
              {modifiedWithin120hCount > 0 
                ? `${modifiedWithin120hCount} db 120h-n belüli módosítás (KSz 29. §)`
                : '120h-n belüli módosítás nélkül'}
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
