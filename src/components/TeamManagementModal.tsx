import React, { useState } from 'react';
import { Employee, WorkPattern, StationConfig, DepartmentType, TRAFFIC_ROLES, SIGNALING_ROLES } from '../types';
import { Users, X, Plus, Trash2, Edit2, Check, MapPin, Building2, Train, Cpu, ShieldCheck, Filter } from 'lucide-react';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  stations: StationConfig[];
  currentStation: StationConfig;
  onUpdateEmployee: (emp: Employee) => void;
  onAddEmployee: (emp: Omit<Employee, 'id'>) => void;
  onDeleteEmployee?: (empId: string) => void;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
  employees,
  stations,
  currentStation,
  onUpdateEmployee,
  onAddEmployee,
  onDeleteEmployee
}) => {
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState<'ALL' | 'TRAFFIC' | 'SIGNALING'>('ALL');

  // Form state
  const [name, setName] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [role, setRole] = useState<string>('Rendelkező forgalmi szolgálattevő');
  const [department, setDepartment] = useState<DepartmentType>('TRAFFIC');
  const [workPattern, setWorkPattern] = useState<WorkPattern>('CONTINUOUS_4_SHIFT');
  const [stationName, setStationName] = useState(currentStation.name);
  const [travelMinutes, setTravelMinutes] = useState(30);
  const [age, setAge] = useState(40);
  const [bloodDonations, setBloodDonations] = useState(0);
  const [isEligibleForSpecialLeave, setIsEligibleForSpecialLeave] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setEmployeeNumber('');
    setRole('Rendelkező forgalmi szolgálattevő');
    setDepartment('TRAFFIC');
    setWorkPattern('CONTINUOUS_4_SHIFT');
    setStationName(currentStation.name);
    setTravelMinutes(30);
    setAge(40);
    setBloodDonations(0);
    setIsEligibleForSpecialLeave(false);
    setIsAddingNew(false);
    setEditingEmpId(null);
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    const isSignaling = SIGNALING_ROLES.some(r => r === newRole);
    const newDept: DepartmentType = isSignaling ? 'SIGNALING' : 'TRAFFIC';
    setDepartment(newDept);

    // Auto-adjust work pattern recommendations based on role
    if (newRole === 'Biztosítóberendezési szakaszmérnök' || newRole === 'Digitális és hibaelhárító mérnök') {
      setWorkPattern('STANDARD');
    } else if (newRole === 'Biztosítóberendezési lakatos' || newRole === 'Biztosítóberendezési műszerész' || newRole === 'Biztosítóberendezési technikus' || newRole === 'Biztosítóberendezési vonalellenőr') {
      setWorkPattern('DISPATCHED');
    } else if (newRole === 'Biztosítóberendezési diszpécser') {
      setWorkPattern('CONTINUOUS_4_SHIFT');
    } else if (newRole === 'Főrendelkező' || newRole === 'Tartalékos térfőnök') {
      setIsEligibleForSpecialLeave(true);
    }
  };

  const handleStartEdit = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setName(emp.name);
    setEmployeeNumber(emp.employeeNumber);
    setRole(emp.role);
    setDepartment(emp.department || (SIGNALING_ROLES.some(r => r === emp.role) ? 'SIGNALING' : 'TRAFFIC'));
    setWorkPattern(emp.workPattern);
    setStationName(emp.station || currentStation.name);
    setTravelMinutes(emp.travelMinutes);
    setAge(emp.age);
    setBloodDonations(emp.bloodDonationsThisYear);
    setIsEligibleForSpecialLeave(emp.isEligibleForSpecialLeave);
    setIsAddingNew(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !employeeNumber.trim()) return;

    const calculatedDept: DepartmentType = department || (SIGNALING_ROLES.some(r => r === role) ? 'SIGNALING' : 'TRAFFIC');

    if (editingEmpId) {
      const existing = employees.find(e => e.id === editingEmpId);
      if (existing) {
        onUpdateEmployee({
          ...existing,
          name: name.trim(),
          employeeNumber: employeeNumber.trim(),
          role: role.trim(),
          department: calculatedDept,
          workPattern,
          station: stationName,
          travelMinutes,
          age,
          bloodDonationsThisYear: bloodDonations,
          isEligibleForSpecialLeave
        });
      }
    } else {
      onAddEmployee({
        name: name.trim(),
        employeeNumber: employeeNumber.trim(),
        role: role.trim(),
        department: calculatedDept,
        workPattern,
        station: stationName,
        travelMinutes,
        age,
        bloodDonationsThisYear: bloodDonations,
        isEligibleForSpecialLeave,
        annualOvertimeHours: 0,
        totalAnnualLeaveDays: 20 + Math.min(10, Math.max(0, Math.floor((age - 25) / 3))) + (age >= 60 ? 1 : 0) + (bloodDonations >= 3 ? 2 : 0) + (isEligibleForSpecialLeave ? 2 : 0),
        usedLeaveDays: 0,
        phone: '+36 30 123 4567',
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@${calculatedDept === 'SIGNALING' ? 'teb' : 'palyavasut'}.mav.hu`
      });
    }

    resetForm();
  };

  // Filtered list
  const filteredEmployees = employees.filter(emp => {
    if (departmentFilter === 'ALL') return true;
    const isSignaling = emp.department === 'SIGNALING' || SIGNALING_ROLES.some(r => r === emp.role);
    if (departmentFilter === 'SIGNALING') return isSignaling;
    return !isSignaling;
  });

  const trafficCount = employees.filter(e => e.department !== 'SIGNALING' && !SIGNALING_ROLES.some(r => r === e.role)).length;
  const signalingCount = employees.filter(e => e.department === 'SIGNALING' || SIGNALING_ROLES.some(r => r === e.role)).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>Vasúti Személyzet és Szakszolgálatok Nyilvántartása</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Forgalmi és Biztosítóberendezési (TEB) szakszolgálat, munkarendek (KSz 24. §), szolgálati helyek és lakóhelyi utazási idők (KSz 41. §)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isAddingNew && (
              <button
                onClick={() => {
                  resetForm();
                  setStationName(currentStation.name);
                  setIsAddingNew(true);
                }}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Új Munkatárs Felvétele</span>
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Add/Edit Employee Form */}
          {isAddingNew && (
            <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-4 text-xs shadow-lg">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                  {department === 'SIGNALING' ? <Cpu className="w-4 h-4 text-emerald-400" /> : <Train className="w-4 h-4 text-sky-400" />}
                  {editingEmpId ? 'Munkavállaló adatainak módosítása' : 'Új munkavállaló felvétele a vasúti állományba'}
                </span>
                <button onClick={resetForm} className="text-slate-400 hover:text-white flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Mégse
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Munkavállaló Neve <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="pl. Molnár Gábor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Személyi Törzsszám <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="pl. MV-20114"
                    value={employeeNumber}
                    onChange={(e) => setEmployeeNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Munkakör (Szakterület szerint) <span className="text-rose-400">*</span></label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <optgroup label="🔧 Biztosítóberendezési (TEB) Munkakörök">
                      {SIGNALING_ROLES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🚆 Forgalmi Szolgálat Munkakörei">
                      {TRAFFIC_ROLES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Szakterület / Szakszolgálat badge */}
                <div>
                  <label className="block text-slate-400 mb-1">Szakszolgálati Besorolás</label>
                  <div className="flex items-center gap-2 py-1.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                      department === 'SIGNALING'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    }`}>
                      {department === 'SIGNALING' ? <Cpu className="w-3.5 h-3.5" /> : <Train className="w-3.5 h-3.5" />}
                      {department === 'SIGNALING' ? 'Biztosítóberendezési (TEB)' : 'Forgalmi Szolgálat'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {department === 'SIGNALING' ? 'KSz 8. sz. melléklet (zavartalan vasút)' : 'KSz 12/A, 10. sz. melléklet'}
                    </span>
                  </div>
                </div>

                {/* Station Selection */}
                <div>
                  <label className="block text-slate-400 mb-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-amber-400" />
                    <span>Szolgálati hely (Állomás / Főnökség)</span>
                  </label>
                  <select
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {stations.map(st => (
                      <option key={st.id} value={st.name}>
                        {st.name} ({st.category === 'SIGNALING_DISTRICT' ? 'TEB Szakasz' : st.category === 'MAJOR_HIGH_TRAFFIC' ? '12/A Kiemelt' : 'Általános'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Work Pattern */}
                <div>
                  <label className="block text-slate-400 mb-1">Munkarend (KSz 24. és 27. §)</label>
                  <select
                    value={workPattern}
                    onChange={(e) => setWorkPattern(e.target.value as WorkPattern)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="DISPATCHED">Vezényelt munkarend (Zavartalan közlekedés KSz 24.§ 1.g)</option>
                    <option value="STANDARD">Általános munkarend (H-P 8h, KSz 24.§ 1.f)</option>
                    <option value="CONTINUOUS_4_SHIFT">Megszakítás nélküli 4-brigádos (12/24/12/48)</option>
                    <option value="CONTINUOUS_12_24">12/24-es fordulós munkarend</option>
                    <option value="THREE_SHIFT">Háromműszakos (DE 8h, DU 8h, ÉJ 8h)</option>
                    <option value="TWO_SHIFT">Kétműszakos (DE 8h, DU 8h)</option>
                    <option value="EXTENDED_SHIFT">Nyújtott műszakos (12h, KSz 24.§ 1.h)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 flex items-center justify-between">
                    <span>Lakóhelyi Utazási Idő (egy irányba)</span>
                    <span className="font-mono text-amber-400">{travelMinutes} perc</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={travelMinutes}
                    onChange={(e) => setTravelMinutes(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    KSz 41. § 2. pont: a 12 órás pihenő a lakásra érkezéstől a visszaindulásig tart!
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Életkor (év)</label>
                  <input
                    type="number"
                    min="18"
                    max="70"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  {age >= 60 && (
                    <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">
                      ✓ 60. évét betöltötte: +1 nap pótszabadság (KSz 43. § 3.)
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Igazolt Véradások Száma Tárgyévben</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={bloodDonations}
                    onChange={(e) => setBloodDonations(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  {bloodDonations >= 3 && (
                    <span className="text-[10px] text-rose-400 font-medium block mt-0.5">
                      ✓ Elérte a véradási limitet: +2 nap pótszabadság (KSz 43. § 3.)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:col-span-2 md:col-span-3 pt-2 border-t border-slate-800">
                  <input
                    type="checkbox"
                    id="specialLeaveCheck"
                    checked={isEligibleForSpecialLeave}
                    onChange={(e) => setIsEligibleForSpecialLeave(e.target.checked)}
                    className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="specialLeaveCheck" className="text-slate-300 text-xs cursor-pointer select-none">
                    Jogosult évi 2 nap MÁV rendkívüli szabadságra (főrendelkező, tartalékos térfőnök - KSz 43. § 4. pont)
                  </label>
                </div>

                <div className="sm:col-span-2 md:col-span-3 flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    Mégse
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingEmpId ? 'Módosítás Mentése' : 'Munkatárs Hozzáadása'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Department Filter Tabs */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
              <button
                onClick={() => setDepartmentFilter('ALL')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  departmentFilter === 'ALL'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Összes Dolgozó</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-300">
                  {employees.length}
                </span>
              </button>

              <button
                onClick={() => setDepartmentFilter('SIGNALING')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  departmentFilter === 'SIGNALING'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Biztosítóberendezés (TEB)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950/80 text-emerald-300">
                  {signalingCount}
                </span>
              </button>

              <button
                onClick={() => setDepartmentFilter('TRAFFIC')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  departmentFilter === 'TRAFFIC'
                    ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Train className="w-3.5 h-3.5" />
                <span>Forgalmi Szolgálat</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-950/80 text-sky-300">
                  {trafficCount}
                </span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Jelenlegi szolgálati hely: <strong className="text-slate-200">{currentStation.name}</strong>
            </span>
          </div>

          {/* List of current employees */}
          <div className="space-y-3">
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              {filteredEmployees.map(emp => {
                const isSignaling = emp.department === 'SIGNALING' || SIGNALING_ROLES.some(r => r === emp.role);
                return (
                  <div key={emp.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-900/40 transition-colors">
                    <div className="flex items-center gap-3">
                      {emp.avatarUrl ? (
                        <img src={emp.avatarUrl} alt={emp.name} className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0" />
                      ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                          isSignaling
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                            : 'bg-sky-950/60 text-sky-300 border-sky-700/60'
                        }`}>
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-100 text-sm">{emp.name}</span>
                          <span className="font-mono text-slate-400 text-[11px]">{emp.employeeNumber}</span>
                          
                          {/* Szakszolgálat badge */}
                          {isSignaling ? (
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium px-2 py-0.5 rounded flex items-center gap-1">
                              <Cpu className="w-2.5 h-2.5" /> TEB Biztosítóberendezés
                            </span>
                          ) : (
                            <span className="text-[10px] bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium px-2 py-0.5 rounded flex items-center gap-1">
                              <Train className="w-2.5 h-2.5" /> Forgalom
                            </span>
                          )}

                          <span className="text-[10px] bg-slate-800 text-amber-300 font-medium px-2 py-0.5 rounded">
                            {emp.workPattern === 'CONTINUOUS_4_SHIFT' ? '4-brigádos' : 
                             emp.workPattern === 'DISPATCHED' ? 'Vezényelt (zavartalan vasút)' :
                             emp.workPattern === 'STANDARD' ? 'Általános (8h)' :
                             emp.workPattern === 'THREE_SHIFT' ? '3-műszakos' : emp.workPattern}
                          </span>
                        </div>

                        <div className="text-slate-400 flex items-center gap-2 flex-wrap text-[11px]">
                          <span className="text-slate-200 font-medium">{emp.role}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Building2 className="w-3 h-3 text-amber-400" />
                            {emp.station || currentStation.name}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            Utazás: {emp.travelMinutes} perc
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 sm:self-center">
                      <div className="text-right font-mono text-[11px]">
                        <div className="text-slate-300">
                          Szabadság: <strong className="text-emerald-400">{emp.totalAnnualLeaveDays - emp.usedLeaveDays}</strong> / {emp.totalAnnualLeaveDays} nap
                        </div>
                        <div className="text-slate-500 text-[10px]">
                          Évi túlóra: {emp.annualOvertimeHours}h / 300h
                        </div>
                      </div>

                      <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                        <button
                          onClick={() => handleStartEdit(emp)}
                          title="Szerkesztés"
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteEmployee && employees.length > 1 && (
                          <button
                            onClick={() => {
                              if (confirm(`Biztosan törölni kívánja ${emp.name} munkatársat az állományból?`)) {
                                onDeleteEmployee(emp.id);
                              }
                            }}
                            title="Törlés"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredEmployees.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nem található munkatárs a kiválasztott szakszolgálatban.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Dolgozók és szakszolgálatok nyilvántartása (MÁV KSz 24. és 28. §)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
          >
            Kész
          </button>
        </div>

      </div>
    </div>
  );
};
