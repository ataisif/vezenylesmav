import { Employee, ShiftAssignment, TeamRequest, MonthSummary, StationConfig } from '../types';
import { MAV_SHIFT_TYPES, HUNGARIAN_HOLIDAYS_MAP, SPECIAL_PREMIUM_DATES } from '../data/mavRegulations';

/**
 * Automatically calculates breakdown of night, afternoon, and holiday hours for a shift.
 */
export function calculateShiftHourBreakdown(
  shiftTypeId: string,
  dateStr: string,
  startTime: string,
  endTime: string,
  durationHours: number
) {
  let nightHours = 0;
  let afternoonHours = 0;
  let holidayHours = 0;

  const isHoliday = !!HUNGARIAN_HOLIDAYS_MAP[dateStr] || !!SPECIAL_PREMIUM_DATES[dateStr];

  if (durationHours > 0) {
    if (isHoliday) {
      holidayHours = durationHours;
    }

    if (shiftTypeId === 'N12' || shiftTypeId === 'BB_ZAVAR_N' || shiftTypeId === 'BB_DISZP_N') {
      // 06:00 - 18:00 -> afternoon hours: 14:00 - 18:00 = 4 hours
      afternoonHours = 4;
      nightHours = 0;
    } else if (shiftTypeId === 'E12' || shiftTypeId === 'BB_ZAVAR_E' || shiftTypeId === 'BB_DISZP_E') {
      // 18:00 - 06:00 -> afternoon hours: 18:00 - 22:00 = 4h; night hours: 22:00 - 06:00 = 8h
      afternoonHours = 4;
      nightHours = 8;
    } else if (shiftTypeId === 'DE8') {
      // 06:00 - 14:00 -> 0 night, 0 afternoon
      nightHours = 0;
      afternoonHours = 0;
    } else if (shiftTypeId === 'BB_KARB') {
      // 07:00 - 15:20 -> 14:00 - 15:20 = 1.33h afternoon
      afternoonHours = 1.33;
      nightHours = 0;
    } else if (shiftTypeId === 'DU8') {
      // 14:00 - 22:00 -> 8 afternoon hours (KSz 47.§ 1.a)
      afternoonHours = 8;
      nightHours = 0;
    } else if (shiftTypeId === 'EJ8') {
      // 22:00 - 06:00 -> 8 night hours (KSz 47.§ 1.b)
      nightHours = 8;
      afternoonHours = 0;
    } else if (shiftTypeId === 'NY12') {
      // 07:00 - 19:00 -> 14:00 - 19:00 = 5h afternoon
      afternoonHours = 5;
      nightHours = 0;
    }
  }

  return { nightHours, afternoonHours, holidayHours };
}

/**
 * Generates an automated, compliant monthly work roster for both traffic and signaling (TEB) railway crew.
 */
export function generateSmartMonthlySchedule(
  employees: Employee[],
  requests: TeamRequest[],
  monthSummary: MonthSummary,
  station?: StationConfig
): ShiftAssignment[] {
  const assignments: ShiftAssignment[] = [];
  const totalDays = monthSummary.totalDays;
  const shiftTypesMap = new Map(MAV_SHIFT_TYPES.map(s => [s.id, s]));

  // Index approved requests by employeeId and date
  const requestByEmpDate = new Map<string, TeamRequest>();
  requests.filter(r => r.status === 'APPROVED').forEach(req => {
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      requestByEmpDate.set(`${req.employeeId}_${dateStr}`, req);
    }
  });

  // Split employees by work pattern & department
  const continuous4Emps = employees.filter(e => e.workPattern === 'CONTINUOUS_4_SHIFT');
  const threeShiftEmps = employees.filter(e => e.workPattern === 'THREE_SHIFT');
  const continuous1224Emps = employees.filter(e => e.workPattern === 'CONTINUOUS_12_24');
  const dispatchedEmps = employees.filter(e => e.workPattern === 'DISPATCHED');
  const otherEmps = employees.filter(
    e => e.workPattern !== 'CONTINUOUS_4_SHIFT' && 
         e.workPattern !== 'THREE_SHIFT' && 
         e.workPattern !== 'CONTINUOUS_12_24' &&
         e.workPattern !== 'DISPATCHED'
  );

  // 1. Process Continuous 4-shift staff (4-brigádos: Nappal -> Éjszaka -> Pihenő -> Pihenő)
  continuous4Emps.forEach((emp, empIdx) => {
    // Stagger phase offset: empIdx % 4
    const phaseOffset = empIdx % 4;
    const isSignalingDisp = emp.role.includes('diszpécser') && emp.department === 'SIGNALING';

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const approvedReq = requestByEmpDate.get(`${emp.id}_${dateStr}`);

      let shiftId = 'PIH';
      let note: string | undefined = undefined;

      if (approvedReq) {
        if (approvedReq.type === 'ANNUAL_LEAVE' || approvedReq.type === 'BLOOD_DONOR_LEAVE' || approvedReq.type === 'SPECIAL_MAV_LEAVE') {
          shiftId = 'SZAB';
          note = approvedReq.reason;
        } else if (approvedReq.type === 'SICK_LEAVE') {
          shiftId = 'BETEG';
          note = approvedReq.reason;
        } else if (approvedReq.type === 'MEDICAL_EXAM') {
          shiftId = 'ORV';
          note = approvedReq.reason;
        } else if (approvedReq.type === 'TRAINING_EXAM') {
          shiftId = 'OKT';
          note = approvedReq.reason;
        } else if (approvedReq.type === 'REQUEST_OFF') {
          shiftId = 'PIH';
          note = 'Kért szabadnap';
        }
      } else {
        // Regular 4-shift cyclic turn
        const cycleDay = (day + phaseOffset) % 4;
        if (cycleDay === 0) {
          shiftId = isSignalingDisp ? 'BB_DISZP_N' : 'N12'; // Nappal 12h
        } else if (cycleDay === 1) {
          shiftId = isSignalingDisp ? 'BB_DISZP_E' : 'E12'; // Éjszaka 12h
        } else {
          shiftId = 'PIH'; // Pihenő (24h / 48h)
        }
      }

      const st = shiftTypesMap.get(shiftId) || shiftTypesMap.get('PIH')!;
      const hoursBreakdown = calculateShiftHourBreakdown(
        shiftId,
        dateStr,
        st.defaultStartTime,
        st.defaultEndTime,
        st.durationHours
      );

      assignments.push({
        id: `asg-${emp.id}-${dateStr}`,
        employeeId: emp.id,
        date: dateStr,
        shiftTypeId: shiftId,
        startTime: st.defaultStartTime,
        endTime: st.defaultEndTime,
        durationHours: st.durationHours,
        isNightShift: st.isNightShift,
        nightHours: hoursBreakdown.nightHours,
        afternoonHours: hoursBreakdown.afternoonHours,
        holidayHours: hoursBreakdown.holidayHours,
        isOvertime: false,
        isModifiedWithin120h: false,
        note,
        locked: !!approvedReq
      });
    }
  });

  // 2. Dispatched staff (Vezényelt munkarend - KSz 24.§ 1.g - pl. Biztosítóberendezési lakatos, műszerész, technikus)
  dispatchedEmps.forEach((emp, empIdx) => {
    const isSignaling = emp.department === 'SIGNALING';

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(monthSummary.year, monthSummary.month, day);
      const dayOfWeek = date.getDay(); // 0 = Vasárnap, 6 = Szombat
      const dateStr = `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const approvedReq = requestByEmpDate.get(`${emp.id}_${dateStr}`);

      let shiftId = 'PIH';
      let note: string | undefined = undefined;

      if (approvedReq) {
        if (approvedReq.type === 'ANNUAL_LEAVE') shiftId = 'SZAB';
        else if (approvedReq.type === 'BLOOD_DONOR_LEAVE') shiftId = 'VER';
        else if (approvedReq.type === 'SICK_LEAVE') shiftId = 'BETEG';
        else if (approvedReq.type === 'MEDICAL_EXAM') shiftId = 'ORV';
        else if (approvedReq.type === 'TRAINING_EXAM') shiftId = 'OKT';
        else if (approvedReq.type === 'REQUEST_OFF') shiftId = 'PIH';
        note = approvedReq.reason;
      } else {
        // Dispatched pattern: Workdays are maintenance shifts (BB_KARB 8h)
        // Weekend rotation: One staff member takes 12h troubleshooting or standby
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = !!HUNGARIAN_HOLIDAYS_MAP[dateStr];

        if (!isWeekend && !isHoliday) {
          // Mon-Fri: Standard 8h maintenance or 12h fault service
          if (isSignaling) {
            // Rotating fault service vs planned maintenance
            if ((day + empIdx) % 7 === 0) {
              shiftId = 'BB_ZAVAR_N'; // 12h nappali hibaelhárítás
            } else {
              shiftId = 'BB_KARB'; // 8h megelőző biztosítóberendezés karbantartás
            }
          } else {
            shiftId = 'DE8';
          }
        } else {
          // Weekend: Rotating standby or rest
          if (isSignaling && ((day + empIdx) % 8 === 0)) {
            shiftId = 'BB_ZAVAR_N'; // Hétvégi vonali felügyelet
          } else if (isSignaling && ((day + empIdx) % 4 === 1)) {
            shiftId = 'KESZ'; // Otthoni zavarelhárító készenlét (KSz 37.§)
            note = 'Hétvégi BB zavarelhárító készenlét';
          } else {
            shiftId = 'PIH';
          }
        }
      }

      const st = shiftTypesMap.get(shiftId) || shiftTypesMap.get('PIH')!;
      const hoursBreakdown = calculateShiftHourBreakdown(
        shiftId,
        dateStr,
        st.defaultStartTime,
        st.defaultEndTime,
        st.durationHours
      );

      assignments.push({
        id: `asg-${emp.id}-${dateStr}`,
        employeeId: emp.id,
        date: dateStr,
        shiftTypeId: shiftId,
        startTime: st.defaultStartTime,
        endTime: st.defaultEndTime,
        durationHours: st.durationHours,
        isNightShift: st.isNightShift,
        nightHours: hoursBreakdown.nightHours,
        afternoonHours: hoursBreakdown.afternoonHours,
        holidayHours: hoursBreakdown.holidayHours,
        isOvertime: false,
        isModifiedWithin120h: false,
        note,
        locked: !!approvedReq
      });
    }
  });

  // 3. Process Three-shift staff
  threeShiftEmps.forEach((emp, empIdx) => {
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(monthSummary.year, monthSummary.month, day);
      const dayOfWeek = date.getDay();
      const dateStr = `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const approvedReq = requestByEmpDate.get(`${emp.id}_${dateStr}`);

      let shiftId = 'PIH';
      let note: string | undefined = undefined;

      if (approvedReq) {
        if (approvedReq.type === 'ANNUAL_LEAVE') shiftId = 'SZAB';
        else if (approvedReq.type === 'BLOOD_DONOR_LEAVE') shiftId = 'VER';
        else if (approvedReq.type === 'SICK_LEAVE') shiftId = 'BETEG';
        else if (approvedReq.type === 'MEDICAL_EXAM') shiftId = 'ORV';
        else if (approvedReq.type === 'TRAINING_EXAM') shiftId = 'OKT';
        note = approvedReq.reason;
      } else {
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !HUNGARIAN_HOLIDAYS_MAP[dateStr]) {
          const weekNum = Math.floor((day - 1) / 7);
          const shiftCycle = (weekNum + empIdx) % 3;
          if (shiftCycle === 0) shiftId = 'DE8';
          else if (shiftCycle === 1) shiftId = 'DU8';
          else shiftId = 'EJ8';
        }
      }

      const st = shiftTypesMap.get(shiftId) || shiftTypesMap.get('PIH')!;
      const hoursBreakdown = calculateShiftHourBreakdown(
        shiftId,
        dateStr,
        st.defaultStartTime,
        st.defaultEndTime,
        st.durationHours
      );

      assignments.push({
        id: `asg-${emp.id}-${dateStr}`,
        employeeId: emp.id,
        date: dateStr,
        shiftTypeId: shiftId,
        startTime: st.defaultStartTime,
        endTime: st.defaultEndTime,
        durationHours: st.durationHours,
        isNightShift: st.isNightShift,
        nightHours: hoursBreakdown.nightHours,
        afternoonHours: hoursBreakdown.afternoonHours,
        holidayHours: hoursBreakdown.holidayHours,
        isOvertime: false,
        isModifiedWithin120h: false,
        note,
        locked: !!approvedReq
      });
    }
  });

  // 4. Continuous 12/24 staff
  continuous1224Emps.forEach((emp, empIdx) => {
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const approvedReq = requestByEmpDate.get(`${emp.id}_${dateStr}`);

      let shiftId = 'PIH';
      let note: string | undefined = undefined;

      if (approvedReq) {
        if (approvedReq.type === 'ANNUAL_LEAVE') shiftId = 'SZAB';
        else if (approvedReq.type === 'SICK_LEAVE') shiftId = 'BETEG';
        else if (approvedReq.type === 'MEDICAL_EXAM') shiftId = 'ORV';
        else if (approvedReq.type === 'TRAINING_EXAM') shiftId = 'OKT';
        note = approvedReq.reason;
      } else {
        const cycleDay = (day + empIdx) % 3;
        if (cycleDay === 0) shiftId = 'N12';
        else if (cycleDay === 1) shiftId = 'E12';
        else shiftId = 'PIH';
      }

      const st = shiftTypesMap.get(shiftId) || shiftTypesMap.get('PIH')!;
      const hoursBreakdown = calculateShiftHourBreakdown(
        shiftId,
        dateStr,
        st.defaultStartTime,
        st.defaultEndTime,
        st.durationHours
      );

      assignments.push({
        id: `asg-${emp.id}-${dateStr}`,
        employeeId: emp.id,
        date: dateStr,
        shiftTypeId: shiftId,
        startTime: st.defaultStartTime,
        endTime: st.defaultEndTime,
        durationHours: st.durationHours,
        isNightShift: st.isNightShift,
        nightHours: hoursBreakdown.nightHours,
        afternoonHours: hoursBreakdown.afternoonHours,
        holidayHours: hoursBreakdown.holidayHours,
        isOvertime: false,
        isModifiedWithin120h: false,
        note,
        locked: !!approvedReq
      });
    }
  });

  // 5. Standard H-P staff (pl. Biztosítóberendezési szakaszmérnök, műszaki szakértő, gyakornok)
  otherEmps.forEach((emp) => {
    const isSignaling = emp.department === 'SIGNALING';

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(monthSummary.year, monthSummary.month, day);
      const dayOfWeek = date.getDay();
      const dateStr = `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const approvedReq = requestByEmpDate.get(`${emp.id}_${dateStr}`);

      let shiftId = 'PIH';
      let note: string | undefined = undefined;

      if (approvedReq) {
        if (approvedReq.type === 'ANNUAL_LEAVE') shiftId = 'SZAB';
        else if (approvedReq.type === 'SICK_LEAVE') shiftId = 'BETEG';
        else if (approvedReq.type === 'MEDICAL_EXAM') shiftId = 'ORV';
        else if (approvedReq.type === 'TRAINING_EXAM') shiftId = 'OKT';
        note = approvedReq.reason;
      } else {
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !HUNGARIAN_HOLIDAYS_MAP[dateStr]) {
          if (isSignaling) {
            shiftId = 'BB_KARB'; // 8h biztosítóberendezési szolgálat (07:00-15:20)
          } else {
            shiftId = emp.workPattern === 'EXTENDED_SHIFT' ? 'NY12' : 'DE8';
          }
        }
      }

      const st = shiftTypesMap.get(shiftId) || shiftTypesMap.get('PIH')!;
      const hoursBreakdown = calculateShiftHourBreakdown(
        shiftId,
        dateStr,
        st.defaultStartTime,
        st.defaultEndTime,
        st.durationHours
      );

      assignments.push({
        id: `asg-${emp.id}-${dateStr}`,
        employeeId: emp.id,
        date: dateStr,
        shiftTypeId: shiftId,
        startTime: st.defaultStartTime,
        endTime: st.defaultEndTime,
        durationHours: st.durationHours,
        isNightShift: st.isNightShift,
        nightHours: hoursBreakdown.nightHours,
        afternoonHours: hoursBreakdown.afternoonHours,
        holidayHours: hoursBreakdown.holidayHours,
        isOvertime: false,
        isModifiedWithin120h: false,
        note,
        locked: !!approvedReq
      });
    }
  });

  return assignments;
}
