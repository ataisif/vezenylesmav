import { Employee, ShiftAssignment, MonthSummary } from '../types';
import { MAV_SHIFT_TYPES } from '../data/mavRegulations';

/**
 * Generates an Excel-compatible Hungarian CSV of the monthly schedule with UTF-8 BOM.
 */
export function exportScheduleToCSV(
  employees: Employee[],
  assignments: ShiftAssignment[],
  monthSummary: MonthSummary,
  stationName: string
) {
  const shiftMap = new Map(MAV_SHIFT_TYPES.map(s => [s.id, s]));
  const monthNameHungarian = new Intl.DateTimeFormat('hu-HU', { month: 'long' }).format(
    new Date(monthSummary.year, monthSummary.month, 1)
  );

  let csv = '\uFEFF'; // UTF-8 BOM
  csv += `MÁV Pályaműködtetési Zrt. - Havi Munkaidő-beosztás és Vezénylés\n`;
  csv += `Szolgálati hely:;${stationName};Időszak:;${monthSummary.year}. ${monthNameHungarian};Kötelező órakeret:;${monthSummary.statutoryRequiredHours} óra\n\n`;

  // Header row
  csv += 'Törzsszám;Munkavállaló;Munkakör;Munkarend;Dátum;Nap;Műszak kód;Megnevezés;Kezdés;Befejezés;Munkaóra;Éjszakai óra (22-06);120h-n belüli módosítás;Megjegyzés\n';

  const daysOfWeekHu = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];

  // Sort by employee then date
  const sorted = [...assignments].sort((a, b) => {
    if (a.employeeId !== b.employeeId) return a.employeeId.localeCompare(b.employeeId);
    return a.date.localeCompare(b.date);
  });

  const empMap = new Map(employees.map(e => [e.id, e]));

  sorted.forEach(a => {
    const emp = empMap.get(a.employeeId);
    if (!emp) return;
    const shift = shiftMap.get(a.shiftTypeId);
    const dateObj = new Date(a.date);
    const dayName = daysOfWeekHu[dateObj.getDay()];

    csv += `"${emp.employeeNumber}";"${emp.name}";"${emp.role}";"${emp.workPattern}";"${a.date}";"${dayName}";"${shift?.code || ''}";"${shift?.name || ''}";"${a.startTime}";"${a.endTime}";"${a.durationHours}";"${a.nightHours}";"${a.isModifiedWithin120h ? 'IGEN' : 'NEM'}";"${a.note || ''}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `MAV_Vezenyles_${stationName.replace(/\s+/g, '_')}_${monthSummary.year}_${monthSummary.month + 1}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
