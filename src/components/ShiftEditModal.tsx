import React, { useState, useMemo } from 'react';
import { Employee, ShiftAssignment, TeamRequest } from '../types';
import { MAV_SHIFT_TYPES } from '../data/mavRegulations';
import { calculateShiftHourBreakdown } from '../utils/schedulerEngine';
import { validateShiftSwap, SwapValidationResult } from '../utils/swapValidator';
import { 
  X, 
  Clock, 
  AlertTriangle, 
  Check, 
  Trash2, 
  ShieldAlert,
  ArrowLeftRight,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  Zap,
  Info
} from 'lucide-react';

interface ShiftEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  dateStr: string;
  currentAssignment?: ShiftAssignment;
  onSave: (updatedAssignment: ShiftAssignment) => void;
  onDelete: (employeeId: string, dateStr: string) => void;
  prevAssignment?: ShiftAssignment;
  nextAssignment?: ShiftAssignment;
  allEmployees?: Employee[];
  allAssignments?: ShiftAssignment[];
  onSwapShifts?: (
    employeeA: Employee,
    dateA: string,
    employeeB: Employee,
    dateB: string,
    appliedImmediately: boolean,
    reason?: string
  ) => void;
  onRequestSwapProposal?: (req: Omit<TeamRequest, 'id'>) => void;
  initialTab?: 'edit' | 'swap';
}

export const ShiftEditModal: React.FC<ShiftEditModalProps> = ({
  isOpen,
  onClose,
  employee,
  dateStr,
  currentAssignment,
  onSave,
  onDelete,
  prevAssignment,
  nextAssignment,
  allEmployees = [],
  allAssignments = [],
  onSwapShifts,
  onRequestSwapProposal,
  initialTab = 'edit'
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'edit' | 'swap'>(initialTab);

  // --- EDIT SHIFT STATE ---
  const defaultShiftType = currentAssignment?.shiftTypeId || 'N12';
  const [shiftTypeId, setShiftTypeId] = useState<string>(defaultShiftType);
  const selectedTypeConfig = MAV_SHIFT_TYPES.find(s => s.id === shiftTypeId)!;

  const [startTime, setStartTime] = useState<string>(currentAssignment?.startTime || selectedTypeConfig.defaultStartTime);
  const [endTime, setEndTime] = useState<string>(currentAssignment?.endTime || selectedTypeConfig.defaultEndTime);
  const [durationHours, setDurationHours] = useState<number>(currentAssignment?.durationHours ?? selectedTypeConfig.durationHours);
  const [isOvertime, setIsOvertime] = useState<boolean>(currentAssignment?.isOvertime || false);
  const [isModifiedWithin120h, setIsModifiedWithin120h] = useState<boolean>(currentAssignment?.isModifiedWithin120h || false);
  const [note, setNote] = useState<string>(currentAssignment?.note || '');

  // --- SHIFT SWAP STATE ---
  // Default swap partner: first other employee in same role or station
  const potentialPartners = useMemo(() => {
    return allEmployees.filter(e => e.id !== employee.id);
  }, [allEmployees, employee.id]);

  const [partnerEmployeeId, setPartnerEmployeeId] = useState<string>(() => {
    // Prefer someone with same department / role
    const sameRole = potentialPartners.find(e => e.role === employee.role);
    if (sameRole) return sameRole.id;
    const sameDept = potentialPartners.find(e => e.department === employee.department);
    if (sameDept) return sameDept.id;
    return potentialPartners[0]?.id || '';
  });

  const [isCrossDaySwap, setIsCrossDaySwap] = useState<boolean>(false);
  const [targetDateStr, setTargetDateStr] = useState<string>(dateStr);
  const [swapReason, setSwapReason] = useState<string>('Kölcsönös szolgálatcsere egyeztetve');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedPartner = potentialPartners.find(e => e.id === partnerEmployeeId);

  // Partner's assignment on the effective date (either dateStr or targetDateStr)
  const effectivePartnerDate = isCrossDaySwap ? targetDateStr : dateStr;
  const partnerAssignment = useMemo(() => {
    if (!selectedPartner) return undefined;
    return allAssignments.find(a => a.employeeId === selectedPartner.id && a.date === effectivePartnerDate);
  }, [allAssignments, selectedPartner, effectivePartnerDate]);

  // Automated Rest Period Regulations Validation
  const validationResult: SwapValidationResult | null = useMemo(() => {
    if (!selectedPartner) return null;
    return validateShiftSwap(
      employee,
      dateStr,
      currentAssignment,
      selectedPartner,
      effectivePartnerDate,
      partnerAssignment,
      allAssignments
    );
  }, [employee, dateStr, currentAssignment, selectedPartner, effectivePartnerDate, partnerAssignment, allAssignments]);

  // Helper when changing shift type in edit mode
  const handleShiftTypeChange = (id: string) => {
    setShiftTypeId(id);
    const cfg = MAV_SHIFT_TYPES.find(s => s.id === id);
    if (cfg) {
      setStartTime(cfg.defaultStartTime);
      setEndTime(cfg.defaultEndTime);
      setDurationHours(cfg.durationHours);
    }
  };

  const handleSaveEdit = () => {
    const hoursBreakdown = calculateShiftHourBreakdown(
      shiftTypeId,
      dateStr,
      startTime,
      endTime,
      durationHours
    );

    const updated: ShiftAssignment = {
      id: currentAssignment?.id || `asg-${employee.id}-${dateStr}`,
      employeeId: employee.id,
      date: dateStr,
      shiftTypeId,
      startTime,
      endTime,
      durationHours,
      isNightShift: selectedTypeConfig.isNightShift,
      nightHours: hoursBreakdown.nightHours,
      afternoonHours: hoursBreakdown.afternoonHours,
      holidayHours: hoursBreakdown.holidayHours,
      isOvertime,
      isModifiedWithin120h,
      note,
      locked: currentAssignment?.locked || false
    };

    onSave(updated);
    onClose();
  };

  // Rest-time live calculations for current edit modal
  let restFromPrevHours: number | null = null;
  if (prevAssignment && prevAssignment.shiftTypeId !== 'PIH' && shiftTypeId !== 'PIH') {
    const [prevEndH, prevEndM] = prevAssignment.endTime.split(':').map(Number);
    const [curStartH, curStartM] = startTime.split(':').map(Number);
    const prevEndAbs = (prevAssignment.startTime > prevAssignment.endTime ? 24 : 0) + prevEndH + prevEndM / 60;
    const curStartAbs = 24 + curStartH + curStartM / 60;
    const rawRest = curStartAbs - prevEndAbs;
    const travelHours = (employee.travelMinutes * 2) / 60;
    restFromPrevHours = rawRest - travelHours;
  }
  const isRestInsufficient = restFromPrevHours !== null && restFromPrevHours < 12;

  // Handle immediate swap execution
  const handleExecuteSwap = (applyImmediately: boolean) => {
    if (!selectedPartner || !validationResult || !validationResult.isValid) return;

    if (onSwapShifts) {
      onSwapShifts(
        employee,
        dateStr,
        selectedPartner,
        effectivePartnerDate,
        applyImmediately,
        swapReason
      );
    } else if (onRequestSwapProposal) {
      onRequestSwapProposal({
        employeeId: employee.id,
        type: 'SHIFT_SWAP',
        startDate: dateStr,
        endDate: effectivePartnerDate,
        reason: swapReason,
        status: applyImmediately ? 'APPROVED' : 'PENDING',
        submissionDate: new Date().toISOString().split('T')[0],
        swapPartnerId: selectedPartner.id,
        swapTargetDate: effectivePartnerDate,
        swapTargetShiftTypeId: partnerAssignment?.shiftTypeId
      });
    }

    setSuccessMessage(
      applyImmediately 
        ? `A műszakcsere (${employee.name} ↔ ${selectedPartner.name}) azonnal érvényesítésre került a vezénylésben!`
        : `A műszakcsere kérelem sikeresen rögzítve lett (Jóváhagyásra vár)!`
    );

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header & Tabs */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                {employee.name}
              </span>
              <span className="text-slate-400 text-xs">
                ({employee.role}) · <span className="font-mono text-amber-300">{dateStr}</span>
              </span>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Szolgálat Módosítása</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('swap')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'swap'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Műszakcsere Kérése</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-950/30 font-bold">
                ÚJ
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          
          {/* TAB 1: SHIFT SWAP */}
          {activeTab === 'swap' && (
            <div className="space-y-4">
              
              {/* Notification Banner on Success */}
              {successMessage && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg flex items-center gap-2 text-emerald-200 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Current Initiating Shift Card */}
              <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[10px] uppercase font-mono text-slate-400">Kezdeményező Munkavállaló</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>{employee.name}</span>
                    <span className="text-[11px] font-normal text-slate-400">({employee.role})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Utazási idő: <span className="font-mono text-amber-300 font-semibold">{employee.travelMinutes} perc</span> · Szolgálati hely: {employee.station}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Jelenlegi Szolgálat ({dateStr})</div>
                  <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                    {currentAssignment && currentAssignment.shiftTypeId !== 'PIH' ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                        {currentAssignment.shiftTypeId} ({currentAssignment.startTime} - {currentAssignment.endTime}, {currentAssignment.durationHours}h)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        PIH: Pihenőnap (0 óra)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Swap Type & Partner Selector */}
              <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-orange-400" />
                    <span>Műszakcsere Típusa</span>
                  </label>
                  
                  {/* Mode selector: Same day vs Cross day */}
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCrossDaySwap(false);
                        setTargetDateStr(dateStr);
                      }}
                      className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                        !isCrossDaySwap 
                          ? 'bg-amber-500 text-slate-950 font-bold' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Azonos napi csere ({dateStr})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCrossDaySwap(true)}
                      className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                        isCrossDaySwap 
                          ? 'bg-amber-500 text-slate-950 font-bold' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Kétirányú / Másnapi csere
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Partner Selection */}
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px] font-medium">
                      Cserepartner Kijelölése
                    </label>
                    <select
                      value={partnerEmployeeId}
                      onChange={(e) => setPartnerEmployeeId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                    >
                      {potentialPartners.map(p => {
                        const pAsg = allAssignments.find(a => a.employeeId === p.id && a.date === effectivePartnerDate);
                        const shiftLabel = pAsg && pAsg.shiftTypeId !== 'PIH' ? `${pAsg.shiftTypeId} (${pAsg.durationHours}h)` : 'PIH';
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} · {p.role} [{shiftLabel}]
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Target Date Picker (if cross day) */}
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px] font-medium">
                      {isCrossDaySwap ? 'Partner Szolgálatának Dátuma' : 'Csere Napja'}
                    </label>
                    {isCrossDaySwap ? (
                      <input
                        type="date"
                        value={targetDateStr}
                        onChange={(e) => setTargetDateStr(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                      />
                    ) : (
                      <div className="px-2.5 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400 font-mono text-xs">
                        {dateStr} (Azonos nap)
                      </div>
                    )}
                  </div>
                </div>

                {/* Partner Current Shift Preview */}
                {selectedPartner && (
                  <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Partner jelenlegi műszakja ezen a napon ({effectivePartnerDate}):</span>
                      <span className="font-mono font-bold text-sky-400">
                        {partnerAssignment && partnerAssignment.shiftTypeId !== 'PIH' 
                          ? `${partnerAssignment.shiftTypeId} (${partnerAssignment.startTime} - ${partnerAssignment.endTime}, ${partnerAssignment.durationHours}h)` 
                          : 'PIH: Pihenőnap (szabadnap)'}
                      </span>
                    </div>
                    <div className="text-slate-500">
                      Partner utazási ideje: {selectedPartner.travelMinutes} perc
                    </div>
                  </div>
                )}
              </div>

              {/* AUTOMATED REST PERIOD REGULATION VALIDATION RESULTS */}
              {validationResult && (
                <div className={`p-4 rounded-xl border transition-all ${
                  validationResult.status === 'COMPLIANT'
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : validationResult.status === 'WARNING'
                    ? 'bg-amber-950/25 border-amber-500/50'
                    : 'bg-rose-950/30 border-rose-500/60'
                }`}>
                  
                  {/* Status Banner */}
                  <div className="flex items-start gap-2.5">
                    {validationResult.status === 'COMPLIANT' ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : validationResult.status === 'WARNING' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className={`font-bold text-xs ${
                          validationResult.status === 'COMPLIANT' 
                            ? 'text-emerald-300' 
                            : validationResult.status === 'WARNING' 
                            ? 'text-amber-300' 
                            : 'text-rose-300'
                        }`}>
                          {validationResult.summaryTitle}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          validationResult.status === 'COMPLIANT' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                            : validationResult.status === 'WARNING' 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {validationResult.status === 'COMPLIANT' ? 'ENGEDÉLYEZETT' : validationResult.status === 'WARNING' ? 'FIGYELMEZTETÉS' : 'SZABÁLYSÉRTŐ (TILTOTT)'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        {validationResult.summaryMessage}
                      </p>
                    </div>
                  </div>

                  {/* Rest Period Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5 pt-3 border-t border-slate-800/80">
                    
                    {/* Column 1: Initiator Result */}
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="font-bold text-slate-200 text-[11px] flex items-center justify-between">
                        <span>{employee.name} (Kezdeményező)</span>
                        <span className="font-mono text-amber-400">{validationResult.empA.assignedShiftCode}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        Kapott: {validationResult.empA.assignedShiftName}
                      </div>

                      <div className="mt-2 space-y-1 text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Pihenőidő előző műszaktól:</span>
                          <span className={`font-mono font-bold ${
                            validationResult.empA.netRestFromPrevHours === null
                              ? 'text-slate-500'
                              : validationResult.empA.netRestFromPrevHours >= 12
                              ? 'text-emerald-400'
                              : validationResult.empA.netRestFromPrevHours >= 8
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}>
                            {validationResult.empA.netRestFromPrevHours !== null 
                              ? `${validationResult.empA.netRestFromPrevHours.toFixed(1)} óra (tiszta)` 
                              : 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Pihenőidő következő műszakig:</span>
                          <span className={`font-mono font-bold ${
                            validationResult.empA.netRestToNextHours === null
                              ? 'text-slate-500'
                              : validationResult.empA.netRestToNextHours >= 12
                              ? 'text-emerald-400'
                              : validationResult.empA.netRestToNextHours >= 8
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}>
                            {validationResult.empA.netRestToNextHours !== null 
                              ? `${validationResult.empA.netRestToNextHours.toFixed(1)} óra (tiszta)` 
                              : 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-slate-500">Utazási idő levonás:</span>
                          <span className="font-mono text-slate-400">{employee.travelMinutes} perc</span>
                        </div>
                      </div>

                      {validationResult.empA.issues.length > 0 && (
                        <div className="mt-2 pt-1 border-t border-slate-800 text-[10px] space-y-0.5">
                          {validationResult.empA.issues.map((iss, idx) => (
                            <div key={idx} className={iss.severity === 'ERROR' ? 'text-rose-400 font-semibold' : 'text-amber-400'}>
                              • {iss.message}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Column 2: Partner Result */}
                    {selectedPartner && (
                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                        <div className="font-bold text-slate-200 text-[11px] flex items-center justify-between">
                          <span>{selectedPartner.name} (Partner)</span>
                          <span className="font-mono text-sky-400">{validationResult.empB.assignedShiftCode}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                          Kapott: {validationResult.empB.assignedShiftName}
                        </div>

                        <div className="mt-2 space-y-1 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Pihenőidő előző műszaktól:</span>
                            <span className={`font-mono font-bold ${
                              validationResult.empB.netRestFromPrevHours === null
                                ? 'text-slate-500'
                                : validationResult.empB.netRestFromPrevHours >= 12
                                ? 'text-emerald-400'
                                : validationResult.empB.netRestFromPrevHours >= 8
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}>
                              {validationResult.empB.netRestFromPrevHours !== null 
                                ? `${validationResult.empB.netRestFromPrevHours.toFixed(1)} óra (tiszta)` 
                                : 'N/A'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Pihenőidő következő műszakig:</span>
                            <span className={`font-mono font-bold ${
                              validationResult.empB.netRestToNextHours === null
                                ? 'text-slate-500'
                                : validationResult.empB.netRestToNextHours >= 12
                                ? 'text-emerald-400'
                                : validationResult.empB.netRestToNextHours >= 8
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}>
                              {validationResult.empB.netRestToNextHours !== null 
                                ? `${validationResult.empB.netRestToNextHours.toFixed(1)} óra (tiszta)` 
                                : 'N/A'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-slate-500">Utazási idő levonás:</span>
                            <span className="font-mono text-slate-400">{selectedPartner.travelMinutes} perc</span>
                          </div>
                        </div>

                        {validationResult.empB.issues.length > 0 && (
                          <div className="mt-2 pt-1 border-t border-slate-800 text-[10px] space-y-0.5">
                            {validationResult.empB.issues.map((iss, idx) => (
                              <div key={idx} className={iss.severity === 'ERROR' ? 'text-rose-400 font-semibold' : 'text-amber-400'}>
                                • {iss.message}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Legal regulation notes */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-1 text-[9px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Info className="w-3 h-3 text-amber-400" />
                      <span>KSz 41. § 1-2. pont (12h pihenőidő lakásra érkezéstől) & KSz 29. § 2. (kölcsönös kérelem)</span>
                    </span>
                    <span className="font-mono text-slate-500">MÁV Végrehajtási Szabályzat</span>
                  </div>
                </div>
              )}

              {/* Swap Reason Input */}
              <div>
                <label className="block text-slate-400 mb-1 text-[11px] font-medium">
                  Műszakcsere Indoklása (Közös megegyezés jegyzőkönyvezése)
                </label>
                <input
                  type="text"
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="pl. Családi esemény, vizsgafelkészülés, orvosi időpont miatt..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

            </div>
          )}

          {/* TAB 2: EDIT SHIFT (ORIGINAL) */}
          {activeTab === 'edit' && (
            <div className="space-y-4">
              
              {/* Shift Type Selection */}
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Műszak / Távollét Típusa</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MAV_SHIFT_TYPES.map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleShiftTypeChange(st.id)}
                      className={`px-2.5 py-2 rounded-lg text-left border transition-all cursor-pointer ${
                        shiftTypeId === st.id
                          ? 'border-amber-500 bg-amber-500/10 text-white font-semibold shadow-xs'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold">{st.code}</span>
                        <span className="text-[10px] text-slate-400">{st.durationHours}h</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{st.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Times and Hours */}
              {selectedTypeConfig.category !== 'REST' && (
                <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  <div>
                    <label className="block text-slate-400 mb-1">Kezdés</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Befejezés</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Munkaidő (óra)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-center"
                    />
                  </div>
                </div>
              )}

              {/* MÁV Rest Time Warning */}
              {isRestInsufficient && (
                <div className="p-3 bg-rose-950/20 border border-rose-800/40 rounded-lg flex items-start gap-2 text-rose-300">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <div className="font-semibold">Figyelem: MÁV KSz 41. § sérelem!</div>
                    <div className="text-[11px] text-rose-300/80 mt-0.5">
                      Az előző szolgálat utáni tiszta otthoni pihenőidő csak {restFromPrevHours?.toFixed(1)} óra ({employee.travelMinutes} perc utazási idő levonásával). A kötelező előírás 12 óra.
                    </div>
                  </div>
                </div>
              )}

              {/* Flags: Overtime and 120h Notice (Átvezénylési díj) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOvertime}
                    onChange={(e) => setIsOvertime(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                  />
                  <span className="text-slate-300">
                    Rendkívüli munkaidő (Túlóra az Mt. 108. § és KSz 35. § szerint)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isModifiedWithin120h}
                    onChange={(e) => setIsModifiedWithin120h(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                  />
                  <span className="text-slate-300">
                    120 órán belüli rendkívüli beosztás-módosítás (KSz 29. § 2. pont)
                  </span>
                </label>
              </div>

              {/* Note */}
              <div>
                <label className="block text-slate-400 mb-1">Megjegyzés a vezényléshez</label>
                <input
                  type="text"
                  placeholder="pl. Betegség miatti beugró, forgalmi átszervezés..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between flex-wrap gap-2">
          {activeTab === 'edit' ? (
            <>
              {currentAssignment ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(employee.id, dateStr);
                    onClose();
                  }}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Műszak törlése</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs transition-colors cursor-pointer"
                >
                  Mégse
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Mentés
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs transition-colors cursor-pointer"
              >
                Mégse
              </button>

              <div className="flex items-center gap-2">
                {/* Submit as Request button */}
                <button
                  type="button"
                  disabled={!validationResult || !validationResult.isValid}
                  onClick={() => handleExecuteSwap(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    validationResult && validationResult.isValid
                      ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-600 cursor-not-allowed'
                  }`}
                  title={!validationResult?.isValid ? 'Szabálysértés miatt nem nyújtható be' : 'Kérelem küldése jóváhagyásra'}
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kérelem Beküldése</span>
                </button>

                {/* Direct Instant Swap Execution */}
                <button
                  type="button"
                  disabled={!validationResult || !validationResult.isValid}
                  onClick={() => handleExecuteSwap(true)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${
                    validationResult && validationResult.isValid
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 shadow-orange-950/50'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                  title={!validationResult?.isValid ? 'A műszakcsere szabálysértő, a vezénylés nem módosítható!' : 'Műszakcsere azonnali bejegyzése a beosztásba'}
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>Azonnali Csere Végrehajtása</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
