import { Employee, ShiftAssignment } from '../types';
import { MAV_SHIFT_TYPES } from '../data/mavRegulations';

export interface EmployeeSwapEvaluation {
  employeeId: string;
  employeeName: string;
  role: string;
  travelMinutes: number;
  assignedShiftCode: string;
  assignedShiftName: string;
  restFromPrevHours: number | null;
  netRestFromPrevHours: number | null;
  restToNextHours: number | null;
  netRestToNextHours: number | null;
  consecutiveNights: number;
  issues: {
    severity: 'ERROR' | 'WARNING' | 'INFO';
    code: string;
    message: string;
  }[];
}

export interface SwapValidationResult {
  isValid: boolean;        // true if no ERROR severity issue exists
  hasWarning: boolean;     // true if WARNING severity issue exists
  status: 'COMPLIANT' | 'WARNING' | 'VIOLATION';
  summaryTitle: string;
  summaryMessage: string;
  empA: EmployeeSwapEvaluation;
  empB: EmployeeSwapEvaluation;
  legalCitations: string[];
}

/**
 * Helper to compute Date start and end for a shift on a specific date.
 * Handles shifts spanning midnight (e.g. 18:00 -> 06:00).
 */
export function getShiftDateRange(dateStr: string, startTime: string, endTime: string): { start: Date; end: Date } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const start = new Date(year, month - 1, day, startH, startM, 0);
  const end = new Date(year, month - 1, day, endH, endM, 0);

  // If shift ends at or before start time, it rolls into the next calendar day
  if (endH < startH || (endH === startH && endM <= startM)) {
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
}

/**
 * Validates a proposed shift swap between Employee A (initiator) and Employee B (partner).
 * Supports both same-day swaps (dateA === dateB) and cross-day swaps (dateA !== dateB).
 */
export function validateShiftSwap(
  employeeA: Employee,
  dateA: string,
  shiftA: ShiftAssignment | undefined,
  employeeB: Employee,
  dateB: string,
  shiftB: ShiftAssignment | undefined,
  allAssignments: ShiftAssignment[]
): SwapValidationResult {
  const shiftMap = new Map(MAV_SHIFT_TYPES.map(s => [s.id, s]));
  const isSameDay = dateA === dateB;

  // Check if either shift is locked (e.g. approved annual leave, training, exam)
  const isALocked = shiftA?.locked || (shiftA && ['SZAB', 'BETEG', 'OKT'].includes(shiftA.shiftTypeId));
  const isBLocked = shiftB?.locked || (shiftB && ['SZAB', 'BETEG', 'OKT'].includes(shiftB.shiftTypeId));

  // Determine what shifts each person will have after swap
  // For Employee A:
  // - on dateA: if cross-day, Employee A gives up shiftA (becomes PIH / rest if nobody covers it, or gets shiftB if same-day)
  // - on dateB: Employee A receives shiftB's times & properties
  // For Employee B:
  // - on dateA: Employee B receives shiftA's times & properties
  // - on dateB: if cross-day, Employee B gives up shiftB (becomes PIH / rest)

  // Build simulated assignments list for Employee A
  const simulatedAssignmentsA: ShiftAssignment[] = allAssignments
    .filter(a => a.employeeId === employeeA.id)
    .map(a => ({ ...a }));

  // Build simulated assignments list for Employee B
  const simulatedAssignmentsB: ShiftAssignment[] = allAssignments
    .filter(a => a.employeeId === employeeB.id)
    .map(a => ({ ...a }));

  const defaultPih = MAV_SHIFT_TYPES.find(s => s.id === 'PIH')!;

  if (isSameDay) {
    // Same day swap: Swap roles on dateA
    const targetAIndex = simulatedAssignmentsA.findIndex(a => a.date === dateA);
    const targetBIndex = simulatedAssignmentsB.findIndex(a => a.date === dateA);

    const newForA: ShiftAssignment = shiftB ? {
      ...shiftB,
      id: `sim-a-${dateA}`,
      employeeId: employeeA.id,
      date: dateA
    } : {
      id: `sim-a-${dateA}`,
      employeeId: employeeA.id,
      date: dateA,
      shiftTypeId: 'PIH',
      startTime: defaultPih.defaultStartTime,
      endTime: defaultPih.defaultEndTime,
      durationHours: 0,
      isNightShift: false,
      nightHours: 0,
      afternoonHours: 0,
      holidayHours: 0,
      isOvertime: false,
      isModifiedWithin120h: true
    };

    const newForB: ShiftAssignment = shiftA ? {
      ...shiftA,
      id: `sim-b-${dateA}`,
      employeeId: employeeB.id,
      date: dateA
    } : {
      id: `sim-b-${dateA}`,
      employeeId: employeeB.id,
      date: dateA,
      shiftTypeId: 'PIH',
      startTime: defaultPih.defaultStartTime,
      endTime: defaultPih.defaultEndTime,
      durationHours: 0,
      isNightShift: false,
      nightHours: 0,
      afternoonHours: 0,
      holidayHours: 0,
      isOvertime: false,
      isModifiedWithin120h: true
    };

    if (targetAIndex >= 0) simulatedAssignmentsA[targetAIndex] = newForA;
    else simulatedAssignmentsA.push(newForA);

    if (targetBIndex >= 0) simulatedAssignmentsB[targetBIndex] = newForB;
    else simulatedAssignmentsB.push(newForB);

  } else {
    // Cross-day swap:
    // Emp A gives up shift on dateA (gets PIH), and takes shiftB on dateB
    // Emp B gives up shift on dateB (gets PIH), and takes shiftA on dateA
    const indexAonDateA = simulatedAssignmentsA.findIndex(a => a.date === dateA);
    const indexAonDateB = simulatedAssignmentsA.findIndex(a => a.date === dateB);

    const pihForAonDateA: ShiftAssignment = {
      id: `sim-a-${dateA}`,
      employeeId: employeeA.id,
      date: dateA,
      shiftTypeId: 'PIH',
      startTime: defaultPih.defaultStartTime,
      endTime: defaultPih.defaultEndTime,
      durationHours: 0,
      isNightShift: false,
      nightHours: 0,
      afternoonHours: 0,
      holidayHours: 0,
      isOvertime: false,
      isModifiedWithin120h: true
    };

    const newForAonDateB: ShiftAssignment = shiftB ? {
      ...shiftB,
      id: `sim-a-${dateB}`,
      employeeId: employeeA.id,
      date: dateB
    } : pihForAonDateA;

    if (indexAonDateA >= 0) simulatedAssignmentsA[indexAonDateA] = pihForAonDateA;
    if (indexAonDateB >= 0) simulatedAssignmentsA[indexAonDateB] = newForAonDateB;
    else simulatedAssignmentsA.push(newForAonDateB);

    // Emp B:
    const indexBonDateA = simulatedAssignmentsB.findIndex(a => a.date === dateA);
    const indexBonDateB = simulatedAssignmentsB.findIndex(a => a.date === dateB);

    const pihForBonDateB: ShiftAssignment = {
      id: `sim-b-${dateB}`,
      employeeId: employeeB.id,
      date: dateB,
      shiftTypeId: 'PIH',
      startTime: defaultPih.defaultStartTime,
      endTime: defaultPih.defaultEndTime,
      durationHours: 0,
      isNightShift: false,
      nightHours: 0,
      afternoonHours: 0,
      holidayHours: 0,
      isOvertime: false,
      isModifiedWithin120h: true
    };

    const newForBonDateA: ShiftAssignment = shiftA ? {
      ...shiftA,
      id: `sim-b-${dateA}`,
      employeeId: employeeB.id,
      date: dateA
    } : pihForBonDateB;

    if (indexBonDateB >= 0) simulatedAssignmentsB[indexBonDateB] = pihForBonDateB;
    if (indexBonDateA >= 0) simulatedAssignmentsB[indexBonDateA] = newForBonDateA;
    else simulatedAssignmentsB.push(newForBonDateA);
  }

  // Evaluate Employee A
  const evalA = evaluateEmployeeSchedule(
    employeeA,
    isSameDay ? dateA : dateB,
    simulatedAssignmentsA,
    shiftMap,
    isALocked,
    shiftB
  );

  // Evaluate Employee B
  const evalB = evaluateEmployeeSchedule(
    employeeB,
    dateA,
    simulatedAssignmentsB,
    shiftMap,
    isBLocked,
    shiftA
  );

  // Determine overall status
  const allIssues = [...evalA.issues, ...evalB.issues];
  const hasError = allIssues.some(i => i.severity === 'ERROR');
  const hasWarning = allIssues.some(i => i.severity === 'WARNING');

  let status: 'COMPLIANT' | 'WARNING' | 'VIOLATION' = 'COMPLIANT';
  let summaryTitle = 'Szabályos és Engedélyezhető Műszakcsere';
  let summaryMessage = 'A csere mindkét munkavállaló esetében maradéktalanul teljesíti a MÁV KSz 41. § szerinti 12 órás pihenőidőt és a jogszabályi előírásokat.';

  if (hasError) {
    status = 'VIOLATION';
    summaryTitle = 'Szabálysértő Műszakcsere - Nem Engedélyezett!';
    const firstErr = allIssues.find(i => i.severity === 'ERROR');
    summaryMessage = firstErr?.message || 'A műszakcsere súlyos pihenőidő- vagy szolgálatszervezési szabálysértést eredményezne!';
  } else if (hasWarning) {
    status = 'WARNING';
    summaryTitle = 'Figyelmeztetéssel Engedélyezhető Műszakcsere';
    const firstWarn = allIssues.find(i => i.severity === 'WARNING');
    summaryMessage = firstWarn?.message || 'A törvényi minimum (8 óra) teljesül, de a MÁV KSz szerinti 12 órás tiszta otthoni pihenőidő nem garantált teljes mértékben.';
  }

  const legalCitations = [
    'MÁV Kollektív Szerződés 41. § 1-2. pont (12 órás napi pihenőidő lakásra érkezéstől)',
    'Munka Törvénykönyve 104. § (törvényi minimum 8 és 11 órás napi pihenőidő)',
    'MÁV Kollektív Szerződés 32. § 2-3. pont (egymást követő éjszakai szolgálatok korlátja)',
    'MÁV Kollektív Szerződés 29. § 2. pont (munkavállalói kölcsönös kérelem 120 órán belül)'
  ];

  return {
    isValid: !hasError,
    hasWarning,
    status,
    summaryTitle,
    summaryMessage,
    empA: evalA,
    empB: evalB,
    legalCitations
  };
}

/**
 * Evaluates an employee's rest periods and rules around an amended date in their schedule.
 */
function evaluateEmployeeSchedule(
  emp: Employee,
  changedDate: string,
  assignments: ShiftAssignment[],
  shiftMap: Map<string, typeof MAV_SHIFT_TYPES[0]>,
  wasLocked: boolean | undefined,
  receivedShift: ShiftAssignment | undefined
): EmployeeSwapEvaluation {
  const issues: EmployeeSwapEvaluation['issues'] = [];

  if (wasLocked) {
    issues.push({
      severity: 'ERROR',
      code: 'LOCKED-SHIFT',
      message: `${emp.name} eredeti műszakja zárolt státuszú (pl. jóváhagyott rendes szabadság, betegállomány vagy vizsga), ezért nem cserélhető!`
    });
  }

  const sorted = [...assignments]
    .filter(a => {
      const s = shiftMap.get(a.shiftTypeId);
      return s && s.category === 'WORK';
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const targetShiftCfg = receivedShift ? shiftMap.get(receivedShift.shiftTypeId) : undefined;
  const assignedShiftCode = targetShiftCfg?.code || (receivedShift ? receivedShift.shiftTypeId : 'PIH');
  const assignedShiftName = targetShiftCfg?.name || (receivedShift ? 'Szolgálat' : 'Pihenőnap (PIH)');

  // Target shift for this employee on changedDate
  const currentAssigned = sorted.find(a => a.date === changedDate);

  let restFromPrevHours: number | null = null;
  let netRestFromPrevHours: number | null = null;
  let restToNextHours: number | null = null;
  let netRestToNextHours: number | null = null;

  const travelHours = (emp.travelMinutes * 2) / 60;

  if (currentAssigned) {
    const curRange = getShiftDateRange(currentAssigned.date, currentAssigned.startTime, currentAssigned.endTime);

    // Find preceding work shift
    const prevShifts = sorted.filter(a => {
      const aRange = getShiftDateRange(a.date, a.startTime, a.endTime);
      return aRange.end.getTime() <= curRange.start.getTime() && a !== currentAssigned;
    });

    if (prevShifts.length > 0) {
      const prevShift = prevShifts[prevShifts.length - 1];
      const prevRange = getShiftDateRange(prevShift.date, prevShift.startTime, prevShift.endTime);
      restFromPrevHours = (curRange.start.getTime() - prevRange.end.getTime()) / (1000 * 60 * 60);
      netRestFromPrevHours = restFromPrevHours - travelHours;

      if (restFromPrevHours < 8 || netRestFromPrevHours < 6) {
        issues.push({
          severity: 'ERROR',
          code: 'KSZ-41-CRITICAL',
          message: `${emp.name}: Az előző műszak (${prevShift.date}) és a csere-műszak között a pihenőidő kritikus szinten alacsony (${restFromPrevHours.toFixed(1)} óra nyers / ${netRestFromPrevHours.toFixed(1)} óra tiszta). Törvényi minimum 8 óra!`
        });
      } else if (netRestFromPrevHours < 12) {
        issues.push({
          severity: 'WARNING',
          code: 'KSZ-41-WARN',
          message: `${emp.name}: A tiszta otthoni pihenőidő az előző műszaktól ${netRestFromPrevHours.toFixed(1)} óra (${emp.travelMinutes} perc utazási idő levonásával). A MÁV KSz 41. § szerinti elvárt mérték 12 óra.`
        });
      }
    }

    // Find following work shift
    const nextShifts = sorted.filter(a => {
      const aRange = getShiftDateRange(a.date, a.startTime, a.endTime);
      return aRange.start.getTime() >= curRange.end.getTime() && a !== currentAssigned;
    });

    if (nextShifts.length > 0) {
      const nextShift = nextShifts[0];
      const nextRange = getShiftDateRange(nextShift.date, nextShift.startTime, nextShift.endTime);
      restToNextHours = (nextRange.start.getTime() - curRange.end.getTime()) / (1000 * 60 * 60);
      netRestToNextHours = restToNextHours - travelHours;

      if (restToNextHours < 8 || netRestToNextHours < 6) {
        issues.push({
          severity: 'ERROR',
          code: 'KSZ-41-CRITICAL-NEXT',
          message: `${emp.name}: A csere-műszak és a következő műszak (${nextShift.date}) között nincs meg a kötelező 8 óra pihenőidő (${restToNextHours.toFixed(1)} óra nyers)!`
        });
      } else if (netRestToNextHours < 12) {
        issues.push({
          severity: 'WARNING',
          code: 'KSZ-41-WARN-NEXT',
          message: `${emp.name}: A következő műszak előtti tiszta otthoni pihenőidő ${netRestToNextHours.toFixed(1)} óra a megkívánt 12 óra helyett.`
        });
      }
    }
  }

  // Check consecutive night shifts
  let maxConsecutiveNights = 0;
  let curConsecutive = 0;
  sorted.forEach(a => {
    if (a.isNightShift) {
      curConsecutive++;
      if (curConsecutive > maxConsecutiveNights) maxConsecutiveNights = curConsecutive;
    } else {
      curConsecutive = 0;
    }
  });

  const isContinuous = emp.workPattern === 'CONTINUOUS_4_SHIFT' || emp.workPattern === 'CONTINUOUS_12_24';
  if (isContinuous && maxConsecutiveNights > 2) {
    issues.push({
      severity: 'ERROR',
      code: 'KSZ-32-NIGHT',
      message: `${emp.name}: A csere következtében ${maxConsecutiveNights} egymást követő éjszakai műszak jönne létre! Fordulós munkarendben max 2 engedélyezett (KSz 32. § 2.).`
    });
  } else if (!isContinuous && maxConsecutiveNights > 5) {
    issues.push({
      severity: 'ERROR',
      code: 'KSZ-32-EXT-NIGHT',
      message: `${emp.name}: A csere miatt a megengedett 5 egymást követő éjszakai szolgálatnál több lenne beosztva!`
    });
  }

  return {
    employeeId: emp.id,
    employeeName: emp.name,
    role: emp.role,
    travelMinutes: emp.travelMinutes,
    assignedShiftCode,
    assignedShiftName,
    restFromPrevHours,
    netRestFromPrevHours,
    restToNextHours,
    netRestToNextHours,
    consecutiveNights: maxConsecutiveNights,
    issues
  };
}
