import React from 'react';
import { MonthSummary, ComplianceViolation, StationConfig, ShiftAssignment, Employee, TeamRequest } from '../types';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  CalendarDays, 
  BellRing,
  Activity,
  Building2
} from 'lucide-react';

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

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-4 no-print">
      <div className="max-w-7xl mx-auto">
        
        {/* Context Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <button
              onClick={onOpenStationModal}
              className="flex items-center gap-1.5 font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded cursor-pointer transition-colors"
              title="Kattintson a szolgálati hely adatainak megtekintéséhez vagy új felvételéhez"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{station.name}</span>
            </button>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-300">{station.lineCode}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300">
              {station.category === 'MAJOR_HIGH_TRAFFIC' 
                ? 'Kiemelt 12/A állomás' 
                : station.category === 'DISPATCH_CENTER'
                ? 'Forgalomirányítási központ'
                : 'Általános állomás'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-200 font-medium">{monthSummary.year}. {monthsHu[monthSummary.month]}</span>
          </div>

          {/* Legal Notice Deadline Alert */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              Közlési határidő (KSz 28. § 1.):
            </span>
            <span className="font-mono font-medium text-slate-200">
              {monthSummary.publicationDeadlineDate}-ig
            </span>
          </div>
        </div>

        {/* 4 Quantitative Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Tile 1: Required Monthly Hours */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Havi Kötelező Óra</span>
              <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-white tabular-nums">
                {monthSummary.statutoryRequiredHours}
              </span>
              <span className="text-xs text-slate-400">óra / fő</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {monthSummary.workingDays} munkanap × 8 óra (KSz 24. § 1.b)
            </p>
          </div>

          {/* Tile 2: Compliance Auditor Status */}
          <div 
            onClick={onViewViolations}
            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
              errorCount > 0 
                ? 'bg-rose-950/20 border-rose-800/40 hover:bg-rose-950/30' 
                : warningCount > 0 
                ? 'bg-amber-950/20 border-amber-800/40 hover:bg-amber-950/30'
                : 'bg-emerald-950/20 border-emerald-800/40 hover:bg-emerald-950/30'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>MÁV & Mt. Szabályosság</span>
              {errorCount > 0 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-bold font-mono tabular-nums ${
                errorCount > 0 ? 'text-rose-400' : warningCount > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {errorCount === 0 && warningCount === 0 ? '100% Megfelelő' : `${errorCount + warningCount} Észrevétel`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {errorCount > 0 
                ? `${errorCount} törvényszegés · Kattintson a vizsgálathoz` 
                : warningCount > 0 
                ? `${warningCount} figyelmeztetés · Kattintson` 
                : '24/7 pihenőidők és éjszakai határok betartva'}
            </p>
          </div>

          {/* Tile 3: Leaves & Preferences */}
          <div 
            onClick={onViewRequests}
            className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-lg p-3 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Szabadságok & Igények</span>
              <Clock className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-white tabular-nums">
                {approvedLeavesCount}
              </span>
              <span className="text-xs text-slate-400">jóváhagyva ({requests.length} összesen)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {employees.length} fős aktív vasúti személyzet
            </p>
          </div>

          {/* Tile 4: Total Scheduled Hours and 120h notice */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Tervezett Munkaidő</span>
              <Activity className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-sky-400 tabular-nums">
                {totalWorkHours}
              </span>
              <span className="text-xs text-slate-400">óra beosztva</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {modifiedWithin120hCount > 0 
                ? `${modifiedWithin120hCount} db 120h-n belüli módosítás (KSz 29. §)`
                : '120h-n belüli módosítás nélkül'}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
