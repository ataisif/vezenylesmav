import React, { useState } from 'react';
import { Employee, TeamRequest, RequestType } from '../types';
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Plus, 
  Heart, 
  GraduationCap, 
  Stethoscope, 
  AlertCircle,
  UserCheck
} from 'lucide-react';

interface LeaveAndPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  requests: TeamRequest[];
  onAddRequest: (req: Omit<TeamRequest, 'id'>) => void;
  onUpdateRequestStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void;
  onApplyScheduleSync: () => void;
}

export const LeaveAndPreferencesModal: React.FC<LeaveAndPreferencesModalProps> = ({
  isOpen,
  onClose,
  employees,
  requests,
  onAddRequest,
  onUpdateRequestStatus,
  onApplyScheduleSync
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [requestType, setRequestType] = useState<RequestType>('ANNUAL_LEAVE');
  const [startDate, setStartDate] = useState('2026-10-15');
  const [endDate, setEndDate] = useState('2026-10-16');
  const [reason, setReason] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !startDate || !endDate) return;

    onAddRequest({
      employeeId: selectedEmpId,
      type: requestType,
      startDate,
      endDate,
      reason: reason || 'Kérelem rögzítve',
      status: 'APPROVED',
      submissionDate: new Date().toISOString().split('T')[0]
    });

    setReason('');
  };

  const getRequestTypeName = (t: RequestType) => {
    switch (t) {
      case 'ANNUAL_LEAVE': return 'Rendes szabadság (Mt. 122. §)';
      case 'BLOOD_DONOR_LEAVE': return 'Véradói pótszabadság (KSz 43. § 3.)';
      case 'SPECIAL_MAV_LEAVE': return 'Főrendelkezői rendkívüli szabadság (KSz 43. § 4.)';
      case 'SICK_LEAVE': return 'Keresőképtelenség / Betegszabadság';
      case 'MEDICAL_EXAM': return 'Vasúti orvosi alkalmassági (KSz 34. § 3.)';
      case 'TRAINING_EXAM': return 'Kötelező oktatás / vizsga (KSz 34. § 1.)';
      case 'REQUEST_OFF': return 'Kért szabadnap (műszakigény)';
      case 'PREFER_DAY': return 'Nappali műszak igény';
      case 'PREFER_NIGHT': return 'Éjszakai műszak igény';
      case 'SHIFT_SWAP': return 'Kölcsönös műszakcsere (KSz 29. § 2.)';
      default: return t;
    }
  };

  const empMap = new Map(employees.map(e => [e.id, e]));

  const filteredRequests = requests.filter(r => {
    if (filterType === 'ALL') return true;
    if (filterType === 'LEAVE') {
      return r.type === 'ANNUAL_LEAVE' || r.type === 'BLOOD_DONOR_LEAVE' || r.type === 'SPECIAL_MAV_LEAVE' || r.type === 'SICK_LEAVE';
    }
    if (filterType === 'PREFERENCE') {
      return r.type === 'PREFER_DAY' || r.type === 'PREFER_NIGHT' || r.type === 'REQUEST_OFF';
    }
    if (filterType === 'TRAINING_MEDICAL') {
      return r.type === 'TRAINING_EXAM' || r.type === 'MEDICAL_EXAM';
    }
    if (filterType === 'SWAP') {
      return r.type === 'SHIFT_SWAP';
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Csapattagok Szabadságai és Műszakigényei</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              MÁV KSz 43. § szerinti szabadságok, véradói kedvezmények és egyéni szolgálati igények
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Section: Employee Leave Balances Summary Cards */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              MÁV Szabadság Keretek és Kedvezmények (2025/2026)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {employees.slice(0, 4).map(emp => (
                <div key={emp.id} className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-xs">
                  <div className="font-semibold text-slate-200 truncate">{emp.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{emp.role}</div>
                  <div className="mt-1.5 flex items-baseline justify-between text-slate-300">
                    <span>Fennmaradó:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {emp.totalAnnualLeaveDays - emp.usedLeaveDays} nap
                    </span>
                  </div>
                  {/* Special perks badges */}
                  <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-400 flex-wrap">
                    {emp.age >= 60 && <span className="text-amber-400">60+ év (+1 nap)</span>}
                    {emp.bloodDonationsThisYear >= (emp.name.includes('Zsuzsanna') ? 3 : 4) && (
                      <span className="text-rose-400">Véradó (+2 nap)</span>
                    )}
                    {emp.isEligibleForSpecialLeave && (
                      <span className="text-sky-400">Főrend. (+2 nap)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form to submit a new leave or preference */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Új kérelem vagy műszakigény rögzítése</span>
            </h4>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Munkavállaló</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Kérelem Típusa</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as RequestType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="ANNUAL_LEAVE">Rendes szabadság (Mt. 122. §)</option>
                  <option value="BLOOD_DONOR_LEAVE">Véradói pótszabadság (KSz 43. § 3.)</option>
                  <option value="SPECIAL_MAV_LEAVE">Főrendelkezői szabadság (KSz 43. § 4.)</option>
                  <option value="SICK_LEAVE">Keresőképtelenség (orvosi)</option>
                  <option value="REQUEST_OFF">Kért szabadnap (preferencia)</option>
                  <option value="PREFER_DAY">Preferált: Nappali műszak</option>
                  <option value="PREFER_NIGHT">Preferált: Éjszakai műszak</option>
                  <option value="MEDICAL_EXAM">Időszakos orvosi vizsgálat (KSz 34. § 3.)</option>
                  <option value="TRAINING_EXAM">Kötelező továbbképzés (KSz 34. § 1.)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Kezdő dátum</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Záró dátum</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-400 mb-1">Indoklás / Megjegyzés</label>
                <input
                  type="text"
                  placeholder="pl. Családi esemény, tervezett utazás, véradó állomás igazolás száma..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Kérelem Rögzítése
                </button>
              </div>
            </form>
          </div>

          {/* List of current requests with filtering */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Beérkezett Kérelmek és Igények ({filteredRequests.length})
              </h4>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-2.5 py-1 rounded text-xs ${filterType === 'ALL' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Összes
                </button>
                <button
                  onClick={() => setFilterType('LEAVE')}
                  className={`px-2.5 py-1 rounded text-xs ${filterType === 'LEAVE' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Szabadságok
                </button>
                <button
                  onClick={() => setFilterType('PREFERENCE')}
                  className={`px-2.5 py-1 rounded text-xs ${filterType === 'PREFERENCE' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Műszakigények
                </button>
                <button
                  onClick={() => setFilterType('TRAINING_MEDICAL')}
                  className={`px-2.5 py-1 rounded text-xs ${filterType === 'TRAINING_MEDICAL' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Oktatás / Orvosi
                </button>
                <button
                  onClick={() => setFilterType('SWAP')}
                  className={`px-2.5 py-1 rounded text-xs ${filterType === 'SWAP' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Műszakcserék
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              {filteredRequests.map(req => {
                const emp = empMap.get(req.employeeId);

                return (
                  <div key={req.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-xs">
                          {emp?.name || 'Munkavállaló'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {emp?.employeeNumber}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-amber-300/90 px-1.5 py-0.5 rounded font-medium">
                          {getRequestTypeName(req.type)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="font-mono text-slate-400">
                          {req.startDate} — {req.endDate}
                        </span>
                        <span>·</span>
                        <span className="text-slate-400 italic truncate">
                          "{req.reason}"
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        req.status === 'APPROVED' 
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                          : req.status === 'REJECTED'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                          : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                      }`}>
                        {req.status === 'APPROVED' ? 'Jóváhagyva' : req.status === 'REJECTED' ? 'Elutasítva' : 'Függőben'}
                      </span>

                      {req.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => onUpdateRequestStatus(req.id, 'APPROVED')}
                            className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                            title="Jóváhagyás"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onUpdateRequestStatus(req.id, 'REJECTED')}
                            className="p-1 bg-rose-600 hover:bg-rose-500 text-white rounded transition-colors"
                            title="Elutasítás"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            A jóváhagyott szabadságok automatikusan zárolt műszakként kerülnek be a havi vezénylési rácsba.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onApplyScheduleSync();
                onClose();
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Szinkronizálás a Beosztással
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
