import { Employee, ShiftAssignment, EmployeeMonthWorkSummary, MonthSummary } from '../types';
import { MAV_SHIFT_TYPES } from '../data/mavRegulations';

/**
 * Calculates monthly work time balance, overtime hours, night hours, 
 * and shift metrics strictly in hours and counts (no wage data).
 */
export function calculateEmployeeWorkSummary(
  employee: Employee,
  assignments: ShiftAssignment[],
  monthSummary: MonthSummary
): EmployeeMonthWorkSummary {
  const shiftMap = new Map(MAV_SHIFT_TYPES.map(s => [s.id, s]));
  const empAssignments = assignments.filter(a => a.employeeId === employee.id);

  let scheduledHours = 0;
  let nightHours = 0;
  let afternoonHours = 0;
  let holidayHours = 0;
  let leaveHours = 0;
  let shiftsCount = 0;
  let modifiedWithin120hCount = 0;

  empAssignments.forEach(a => {
    const shift = shiftMap.get(a.shiftTypeId);
    if (!shift) return;

    if (shift.category === 'WORK') {
      scheduledHours += a.durationHours;
      nightHours += a.nightHours;
      afternoonHours += a.afternoonHours;
      holidayHours += a.holidayHours;
      shiftsCount++;
    } else if (shift.category === 'LEAVE' || shift.category === 'EDUCATION' || shift.category === 'MEDICAL') {
      // Távolléti óraszámok
      leaveHours += a.durationHours;
      scheduledHours += a.durationHours;
    }

    if (a.isModifiedWithin120h) {
      modifiedWithin120hCount++;
    }
  });

  const requiredHours = monthSummary.statutoryRequiredHours;
  const overtimeHours = Math.max(0, scheduledHours - requiredHours);
  const balanceHours = scheduledHours - requiredHours;

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    employeeNumber: employee.employeeNumber,
    role: employee.role,
    department: employee.department || (employee.role.includes('Biztosítóberendezési') || employee.role.includes('TEB') ? 'SIGNALING' : 'TRAFFIC'),
    station: employee.station,
    workPattern: employee.workPattern,
    scheduledHours,
    requiredHours,
    overtimeHours,
    nightHours,
    afternoonHours,
    holidayHours,
    leaveHours,
    shiftsCount,
    modifiedWithin120hCount,
    balanceHours
  };
}
