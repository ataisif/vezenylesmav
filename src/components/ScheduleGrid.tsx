import React, { useState, useMemo } from 'react';
import { 
  Employee, 
  ShiftAssignment, 
  MonthSummary, 
  ComplianceViolation, 
  StationConfig,
  WorkPattern,
  SIGNALING_ROLES
} from '../types';
import { MAV_SHIFT_TYPES, HUNGARIAN_HOLIDAYS_MAP } from '../data/mavRegulations';
import { 
  Search, 
  Filter, 
  AlertCircle, 
  Lock, 
  Zap, 
  Plus, 
  Info,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Train,
  Cpu,
  Wrench,
  Flame,
  AlertTriangle,
  Layers,
  Eye,
  EyeOff,
  ArrowLeftRight
} from 'lucide-react';

interface ScheduleGridProps {
  employees: Employee[];
  assignments: ShiftAssignment[];
  monthSummary: MonthSummary;
  station: StationConfig;
  violations: ComplianceViolation[];
  onCellClick: (employee: Employee, dateStr: string, currentAssignment?: ShiftAssignment, mode?: 'edit' | 'swap') => void;
  onQuickAssignAllRest: () => void;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  employees,
  assignments,
  monthSummary,
  station,
  violations,
  onCellClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<'ALL' | 'TRAFFIC' | 'SIGNALING'>('ALL');
  
  // Heat-map State
  const [isHeatMapEnabled, setIsHeatMapEnabled] = useState(true);
  const [heatMapMode, setHeatMapMode] = useState<'ALL_HIGH' | '12H_ONLY' | 'NIGHT_ONLY'>('ALL_HIGH');
  const [showBottleneckRow, setShowBottleneckRow] = useState(true);

  const shiftMap = new Map(MAV_SHIFT_TYPES.map(s => [s.id, s]));

  // Helper to determine if a shift is high-intensity based on selected mode
  const isHighIntensityShift = (shiftTypeId: string): boolean => {
    const shift = shiftMap.get(shiftTypeId);
    if (!shift || shift.category !== 'WORK') return false;
    if (heatMapMode === 'NIGHT_ONLY') {
      return shift.isNightShift;
    }
    if (heatMapMode === '12H_ONLY') {
      return shift.durationHours >= 12;
    }
    // 'ALL_HIGH': 12h shifts, night shifts, emergency fault response & central dispatch
    return shift.durationHours >= 12 || shift.isNightShift || shift.id.includes('ZAVAR') || shift.id.includes('DISZP');
  };

  const employeeById = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  // Index assignments by `${employeeId}_${date}`
  const assignmentMap = new Map<string, ShiftAssignment>();
  assignments.forEach(a => {
    assignmentMap.set(`${a.employeeId}_${a.date}`, a);
  });

  // Precompute shift concentration for each (date, shiftTypeId)
  // Key: `${dateStr}_${shiftTypeId}` -> array of assigned employees
  const shiftConcentrationMap = useMemo(() => {
    const map = new Map<string, { employeeId: string; employeeName: string; role: string }[]>();
    assignments.forEach(a => {
      if (a.shiftTypeId === 'PIH' || !isHighIntensityShift(a.shiftTypeId)) return;
      const key = `${a.date}_${a.shiftTypeId}`;
      const existing = map.get(key) || [];
      const emp = employeeById.get(a.employeeId);
      existing.push({
        employeeId: a.employeeId,
        employeeName: emp?.name || a.employeeId,
        role: emp?.role || ''
      });
      map.set(key, existing);
    });
    return map;
  }, [assignments, employeeById, heatMapMode]);

  // Daily bottleneck analysis across all days in the current month
  const dailyBottlenecks = useMemo(() => {
    const dailyMap = new Map<string, {
      peakCount: number;
      peakShiftType?: string;
      peakShiftCode?: string;
      peakShiftName?: string;
      shiftsSummary: { shiftCode: string; shiftName: string; count: number; employeeNames: string[] }[];
      totalHighIntensityStaff: number;
    }>();

    for (let day = 1; day <= monthSummary.totalDays; day++) {
      const dateStr = `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAssignments = assignments.filter(a => a.date === dateStr && a.shiftTypeId !== 'PIH' && isHighIntensityShift(a.shiftTypeId));
      
      const countsByShift = new Map<string, { count: number; employeeNames: string[] }>();
      dayAssignments.forEach(a => {
        const existing = countsByShift.get(a.shiftTypeId) || { count: 0, employeeNames: [] };
        const emp = employeeById.get(a.employeeId);
        existing.count++;
        if (emp) existing.employeeNames.push(emp.name);
        countsByShift.set(a.shiftTypeId, existing);
      });

      let peakCount = 0;
      let peakShiftType: string | undefined = undefined;
      const shiftsSummary: { shiftCode: string; shiftName: string; count: number; employeeNames: string[] }[] = [];

      countsByShift.forEach((val, shiftId) => {
        const s = shiftMap.get(shiftId);
        shiftsSummary.push({
          shiftCode: s?.code || shiftId,
          shiftName: s?.name || shiftId,
          count: val.count,
          employeeNames: val.employeeNames
        });
        if (val.count > peakCount) {
          peakCount = val.count;
          peakShiftType = shiftId;
        }
      });

      shiftsSummary.sort((a, b) => b.count - a.count);

      dailyMap.set(dateStr, {
        peakCount,
        peakShiftType,
        peakShiftCode: peakShiftType ? shiftMap.get(peakShiftType)?.code : undefined,
        peakShiftName: peakShiftType ? shiftMap.get(peakShiftType)?.name : undefined,
        shiftsSummary,
        totalHighIntensityStaff: dayAssignments.length
      });
    }

    return dailyMap;
  }, [assignments, monthSummary, shiftMap, employeeById, heatMapMode]);

  // Total count of bottleneck days in this month where peakCount >= 2 or >= 4
  const bottleneckStats = useMemo(() => {
    let warningDays = 0;
    let criticalDays = 0;
    dailyBottlenecks.forEach(d => {
      if (d.peakCount >= 4) criticalDays++;
      else if (d.peakCount >= 2) warningDays++;
    });
    return { warningDays, criticalDays, totalBottleneckDays: warningDays + criticalDays };
  }, [dailyBottlenecks]);

  // Index violations by `${employeeId}_${date}`
  const violationMap = new Map<string, ComplianceViolation[]>();
  violations.forEach(v => {
    if (v.employeeId && v.date) {
      const key = `${v.employeeId}_${v.date}`;
      const existing = violationMap.get(key) || [];
      existing.push(v);
      violationMap.set(key, existing);
    }
  });

  // Unique roles for filtering
  const allRoles = Array.from(new Set(employees.map(e => e.role)));

  const signalingCount = employees.filter(e => e.department === 'SIGNALING' || SIGNALING_ROLES.some(r => r === e.role)).length;
  const trafficCount = employees.filter(e => e.department !== 'SIGNALING' && !SIGNALING_ROLES.some(r => r === e.role)).length;

  const filteredEmployees = employees.filter(emp => {
    const isSignaling = emp.department === 'SIGNALING' || SIGNALING_ROLES.some(r => r === emp.role);
    if (departmentFilter === 'SIGNALING' && !isSignaling) return false;
    if (departmentFilter === 'TRAFFIC' && isSignaling) return false;

    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRoleFilter === 'ALL' || emp.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const daysOfWeekHuShort = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'];

  const getWorkPatternName = (pattern: WorkPattern) => {
    switch (pattern) {
      case 'CONTINUOUS_4_SHIFT': return '4-brigád';
      case 'CONTINUOUS_12_24': return '12/24';
      case 'THREE_SHIFT': return '3-műszak';
      case 'TWO_SHIFT': return '2-műszak';
      case 'EXTENDED_SHIFT': return 'Nyújtott';
      case 'DISPATCHED': return 'Vezényelt';
      default: return 'Általános';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      
      {/* Grid Toolbar & Filters */}
      <div className="p-4 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Department Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setDepartmentFilter('ALL')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                departmentFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Összes ({employees.length})
            </button>
            <button
              onClick={() => setDepartmentFilter('SIGNALING')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                departmentFilter === 'SIGNALING'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Biztosítóberendezés TEB ({signalingCount})</span>
            </button>
            <button
              onClick={() => setDepartmentFilter('TRAFFIC')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                departmentFilter === 'TRAFFIC'
                  ? 'bg-sky-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-sky-300'
              }`}
            >
              <Train className="w-3.5 h-3.5" />
              <span>Forgalom ({trafficCount})</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Keresés név, törzsszám vagy munkakör alapján..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg pl-8 pr-3 py-1.5 w-60 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 max-w-[200px]"
            >
              <option value="ALL">Minden munkakör ({employees.length})</option>
              {allRoles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-2.5 text-[11px] text-slate-300">
          <span className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/40 px-1.5 py-0.5 rounded text-emerald-300 font-bold">
            <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block shadow-xs"></span>
            <span>P: Pihenő (zöld)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-sky-600 inline-block"></span>
            <span>N12 (12h)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-indigo-700 inline-block"></span>
            <span>É12 (12h)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-teal-600 inline-block"></span>
            <span>BB-K (8h karb.)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-cyan-600 inline-block"></span>
            <span>BB-HN (12h hibaelh.)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-800 inline-block"></span>
            <span>BB-HÉ (12h éjjel)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block"></span>
            <span>ADM (8h admin.)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
            <span>KÉSZ (készenlét)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-green-700 inline-block"></span>
            <span>SZAB (szabi)</span>
          </span>
        </div>
      </div>

      {/* Heat-map Controls & Bottleneck Legend Bar */}
      <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main Heat-Map Toggle Button */}
          <button
            onClick={() => setIsHeatMapEnabled(!isHeatMapEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              isHeatMapEnabled
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 ring-2 ring-orange-400/50 shadow-orange-950/40 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
            title="Kiemelt műszakkoncentráció és lefedettségi szűk keresztmetszetek hőtérképes kiemelése a beosztási sorokban"
          >
            <Flame className={`w-3.5 h-3.5 ${isHeatMapEnabled ? 'text-slate-950 fill-slate-950 animate-pulse' : 'text-slate-400'}`} />
            <span>Műszak Hőtérkép</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              isHeatMapEnabled ? 'bg-slate-950/25 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {isHeatMapEnabled ? 'AKTÍV' : 'KI'}
            </span>
          </button>

          {isHeatMapEnabled && (
            <>
              {/* Intensity Mode selector */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                <button
                  onClick={() => setHeatMapMode('ALL_HIGH')}
                  className={`px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                    heatMapMode === 'ALL_HIGH' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Minden 12 órás, éjszakai és operatív hibaelhárítási műszak elemzése"
                >
                  12h & Éjszaka
                </button>
                <button
                  onClick={() => setHeatMapMode('NIGHT_ONLY')}
                  className={`px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                    heatMapMode === 'NIGHT_ONLY' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Kizárólag éjszakai szolgálatok koncentrációjának elemzése (É12, ÉJ8, BB-HÉ, BBD-É)"
                >
                  Csak Éjszaka
                </button>
                <button
                  onClick={() => setHeatMapMode('12H_ONLY')}
                  className={`px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                    heatMapMode === '12H_ONLY' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Kizárólag a 12 órás hosszú műszakok elemzése"
                >
                  Csak 12h
                </button>
              </div>

              {/* Toggle Summary Row */}
              <button
                onClick={() => setShowBottleneckRow(!showBottleneckRow)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] border cursor-pointer transition-colors ${
                  showBottleneckRow 
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 font-medium' 
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
                title="Szűk keresztmetszet összegző sor megjelenítése a táblázat tetején"
              >
                <Layers className="w-3 h-3" />
                <span>Összesítő sáv</span>
              </button>

              {/* Status pill: Bottleneck days in month */}
              {bottleneckStats.totalBottleneckDays > 0 ? (
                <span className="flex items-center gap-1 px-2 py-1 rounded bg-orange-950/40 text-orange-300 border border-orange-800/60 text-[11px] font-medium">
                  <AlertTriangle className="w-3 h-3 text-orange-400" />
                  <span>{bottleneckStats.totalBottleneckDays} napon szűk keresztmetszet kockázat</span>
                  {bottleneckStats.criticalDays > 0 && (
                    <span className="bg-rose-500 text-white font-bold px-1 rounded text-[10px] ml-1">
                      {bottleneckStats.criticalDays} kritikus
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  ✓ Kiegyensúlyozott műszakterhelés
                </span>
              )}
            </>
          )}
        </div>

        {/* Heat-map legend scale */}
        {isHeatMapEnabled && (
          <div className="flex items-center flex-wrap gap-2 text-[11px] bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">Koncentráció (ugyanazon kiemelt műszakban):</span>
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-2 h-2 rounded bg-slate-700 inline-block"></span>
              <span>1 fő</span>
            </span>
            <span className="flex items-center gap-1 text-amber-300 font-medium">
              <span className="w-2 h-2 rounded bg-amber-400 inline-block shadow-xs shadow-amber-400/50"></span>
              <span>2 fő (Mérsékelt)</span>
            </span>
            <span className="flex items-center gap-1 text-orange-300 font-bold">
              <span className="w-2 h-2 rounded bg-orange-500 inline-block shadow-xs shadow-orange-500/50"></span>
              <span>3 fő (Magas)</span>
            </span>
            <span className="flex items-center gap-1 text-rose-300 font-bold">
              <span className="w-2 h-2 rounded bg-rose-500 inline-block shadow-xs shadow-rose-500/50 animate-pulse"></span>
              <span>4+ fő (Szűk keresztmetszet)</span>
            </span>
          </div>
        )}
      </div>

      {/* Interactive Table Container */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full border-collapse text-xs select-none">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800 text-slate-300">
              {/* Sticky Left: Employee Column */}
              <th className="sticky left-0 z-20 bg-slate-900 px-3 py-2.5 text-left font-semibold border-r border-slate-800 min-w-[210px] w-[210px] shadow-sm">
                <div className="flex items-center justify-between">
                  <span>Munkavállaló / Törzsszám</span>
                  <span className="text-[10px] font-normal text-slate-400">Óra / Keret</span>
                </div>
              </th>

              {/* Day Headers 1..N */}
              {Array.from({ length: monthSummary.totalDays }, (_, i) => i + 1).map(day => {
                const date = new Date(monthSummary.year, monthSummary.month, day);
                const dayOfWeek = date.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isSunday = dayOfWeek === 0;
                const dateStr = `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const holidayName = HUNGARIAN_HOLIDAYS_MAP[dateStr];
                const dayBottleneck = dailyBottlenecks.get(dateStr);

                return (
                  <th
                    key={day}
                    className={`min-w-[38px] w-[38px] px-1 py-1.5 text-center font-medium border-r border-slate-800/80 ${
                      holidayName 
                        ? 'bg-rose-950/40 text-rose-300' 
                        : isSunday 
                        ? 'bg-slate-800/80 text-amber-300' 
                        : isWeekend 
                        ? 'bg-slate-800/40 text-slate-300' 
                        : 'text-slate-400'
                    }`}
                    title={
                      (holidayName ? `Ünnepnap: ${holidayName} (120% pótlék)\n` : '') +
                      (dayBottleneck && dayBottleneck.peakCount >= 2 
                        ? `🔥 Hőtérkép csúcs: ${dayBottleneck.peakCount} fő (${dayBottleneck.peakShiftCode || 'Kiemelt műszak'})` 
                        : '')
                    }
                  >
                    <div className="text-[10px] uppercase font-mono">{daysOfWeekHuShort[dayOfWeek]}</div>
                    <div className={`text-xs font-mono font-bold ${holidayName ? 'text-rose-400' : ''}`}>
                      {day}
                    </div>
                    {holidayName && (
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mx-auto mt-0.5"></div>
                    )}
                    {/* Thermal intensity bar in day header */}
                    {isHeatMapEnabled && (
                      <div 
                        className={`h-1 w-full mt-1 rounded-full transition-all ${
                          dayBottleneck && dayBottleneck.peakCount >= 4 
                            ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)]' 
                            : dayBottleneck && dayBottleneck.peakCount === 3 
                            ? 'bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.8)]' 
                            : dayBottleneck && dayBottleneck.peakCount === 2 
                            ? 'bg-amber-400' 
                            : 'bg-transparent'
                        }`}
                      />
                    )}
                  </th>
                );
              })}

              {/* Summary Column */}
              <th className="px-2 py-2 text-center font-semibold bg-slate-900 border-l border-slate-800 min-w-[70px]">
                Összesen
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 bg-slate-950">
            {/* Daily High-Intensity Shift Heat-Map & Bottleneck Row */}
            {isHeatMapEnabled && showBottleneckRow && (
              <tr className="bg-slate-900/90 border-b-2 border-slate-800 text-xs">
                <td className="sticky left-0 z-20 bg-slate-900 px-3 py-2 border-r border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse shrink-0" />
                      <span className="font-bold text-amber-300 text-[11px]">Szűk Keresztmetszet Hőtérkép</span>
                    </div>
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400">
                      Csúcs
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Egyidejű kiemelt műszakterhelés
                  </div>
                </td>

                {Array.from({ length: monthSummary.totalDays }, (_, i) => i + 1).map(day => {
                  const dateStr = `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayData = dailyBottlenecks.get(dateStr);
                  const peakCount = dayData?.peakCount || 0;
                  const peakShiftCode = dayData?.peakShiftCode || '';

                  const isCritical = peakCount >= 4;
                  const isHigh = peakCount === 3;
                  const isModerate = peakCount === 2;

                  const tooltipText = dayData && dayData.shiftsSummary.length > 0
                    ? `🔥 ${dateStr} - Kiemelt műszakterhelés:\n` + 
                      dayData.shiftsSummary.map(s => `• ${s.shiftCode} (${s.shiftName}): ${s.count} fő [${s.employeeNames.join(', ')}]`).join('\n') +
                      (isHigh || isCritical ? '\n\n⚠️ Kockázat: Csúcsidőszaki létszámkoncentráció! A következő műszakban lefedettségi szűk keresztmetszet keletkezhet.' : '')
                    : `${dateStr}: Nincs kiemelt műszakkoncentráció`;

                  return (
                    <td
                      key={`bottleneck-${day}`}
                      className={`p-0.5 text-center border-r border-slate-800/80 transition-colors ${
                        isCritical
                          ? 'bg-rose-950/70'
                          : isHigh
                          ? 'bg-orange-950/60'
                          : isModerate
                          ? 'bg-amber-950/40'
                          : 'bg-slate-950/30'
                      }`}
                      title={tooltipText}
                    >
                      {peakCount >= 2 ? (
                        <div className={`h-6 rounded flex items-center justify-center font-mono font-bold text-[10px] px-0.5 shadow-xs ${
                          isCritical
                            ? 'bg-rose-600 text-white ring-1 ring-rose-400 animate-pulse'
                            : isHigh
                            ? 'bg-orange-500 text-slate-950 ring-1 ring-orange-300'
                            : 'bg-amber-400 text-slate-950'
                        }`}>
                          <span className="truncate">
                            {peakCount}×{peakShiftCode}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-600">-</span>
                      )}
                    </td>
                  );
                })}

                <td className="px-1 py-1 text-center font-mono text-[10px] text-amber-400 font-bold border-l border-slate-800 bg-slate-900">
                  {bottleneckStats.totalBottleneckDays}d
                </td>
              </tr>
            )}

            {filteredEmployees.map(emp => {
              // Calculate scheduled work hours for this employee
              const empAssignments = assignments.filter(a => a.employeeId === emp.id);
              const workHours = empAssignments
                .filter(a => a.shiftTypeId !== 'PIH')
                .reduce((sum, a) => sum + a.durationHours, 0);

              const hourDiff = workHours - monthSummary.statutoryRequiredHours;
              const hasEmployeeViolations = violations.some(v => v.employeeId === emp.id && v.severity === 'ERROR');

              return (
                <tr key={emp.id} className="hover:bg-slate-900/40 transition-colors group">
                  {/* Sticky Employee Name & Info */}
                  <td className="sticky left-0 z-10 bg-slate-950 group-hover:bg-slate-900 px-3 py-2 border-r border-slate-800 transition-colors">
                    <div className="flex items-center gap-2">
                      {emp.avatarUrl ? (
                        <img 
                          src={emp.avatarUrl} 
                          alt={emp.name} 
                          className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0" 
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center border border-slate-700 shrink-0">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                      
                      {/* Employee details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-200 truncate text-[12px] flex items-center gap-1" title={emp.name}>
                            {emp.name}
                            {hasEmployeeViolations && (
                              <span title="Szabálysértés található a beosztásban!">
                                <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                          {emp.department === 'SIGNALING' || SIGNALING_ROLES.some(r => r === emp.role) ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-400 font-medium truncate" title={emp.role}>
                              <Cpu className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{emp.role}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-sky-400 font-medium truncate" title={emp.role}>
                              <Train className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{emp.role}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
                          <span>{emp.employeeNumber}</span>
                          <span>·</span>
                          <span className="text-amber-400/80">{getWorkPatternName(emp.workPattern)}</span>
                        </div>
                      </div>

                      {/* Hours indicator */}
                      <div className="text-right shrink-0">
                        <span className={`text-[11px] font-mono font-bold tabular-nums ${
                          workHours > monthSummary.statutoryRequiredHours 
                            ? 'text-amber-400' 
                            : workHours < monthSummary.statutoryRequiredHours 
                            ? 'text-sky-400' 
                            : 'text-emerald-400'
                        }`}>
                          {workHours}h
                        </span>
                        <div className="text-[9px] font-mono text-slate-500 tabular-nums">
                          {hourDiff >= 0 ? `+${hourDiff}` : hourDiff}h
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Day cells */}
                  {Array.from({ length: monthSummary.totalDays }, (_, i) => i + 1).map(day => {
                    const dateStr = `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const assignment = assignmentMap.get(`${emp.id}_${dateStr}`);
                    const shift = assignment ? shiftMap.get(assignment.shiftTypeId) : undefined;
                    const cellViolations = violationMap.get(`${emp.id}_${dateStr}`) || [];
                    const hasError = cellViolations.some(v => v.severity === 'ERROR');
                    const hasWarning = cellViolations.some(v => v.severity === 'WARNING');

                    const isSunday = new Date(monthSummary.year, monthSummary.month, day).getDay() === 0;

                    // Heat-map bottleneck calculation for this specific cell
                    const isHighIntensity = assignment ? isHighIntensityShift(assignment.shiftTypeId) : false;
                    const sameShiftAssigned = (isHighIntensity && assignment) ? shiftConcentrationMap.get(`${dateStr}_${assignment.shiftTypeId}`) || [] : [];
                    const sameShiftCount = sameShiftAssigned.length;

                    const hasCriticalBottleneck = isHeatMapEnabled && isHighIntensity && sameShiftCount >= 4;
                    const hasHighConcentration = isHeatMapEnabled && isHighIntensity && sameShiftCount === 3;
                    const hasModerateConcentration = isHeatMapEnabled && isHighIntensity && sameShiftCount === 2;
                    const hasHeatIndicator = hasCriticalBottleneck || hasHighConcentration || hasModerateConcentration;

                    const bottleneckTooltip = hasHeatIndicator
                      ? `\n\n🔥 [HŐTÉRKÉP SZŰK KERESZTMETSZET]: Ezen a napon ${sameShiftCount} munkatárs dolgozik egyszerre ${shift?.name || 'kiemelt'} műszakban!\nÉrintett kollégák: ${sameShiftAssigned.map(s => s.employeeName).join(', ')}\n⚠️ Kockázat: A kiemelt műszakkoncentráció miatt a következő szolgálatban vagy pihenőidő-kötelezettség (KSz 41. § 12 órás pihenő) során lefedettségi szűk keresztmetszet keletkezhet!`
                      : '';

                    return (
                      <td
                        key={day}
                        onClick={() => onCellClick(emp, dateStr, assignment, 'edit')}
                        className={`p-0.5 text-center border-r border-slate-800/70 cursor-pointer relative group/cell hover:brightness-125 transition-all ${
                          hasCriticalBottleneck
                            ? 'bg-rose-950/20'
                            : hasHighConcentration
                            ? 'bg-orange-950/15'
                            : hasModerateConcentration
                            ? 'bg-amber-950/10'
                            : isSunday
                            ? 'bg-slate-900/30'
                            : ''
                        }`}
                        title={
                          assignment 
                            ? `${emp.name} - ${dateStr}\n${shift?.name || 'Műszak'}: ${assignment.startTime}-${assignment.endTime} (${assignment.durationHours}h)\n${assignment.note ? 'Megjegyzés: ' + assignment.note : ''}${cellViolations.length ? '\n⚠️ ' + cellViolations.map(v => v.title).join('\n') : ''}${bottleneckTooltip}\n💡 Tipp: Kattintson a szolgálat módosításához vagy műszakcsere indításához!` 
                            : `${emp.name} - ${dateStr} (Kattintson műszak hozzáadásához)`
                        }
                      >
                        {shift ? (
                          <div 
                            className={`h-7 rounded flex items-center justify-center font-mono font-semibold text-[11px] relative shadow-xs transition-all ${
                              hasCriticalBottleneck
                                ? 'ring-2 ring-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)]'
                                : hasHighConcentration
                                ? 'ring-2 ring-orange-500 shadow-[0_0_9px_rgba(249,115,22,0.6)]'
                                : hasModerateConcentration
                                ? 'ring-1 ring-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.45)]'
                                : ''
                            } ${
                              shift.category === 'REST' || shift.id === 'PIH'
                                ? 'bg-emerald-600 dark:bg-emerald-700 text-white font-bold border border-emerald-500/80 shadow-xs hover:bg-emerald-500'
                                : shift.id === 'BB_KARB'
                                ? 'bg-teal-600 text-white font-bold'
                                : shift.id === 'BB_ZAVAR_N'
                                ? 'bg-cyan-600 text-white font-bold'
                                : shift.id === 'BB_ZAVAR_E'
                                ? 'bg-indigo-800 text-white font-bold'
                                : shift.id === 'BB_DISZP_N'
                                ? 'bg-violet-600 text-white font-bold'
                                : shift.id === 'BB_DISZP_E'
                                ? 'bg-purple-900 text-white font-bold'
                                : shift.id === 'BB_ADMIN'
                                ? 'bg-blue-600 text-white font-bold'
                                : shift.id === 'KESZ'
                                ? 'bg-amber-500 text-slate-950 font-bold border border-amber-400'
                                : shift.id === 'UGY'
                                ? 'bg-orange-600 text-white font-bold'
                                : shift.id === 'N12'
                                ? 'bg-sky-600 text-white font-bold'
                                : shift.id === 'E12'
                                ? 'bg-indigo-700 text-white font-bold'
                                : shift.id === 'DE8'
                                ? 'bg-teal-700 text-white font-bold'
                                : shift.id === 'DU8'
                                ? 'bg-amber-600 text-white font-bold'
                                : shift.id === 'EJ8'
                                ? 'bg-purple-700 text-white font-bold'
                                : shift.id === 'NY12'
                                ? 'bg-blue-700 text-white font-bold'
                                : shift.id === 'SZAB'
                                ? 'bg-green-700 text-white font-black border border-green-600'
                                : shift.id === 'BETEG'
                                ? 'bg-rose-600 text-white font-bold'
                                : shift.id === 'VER'
                                ? 'bg-red-600 text-white font-bold'
                                : shift.id === 'KSZ_SZAB'
                                ? 'bg-emerald-800 text-white font-bold'
                                : shift.id === 'ORV'
                                ? 'bg-cyan-500 text-white font-bold'
                                : shift.id === 'OKT'
                                ? 'bg-fuchsia-700 text-white font-bold'
                                : shift.badgeBg ? `${shift.badgeBg} text-white font-bold` : 'bg-slate-700 text-white'
                            }`}
                          >
                            <span>{shift.code}</span>

                            {/* Quick Swap Trigger Button on hover */}
                            {shift && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCellClick(emp, dateStr, assignment, 'swap');
                                }}
                                className="opacity-0 group-hover/cell:opacity-100 absolute bottom-0.5 left-0.5 p-0.5 rounded bg-slate-950/90 text-orange-300 hover:text-white hover:bg-orange-500 transition-all shadow-xs z-10"
                                title="Műszakcsere kérése (KSz 41. § pihenőidő ellenőrzéssel)"
                              >
                                <ArrowLeftRight className="w-2.5 h-2.5" />
                              </button>
                            )}

                            {/* Heat-map flame badge on cell */}
                            {hasHeatIndicator && (
                              <span 
                                className={`absolute -top-1.5 -right-1 z-10 px-1 py-0.5 rounded-full font-black text-[8px] leading-tight border border-slate-950 flex items-center shadow-xs ${
                                  hasCriticalBottleneck
                                    ? 'bg-rose-600 text-white animate-bounce'
                                    : hasHighConcentration
                                    ? 'bg-orange-500 text-slate-950 font-extrabold'
                                    : 'bg-amber-400 text-slate-950 font-bold'
                                }`}
                                title={`🔥 Hőtérkép: ${sameShiftCount} fő dolgozik egyszerre ${shift.name} műszakban!`}
                              >
                                🔥{sameShiftCount}
                              </span>
                            )}

                            {/* Locked indicator */}
                            {assignment?.locked && (
                              <Lock className="w-2.5 h-2.5 absolute top-0.5 right-0.5 text-white/70" />
                            )}

                            {/* 120h notice indicator (KSz 29. § 2.) */}
                            {assignment?.isModifiedWithin120h && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute bottom-0.5 right-0.5" title="120h-n belüli rendkívüli módosítás (KSz 29. § 2.)" />
                            )}

                            {/* Compliance Error Indicator Dot */}
                            {hasError && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-0.5 -left-0.5 border border-slate-950 animate-pulse" />
                            )}
                            {!hasError && hasWarning && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute -top-0.5 -left-0.5" />
                            )}
                          </div>
                        ) : (
                          <div className="h-7 rounded border border-dashed border-slate-800 hover:border-slate-600 flex items-center justify-center text-slate-600 hover:text-slate-400">
                            <Plus className="w-3 h-3" />
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Row Total Hours */}
                  <td className="px-2 py-1 text-center font-mono font-bold text-slate-200 border-l border-slate-800 bg-slate-900/60 tabular-nums">
                    {workHours}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Daily Staffing Requirements Footer */}
          <tfoot>
            <tr className="bg-slate-900 border-t-2 border-slate-800 text-slate-400 text-[10px]">
              <td className="sticky left-0 z-10 bg-slate-900 px-3 py-2 font-semibold border-r border-slate-800">
                <div className="flex items-center justify-between">
                  <span>Szolgálati létszám (Nappal / Éjjel)</span>
                  <span className="text-amber-400">24/7 Állomás</span>
                </div>
              </td>

              {Array.from({ length: monthSummary.totalDays }, (_, i) => i + 1).map(day => {
                const dateStr = `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayAssignments = assignments.filter(a => a.date === dateStr);
                
                let dayStaff = 0;
                let nightStaff = 0;

                dayAssignments.forEach(a => {
                  const shift = shiftMap.get(a.shiftTypeId);
                  if (shift && shift.category === 'WORK') {
                    if (shift.isNightShift) nightStaff++;
                    else if (shift.isDayShift) dayStaff++;
                  }
                });

                return (
                  <td key={day} className="px-0.5 py-1.5 text-center font-mono border-r border-slate-800/80">
                    <div className="text-sky-400 font-bold">{dayStaff}</div>
                    <div className="text-indigo-400 font-bold">{nightStaff}</div>
                  </td>
                );
              })}

              <td className="px-1 py-1 text-center font-mono border-l border-slate-800 text-slate-500">
                -
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
