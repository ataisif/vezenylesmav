import React, { useState } from 'react';
import { Employee, ShiftAssignment, MonthSummary, StationConfig, SIGNALING_ROLES } from '../types';
import { calculateEmployeeWorkSummary } from '../utils/workTimeCalculator';
import { 
  Clock, 
  X, 
  CalendarDays, 
  Moon, 
  SunMedium, 
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Train,
  Cpu
} from 'lucide-react';

interface WorkTimeSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  assignments: ShiftAssignment[];
  monthSummary: MonthSummary;
  station: StationConfig;
}

export const WorkTimeSummaryModal: React.FC<WorkTimeSummaryModalProps> = ({
  isOpen,
  onClose,
  employees,
  assignments,
  monthSummary,
  station
}) => {
  const [deptFilter, setDeptFilter] = useState<'ALL' | 'TRAFFIC' | 'SIGNALING'>('ALL');

  if (!isOpen) return null;

  const monthsHu = [
    'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
    'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
  ];

  const filteredEmployees = employees.filter(e => {
    const isSignaling = e.department === 'SIGNALING' || SIGNALING_ROLES.some(r => r === e.role);
    if (deptFilter === 'SIGNALING') return isSignaling;
    if (deptFilter === 'TRAFFIC') return !isSignaling;
    return true;
  });

  const signalingCount = employees.filter(e => e.department === 'SIGNALING' || SIGNALING_ROLES.some(r => r === e.role)).length;
  const trafficCount = employees.filter(e => e.department !== 'SIGNALING' && !SIGNALING_ROLES.some(r => r === e.role)).length;

  const summaries = filteredEmployees.map(emp => 
    calculateEmployeeWorkSummary(emp, assignments, monthSummary)
  );

  const totalScheduledHours = summaries.reduce((s, r) => s + r.scheduledHours, 0);
  const totalNightHours = summaries.reduce((s, r) => s + r.nightHours, 0);
  const totalOvertimeHours = summaries.reduce((s, r) => s + r.overtimeHours, 0);
  const totalLeaveHours = summaries.reduce((s, r) => s + r.leaveHours, 0);
  const totalShiftsCount = summaries.reduce((s, r) => s + r.shiftsCount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Havi Vasúti Munkaidő és Műszak Mérleg</span>
                <span className="text-xs font-mono font-normal text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {station.name} · {monthSummary.year}. {monthsHu[monthSummary.month]}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kötelező órakeret (KSz 24. § 1.b: {monthSummary.statutoryRequiredHours}h), ledolgozott műszakok, éjszakai órák és túlórák kimutatása
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & 4 Summary Cards */}
        <div className="p-6 pb-2 space-y-3 bg-slate-950/40">
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 w-fit">
            <button
              onClick={() => setDeptFilter('ALL')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                deptFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Összes Munkatárs ({employees.length})
            </button>
            <button
              onClick={() => setDeptFilter('SIGNALING')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                deptFilter === 'SIGNALING'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Biztosítóberendezés TEB ({signalingCount})</span>
            </button>
            <button
              onClick={() => setDeptFilter('TRAFFIC')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                deptFilter === 'TRAFFIC'
                  ? 'bg-sky-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-sky-300'
              }`}
            >
              <Train className="w-3.5 h-3.5" />
              <span>Forgalom ({trafficCount})</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Összes Beosztott Óra</span>
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div className="text-xl font-bold font-mono text-white tabular-nums">
                {totalScheduledHours} <span className="text-xs font-normal text-slate-400">óra</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {totalShiftsCount} db teljesített vasúti műszak
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Éjszakai Órák (22-06)</span>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-xl font-bold font-mono text-indigo-400 tabular-nums">
                {totalNightHours} <span className="text-xs font-normal text-slate-400">óra</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                KSz 24. § 1.e éjszakai szolgálat
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Rendkívüli Munkaidő</span>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                {totalOvertimeHours} <span className="text-xs font-normal text-slate-400">óra</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Havi kötelező kereten felüli órák
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Szabadság & Távollét</span>
                <SunMedium className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                {totalLeaveHours} <span className="text-xs font-normal text-slate-400">óra</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                KSz 43. § órában elszámolt távollétek
              </p>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Törzsszám</th>
                  <th className="py-2.5 px-3">Munkavállaló</th>
                  <th className="py-2.5 px-3">Munkakör</th>
                  <th className="py-2.5 px-3 text-right">Kötelező (h)</th>
                  <th className="py-2.5 px-3 text-right">Beosztott (h)</th>
                  <th className="py-2.5 px-3 text-right">Műszak (db)</th>
                  <th className="py-2.5 px-3 text-right text-indigo-400">Éjszakai (h)</th>
                  <th className="py-2.5 px-3 text-right text-amber-400">Túlóra (h)</th>
                  <th className="py-2.5 px-3 text-right text-emerald-400">Szabadság (h)</th>
                  <th className="py-2.5 px-3 text-right">Egyenleg</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                {summaries.map((row) => {
                  const isBalancePositive = row.balanceHours > 0;
                  const isBalanceEqual = row.balanceHours === 0;
                  const isSignaling = row.department === 'SIGNALING' || SIGNALING_ROLES.some(r => r === row.role);

                  return (
                    <tr key={row.employeeId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {row.employeeNumber}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-white">
                        {row.employeeName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] ${
                          isSignaling 
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50' 
                            : 'bg-sky-950/60 text-sky-300 border border-sky-800/50'
                        }`}>
                          {isSignaling ? <Cpu className="w-3 h-3 text-emerald-400" /> : <Train className="w-3 h-3 text-sky-400" />}
                          <span>{row.role}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {row.requiredHours}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">
                        {row.scheduledHours}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {row.shiftsCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-300">
                        {row.nightHours}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-400 font-semibold">
                        {row.overtimeHours > 0 ? `+${row.overtimeHours}` : '0'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                        {row.leaveHours}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {isBalanceEqual ? (
                          <span className="text-slate-400">0</span>
                        ) : isBalancePositive ? (
                          <span className="text-amber-400">+{row.balanceHours} óra</span>
                        ) : (
                          <span className="text-rose-400">{row.balanceHours} óra</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-1">
            <p className="flex items-center gap-1.5 font-medium text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              MÁV Munkaidő elszámolási szabályok:
            </p>
            <p>• <strong>KSz 24. § 1.b:</strong> A havi kötelező óraszám az általános munkarend szerinti munkanapok száma szorozva a napi 8 órával.</p>
            <p>• <strong>KSz 43. § 1.:</strong> A szabadságok órában (napi 8 órával) kerülnek elszámolásra és beszámítanak a munkaidőkeret teljesítésébe.</p>
            <p>• <strong>KSz 35. § 1.:</strong> A kötelező órakeretet meghaladó munkaidő naptári évi maximuma 300 óra lehet.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Havi zárás és munkaidőkeret elszámolás MÁV KSz 26. § szerint</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Bezárás
          </button>
        </div>

      </div>
    </div>
  );
};
