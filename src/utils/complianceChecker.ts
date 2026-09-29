import { ShiftAssignment, Employee, ComplianceViolation, MonthSummary, StationConfig } from '../types';
import { MAV_SHIFT_TYPES, HUNGARIAN_HOLIDAYS_MAP, SPECIAL_PREMIUM_DATES } from '../data/mavRegulations';

/**
 * Calculates calendar details for a given year and month (0-indexed).
 */
export function getMonthSummary(year: number, month: number): MonthSummary {
  const totalDays = new Date(year, month + 1, 0).getDate();
  const holidayDates: string[] = [];
  let workingDays = 0;

  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, month, day);
    const dayOfWeek = d.getDay(); // 0 = Vasárnap, 6 = Szombat
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isHoliday = !!HUNGARIAN_HOLIDAYS_MAP[dateStr];

    if (isHoliday) {
      holidayDates.push(dateStr);
    }

    // Mt. általános munkarend szerinti munkanap: Hétfő-Péntek, ha nem ünnepnap
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday) {
      workingDays++;
    }
  }

  // Publication deadline: preceding month 23rd
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const publicationDeadlineDate = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-23`;

  return {
    year,
    month,
    totalDays,
    workingDays,
    holidayDates,
    statutoryRequiredHours: workingDays * 8, // KSz 24.§ 1.b
    publicationDeadlineDate
  };
}

/**
 * Runs complete MÁV Kollektív Szerződés and Hungarian Labor Law audit on the roster.
 */
export function checkScheduleCompliance(
  assignments: ShiftAssignment[],
  employees: Employee[],
  monthSummary: MonthSummary,
  station?: StationConfig
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];
  const shiftMap = new Map(MAV_SHIFT_TYPES.map(s => [s.id, s]));
  const empMap = new Map(employees.map(e => [e.id, e]));

  // Group assignments by employee
  const empAssignments = new Map<string, ShiftAssignment[]>();
  employees.forEach(e => empAssignments.set(e.id, []));
  assignments.forEach(a => {
    const list = empAssignments.get(a.employeeId);
    if (list) list.push(a);
  });

  // 1. Employee-level checks
  employees.forEach(emp => {
    const list = (empAssignments.get(emp.id) || []).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let consecutiveNights = 0;
    let scheduledWorkHours = 0;
    let hasFullSundayRest36h = false;

    for (let i = 0; i < list.length; i++) {
      const current = list[i];
      const shift = shiftMap.get(current.shiftTypeId);
      if (!shift) continue;

      if (shift.category === 'WORK') {
        scheduledWorkHours += current.durationHours;
      }

      // Check Consecutive Night Shifts
      if (current.isNightShift && shift.category === 'WORK') {
        consecutiveNights++;
        // KSz 32. § 2. pont: Fordulósban max 2 egymást követő éjszaka
        if (emp.workPattern === 'CONTINUOUS_4_SHIFT' || emp.workPattern === 'CONTINUOUS_12_24') {
          if (consecutiveNights > 2) {
            violations.push({
              id: `viol-night-${emp.id}-${current.date}`,
              severity: 'ERROR',
              ruleCode: 'KSZ-32-2',
              title: 'Megengedett éjszakai szolgálatok túllépése',
              description: `${emp.name} számára egymást követő ${consecutiveNights}. éjszakai szolgálat van beosztva. Fordulós munkarendben legfeljebb 2 engedélyezett!`,
              legalCitation: 'MÁV Kollektív Szerződés 32. § 2. pont',
              employeeId: emp.id,
              employeeName: emp.name,
              date: current.date,
              suggestedAction: 'Cserélje a szolgálatot nappalosra vagy biztosítson pihenőidőt.'
            });
          }
        } else {
          // KSz 32. § 3. pont + Megállapodás III.: Többműszakos / vezényelt esetén max 5 éjszaka
          if (consecutiveNights > 5) {
            violations.push({
              id: `viol-night-ext-${emp.id}-${current.date}`,
              severity: 'ERROR',
              ruleCode: 'KSZ-32-3',
              title: 'Egymást követő 5 éjszakai szolgálat határ átlépve',
              description: `${emp.name} számára több mint 5 egymást követő éjszakai műszak lett elrendelve. Ezt követően kötelező heti pihenőidőt kell biztosítani!`,
              legalCitation: 'MÁV KSz 32. § 3. pont & 2025. aug. 27. Megállapodás III.',
              employeeId: emp.id,
              employeeName: emp.name,
              date: current.date,
              suggestedAction: 'Rendeljen el heti pihenőidőt a műszakot követően.'
            });
          }
        }
      } else {
        consecutiveNights = 0;
      }

      // Daily Rest Time Check between consecutive shifts (KSz 41. § & 2025. aug. 27. Megállapodás VIII.)
      if (i < list.length - 1) {
        const next = list[i + 1];
        const nextShift = shiftMap.get(next.shiftTypeId);
        if (shift.category === 'WORK' && nextShift && nextShift.category === 'WORK') {
          const currDate = new Date(current.date);
          const nextDate = new Date(next.date);
          const dayDiff = Math.round((nextDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

          // If shifts are on consecutive days or same day
          if (dayDiff === 1) {
            // Calculate end time of current and start time of next
            const [cEndH, cEndM] = current.endTime.split(':').map(Number);
            const [nStartH, nStartM] = next.startTime.split(':').map(Number);

            // Shift crossing midnight (like 18:00 - 06:00)
            const cEndAbsolute = (current.startTime > current.endTime ? 24 : 0) + cEndH + cEndM / 60;
            const nStartAbsolute = 24 + nStartH + nStartM / 60;

            const rawRestHours = nStartAbsolute - cEndAbsolute;
            // KSz 41. § 2. pont: lakásra érkezéstől a munkába indulásig kell figyelembe venni!
            const travelHours = (emp.travelMinutes * 2) / 60;
            const netHomeRestHours = rawRestHours - travelHours;

            // Required rest is 12 hours for continuous rail work
            if (emp.workPattern === 'CONTINUOUS_4_SHIFT' || emp.workPattern === 'CONTINUOUS_12_24') {
              if (netHomeRestHours < 12) {
                violations.push({
                  id: `viol-rest-${emp.id}-${current.date}`,
                  severity: netHomeRestHours < 8 ? 'ERROR' : 'WARNING',
                  ruleCode: 'KSZ-41-1',
                  title: 'Elégtelen napi pihenőidő lakásra érkezéstől számítva',
                  description: `${emp.name} két szolgálata között a tiszta otthoni pihenőidő csak ${netHomeRestHours.toFixed(1)} óra (${emp.travelMinutes} perc utazási idő levonásával). A MÁV KSz 41. § szerint 12 óra kötelező (törvényi minimum: 8 óra).`,
                  legalCitation: 'MÁV KSz 41. § 1-2. pont & 2025. augusztus 27. Megállapodás VIII.',
                  employeeId: emp.id,
                  employeeName: emp.name,
                  date: current.date,
                  suggestedAction: 'Növelje a két szolgálat közötti szünetet legalább 12 órára plusz utazási idő.'
                });
              }
            } else if (rawRestHours < 11) {
              violations.push({
                id: `viol-rest-std-${emp.id}-${current.date}`,
                severity: rawRestHours < 8 ? 'ERROR' : 'WARNING',
                ruleCode: 'MT-104',
                title: 'Napi pihenőidő nem éri el a törvényi 11 órát',
                description: `${emp.name} szolgálatai között a pihenőidő ${rawRestHours.toFixed(1)} óra a jogszabályi 11 óra helyett.`,
                legalCitation: 'Munka Törvénykönyve 104. §',
                employeeId: emp.id,
                employeeName: emp.name,
                date: current.date
              });
            }
          }
        }
      }

      // Check 120h notice rule (KSz 29. § 2.)
      if (current.isModifiedWithin120h) {
        violations.push({
          id: `viol-120h-${emp.id}-${current.date}`,
          severity: 'INFO',
          ruleCode: 'KSZ-29-2',
          title: '120 órán belüli rendkívüli beosztás-módosítás',
          description: `${emp.name} műszakja 120 órán belül lett módosítva. A KSz 29. § 2. pontja alapján a beosztás 120 órán belül csak a munkavállaló írásbeli kérelmére vagy a felek írásos megállapodásával módosítható.`,
          legalCitation: 'MÁV Kollektív Szerződés 29. § 2. pont',
          employeeId: emp.id,
          employeeName: emp.name,
          date: current.date,
          suggestedAction: 'Ellenőrizze az írásos munkavállalói kérelmet vagy megállapodást az irattárban.'
        });
      }
    }

    // Check Monthly Sunday 36h Rest (KSz 42. § 3. pont & Megállapodás IX.)
    // "a heti pihenőidőt havonta legalább egyszer úgy kell beosztani, hogy annak időtartama a 36 órát elérje és abba a szombat 19 órától hétfő 05 óráig tartó időszak is beleessen"
    // Check every weekend in month
    for (let day = 1; day <= monthSummary.totalDays; day++) {
      const d = new Date(monthSummary.year, monthSummary.month, day);
      if (d.getDay() === 0) { // Sunday
        // Check assignments on Sunday, and Sat night / Mon morning
        const sundayStr = `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const satStr = day > 1 ? `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day - 1).padStart(2, '0')}` : null;
        const monStr = day < monthSummary.totalDays ? `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day + 1).padStart(2, '0')}` : null;

        const sunAssign = list.find(a => a.date === sundayStr);
        const satAssign = satStr ? list.find(a => a.date === satStr) : null;
        const monAssign = monStr ? list.find(a => a.date === monStr) : null;

        const isSunFree = !sunAssign || shiftMap.get(sunAssign.shiftTypeId)?.category === 'REST';
        const isSatNightFree = !satAssign || !satAssign.isNightShift;
        const isMonMorningFree = !monAssign || monAssign.startTime >= '05:00';

        if (isSunFree && isSatNightFree && isMonMorningFree) {
          hasFullSundayRest36h = true;
          break;
        }
      }
    }

    if (!hasFullSundayRest36h && (emp.workPattern === 'CONTINUOUS_4_SHIFT' || emp.workPattern === 'CONTINUOUS_12_24')) {
      violations.push({
        id: `viol-sun36-${emp.id}`,
        severity: 'WARNING',
        ruleCode: 'KSZ-42-3',
        title: 'Havi kötelező 36 órás vasárnapi pihenőidő hiánya',
        description: `${emp.name} számára a tárgyhónapban nem található olyan hétvégi pihenőidő, amely legalább 36 órás és lefedi a szombat 19:00 - hétfő 05:00 közötti teljes vasárnapi időszakot.`,
        legalCitation: 'MÁV KSz 42. § 3. pont & 2025. augusztus 27. Megállapodás IX.',
        employeeId: emp.id,
        employeeName: emp.name,
        suggestedAction: 'Jelöljön ki a munkavállalónak legalább egy teljes vasárnapot felölelő hétvégi pihenőt.'
      });
    }

    // Check Overtime & Statutory Hours
    const overtimeMonth = Math.max(0, scheduledWorkHours - monthSummary.statutoryRequiredHours);
    const projectedAnnualOvertime = emp.annualOvertimeHours + overtimeMonth;

    if (projectedAnnualOvertime > 300) {
      violations.push({
        id: `viol-ot-300-${emp.id}`,
        severity: 'ERROR',
        ruleCode: 'KSZ-35-1',
        title: 'Éves 300 órás rendkívüli munkaidő (túlóra) keret túllépése',
        description: `${emp.name} göngyölített éves túlórája elérné a ${projectedAnnualOvertime} órát, ami meghaladja a MÁV KSz 35. § 1. pontjában rögzített naptári évi 300 órás maximumot!`,
        legalCitation: 'MÁV Kollektív Szerződés 35. § 1. pont',
        employeeId: emp.id,
        employeeName: emp.name,
        suggestedAction: 'Csökkentse a tárgyhavi munkaórákat a kötelező órakeret közelébe.'
      });
    }
  });

  // 2. Station-level coverage checks (if station provided)
  if (station && station.requiredPositions.length > 0) {
    for (let day = 1; day <= monthSummary.totalDays; day++) {
      const dateStr = `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayAssignments = assignments.filter(a => a.date === dateStr);

      station.requiredPositions.forEach(req => {
        let dayCount = 0;
        let nightCount = 0;

        dayAssignments.forEach(a => {
          const emp = empMap.get(a.employeeId);
          if (emp && emp.role.toLowerCase().includes(req.role.toLowerCase())) {
            const shift = shiftMap.get(a.shiftTypeId);
            if (shift && shift.category === 'WORK') {
              if (shift.isNightShift) nightCount++;
              else if (shift.isDayShift) dayCount++;
            }
          }
        });

        if (dayCount < req.dayShiftCount) {
          violations.push({
            id: `viol-staff-day-${dateStr}-${req.role}`,
            severity: 'WARNING',
            ruleCode: 'STAFFING-DEFICIT',
            title: `Létszámhiány: ${req.role} nappali szolgálatban`,
            description: `${dateStr} napon a nappali szolgálatban csak ${dayCount} fő ${req.role} dolgozik a megkövetelt ${req.dayShiftCount} fő helyett.`,
            legalCitation: 'Szolgálati helyi technológiai előírás',
            date: dateStr,
            suggestedAction: `Osszon be legalább ${req.dayShiftCount - dayCount} fő ${req.role} munkakörű dolgozót erre a napra.`
          });
        }

        if (nightCount < req.nightShiftCount) {
          violations.push({
            id: `viol-staff-night-${dateStr}-${req.role}`,
            severity: 'WARNING',
            ruleCode: 'STAFFING-DEFICIT',
            title: `Létszámhiány: ${req.role} éjszakai szolgálatban`,
            description: `${dateStr} napon az éjszakai szolgálatban csak ${nightCount} fő ${req.role} dolgozik a megkövetelt ${req.nightShiftCount} fő helyett.`,
            legalCitation: 'Szolgálati helyi technológiai előírás',
            date: dateStr,
            suggestedAction: `Osszon be legalább ${req.nightShiftCount - nightCount} fő ${req.role} munkakörű dolgozót éjszakára.`
          });
        }
      });
    }
  }

  return violations;
}
