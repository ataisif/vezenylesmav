import React from 'react';
import { Employee, ShiftAssignment, MonthSummary, StationConfig } from '../types';
import { MAV_SHIFT_TYPES, HUNGARIAN_HOLIDAYS_MAP } from '../data/mavRegulations';

interface PrintScheduleViewProps {
  employees: Employee[];
  assignments: ShiftAssignment[];
  monthSummary: MonthSummary;
  station: StationConfig;
  onClosePrint?: () => void;
}

export const PrintScheduleView: React.FC<PrintScheduleViewProps> = ({
  employees,
  assignments,
  monthSummary,
  station,
  onClosePrint
}) => {
  const shiftMap = new Map(MAV_SHIFT_TYPES.map(s => [s.id, s]));
  const assignmentMap = new Map<string, ShiftAssignment>();
  assignments.forEach(a => assignmentMap.set(`${a.employeeId}_${a.date}`, a));

  const monthsHu = [
    'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
    'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
  ];

  const daysOfWeekHuShort = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'];

  return (
    <div className="bg-white text-black p-6 font-sans text-xs">
      
      {/* Print Controls (hidden in print output) */}
      <div className="no-print mb-6 p-4 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-between">
        <div>
          <span className="font-bold text-slate-800">Nyomtatási Előnézet</span>
          <p className="text-slate-600 text-xs">Kattintson a nyomtatás gombra a hivatalos MÁV vezénylési lap PDF vagy papír formátumú előállításához.</p>
        </div>
        <div className="flex items-center gap-2">
          {onClosePrint && (
            <button
              onClick={onClosePrint}
              className="px-3 py-1.5 border border-slate-400 text-slate-700 rounded text-xs hover:bg-slate-200"
            >
              Vissza a Szerkesztőhöz
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded text-xs"
          >
            Nyomtatás Indítása
          </button>
        </div>
      </div>

      {/* Official MÁV Header */}
      <div className="border-b-2 border-black pb-3 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-black tracking-wide uppercase">
              MÁV PÁLYAMŰKÖDTETÉSI ZRT.
            </h1>
            <h2 className="text-sm font-bold tracking-tight text-slate-800">
              HAVI MUNKAIDŐ-BEOSZTÁS ÉS VEZÉNYLÉSI ÍV
            </h2>
            <div className="text-[11px] text-slate-700 mt-1">
              Szolgálati hely: <strong className="text-black">{station.name}</strong> ({station.lineCode}) · Munkarendi szabályzat szerint
            </div>
          </div>

          <div className="text-right text-[11px]">
            <div><strong>Tárgyidőszak:</strong> {monthSummary.year}. {monthsHu[monthSummary.month]}</div>
            <div><strong>Kötelező munkaidő:</strong> {monthSummary.statutoryRequiredHours} óra ({monthSummary.workingDays} munkanap)</div>
            <div><strong>Közlés napja:</strong> {monthSummary.publicationDeadlineDate} (KSz 28. § 1.)</div>
          </div>
        </div>
      </div>

      {/* Printable Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-black text-[10px]">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th className="border border-black px-2 py-1 text-left w-44">
                Név / Munkakör / Törzsszám
              </th>
              {Array.from({ length: monthSummary.totalDays }, (_, i) => i + 1).map(day => {
                const date = new Date(monthSummary.year, monthSummary.month, day);
                const dayOfWeek = date.getDay();
                const isSunday = dayOfWeek === 0;
                const isSat = dayOfWeek === 6;
                const dateStr = `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isHol = !!HUNGARIAN_HOLIDAYS_MAP[dateStr];

                return (
                  <th
                    key={day}
                    className={`border border-black text-center px-0.5 py-0.5 ${
                      isHol ? 'bg-slate-300 font-bold' : isSunday ? 'bg-slate-200' : isSat ? 'bg-slate-100' : ''
                    }`}
                  >
                    <div>{daysOfWeekHuShort[dayOfWeek]}</div>
                    <div className="font-bold">{day}</div>
                  </th>
                );
              })}
              <th className="border border-black px-1 py-1 text-center w-12">
                Össz. óra
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const empAssignments = assignments.filter(a => a.employeeId === emp.id);
              const workHours = empAssignments
                .filter(a => a.shiftTypeId !== 'PIH')
                .reduce((sum, a) => sum + a.durationHours, 0);

              return (
                <tr key={emp.id} className="border-b border-black">
                  <td className="border border-black px-1.5 py-1">
                    <div className="font-bold text-[11px] leading-tight">{emp.name}</div>
                    <div className="text-[9px] text-slate-700">{emp.role} · {emp.employeeNumber}</div>
                  </td>

                  {Array.from({ length: monthSummary.totalDays }, (_, i) => i + 1).map(day => {
                    const dateStr = `${monthSummary.year}-${String(monthSummary.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const assignment = assignmentMap.get(`${emp.id}_${dateStr}`);
                    const shift = assignment ? shiftMap.get(assignment.shiftTypeId) : undefined;
                    const isSun = new Date(monthSummary.year, monthSummary.month, day).getDay() === 0;

                    return (
                      <td 
                        key={day} 
                        className={`border border-black text-center font-mono font-bold text-[10px] p-0.5 ${
                          isSun ? 'bg-slate-50' : ''
                        }`}
                      >
                        {shift ? shift.code : '-'}
                      </td>
                    );
                  })}

                  <td className="border border-black text-center font-mono font-bold text-[11px]">
                    {workHours}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend for Shift Codes */}
      <div className="mt-3 text-[10px] text-slate-700 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-300 pt-2">
        <span><strong>Jelmagyarázat:</strong></span>
        <span><strong>N12:</strong> Nappal (06:00-18:00)</span>
        <span><strong>É12:</strong> Éjszaka (18:00-06:00)</span>
        <span><strong>DE8:</strong> Délelőtt (06:00-14:00)</span>
        <span><strong>DU8:</strong> Délután (14:00-22:00)</span>
        <span><strong>ÉJ8:</strong> Éjszaka (22:00-06:00)</span>
        <span><strong>SZ:</strong> Szabadság</span>
        <span><strong>BSZ:</strong> Keresőképtelenség</span>
        <span><strong>OKT:</strong> Oktatás/Vizsga</span>
        <span><strong>ORV:</strong> Orvosi vizsgálat</span>
        <span><strong>P:</strong> Pihenőidő</span>
      </div>

      {/* Signatures & Certification Block (KSz 28. §) */}
      <div className="mt-8 grid grid-cols-3 gap-6 pt-4 border-t border-black text-[11px]">
        <div className="text-center">
          <div className="border-b border-black pb-8"></div>
          <div className="mt-1 font-semibold">Készítette / Vezénylő tiszt</div>
          <div className="text-[10px] text-slate-600">Dátum: {monthSummary.publicationDeadlineDate}</div>
        </div>

        <div className="text-center">
          <div className="border-b border-black pb-8"></div>
          <div className="mt-1 font-semibold">Jóváhagyta / Állomásfőnök</div>
          <div className="text-[10px] text-slate-600">Munkáltatói jogkörgyakorló</div>
        </div>

        <div className="text-center">
          <div className="border-b border-black pb-8"></div>
          <div className="mt-1 font-semibold">Szakszervezeti képviselet</div>
          <div className="text-[10px] text-slate-600">VDSzSz / VSZ / MTSzSz / PDSZ</div>
        </div>
      </div>

      <div className="mt-4 text-[9px] text-slate-500 text-center">
        Ez a dokumentum a 2012. évi I. törvény (Mt.) és a MÁV Pályaműködtetési Zrt. Kollektív Szerződésének (KSz) megfelelően készült.
      </div>

    </div>
  );
};
