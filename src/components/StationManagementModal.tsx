import React, { useState } from 'react';
import { StationConfig, StationPositionRequirement, DepartmentType } from '../types';
import { 
  Building2, 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Train, 
  Users, 
  Sparkles,
  Layers
} from 'lucide-react';

interface StationManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: StationConfig[];
  selectedStation: StationConfig;
  onSelectStation: (station: StationConfig) => void;
  onAddStation: (newStation: StationConfig, generateStaff?: boolean) => void;
  onUpdateStation: (updatedStation: StationConfig) => void;
  onDeleteStation: (stationId: string) => void;
}

export const StationManagementModal: React.FC<StationManagementModalProps> = ({
  isOpen,
  onClose,
  stations,
  selectedStation,
  onSelectStation,
  onAddStation,
  onUpdateStation,
  onDeleteStation
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingStationId, setEditingStationId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [lineCode, setLineCode] = useState('');
  const [category, setCategory] = useState<'MAJOR_HIGH_TRAFFIC' | 'DISPATCH_CENTER' | 'STANDARD_STATION' | 'SIGNALING_DISTRICT'>('MAJOR_HIGH_TRAFFIC');
  const [stationDepartment, setStationDepartment] = useState<'COMBINED' | 'TRAFFIC' | 'SIGNALING'>('COMBINED');
  const [description, setDescription] = useState('');
  const [autoGenerateStaff, setAutoGenerateStaff] = useState(true);

  // Positions required per shift (Day / Night) - Forgalom
  const [posForemanDay, setPosForemanDay] = useState(1);
  const [posForemanNight, setPosForemanNight] = useState(1);
  const [posDispDay, setPosDispDay] = useState(2);
  const [posDispNight, setPosDispNight] = useState(2);
  const [posExtDay, setPosExtDay] = useState(1);
  const [posExtNight, setPosExtNight] = useState(1);
  const [posSwitchDay, setPosSwitchDay] = useState(2);
  const [posSwitchNight, setPosSwitchNight] = useState(2);

  // Positions required per shift (Day / Night) - Biztosítóberendezés (TEB)
  const [posTechDay, setPosTechDay] = useState(1);
  const [posTechNight, setPosTechNight] = useState(1);
  const [posLocksmithDay, setPosLocksmithDay] = useState(1);
  const [posLocksmithNight, setPosLocksmithNight] = useState(0);
  const [posEngineerDay, setPosEngineerDay] = useState(1);
  const [posEngineerNight, setPosEngineerNight] = useState(0);
  const [posBbDispDay, setPosBbDispDay] = useState(0);
  const [posBbDispNight, setPosBbDispNight] = useState(0);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setLineCode('');
    setCategory('MAJOR_HIGH_TRAFFIC');
    setStationDepartment('COMBINED');
    setDescription('');
    setAutoGenerateStaff(true);
    setPosForemanDay(1);
    setPosForemanNight(1);
    setPosDispDay(2);
    setPosDispNight(2);
    setPosExtDay(1);
    setPosExtNight(1);
    setPosSwitchDay(2);
    setPosSwitchNight(2);
    setPosTechDay(1);
    setPosTechNight(1);
    setPosLocksmithDay(1);
    setPosLocksmithNight(0);
    setPosEngineerDay(1);
    setPosEngineerNight(0);
    setPosBbDispDay(0);
    setPosBbDispNight(0);
    setIsAddingNew(false);
    setEditingStationId(null);
  };

  const handleCreateStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = `st-${Date.now()}`;
    const requiredPositions: StationPositionRequirement[] = [
      { role: 'Főrendelkező', dayShiftCount: posForemanDay, nightShiftCount: posForemanNight, department: 'TRAFFIC' as DepartmentType },
      { role: 'Rendelkező forgalmi szolgálattevő', dayShiftCount: posDispDay, nightShiftCount: posDispNight, department: 'TRAFFIC' as DepartmentType },
      { role: 'Külső forgalmi szolgálattevő', dayShiftCount: posExtDay, nightShiftCount: posExtNight, department: 'TRAFFIC' as DepartmentType },
      { role: 'Váltókezelő', dayShiftCount: posSwitchDay, nightShiftCount: posSwitchNight, department: 'TRAFFIC' as DepartmentType },
      { role: 'Biztosítóberendezési műszerész', dayShiftCount: posTechDay, nightShiftCount: posTechNight, department: 'SIGNALING' as DepartmentType },
      { role: 'Biztosítóberendezési lakatos', dayShiftCount: posLocksmithDay, nightShiftCount: posLocksmithNight, department: 'SIGNALING' as DepartmentType },
      { role: 'Biztosítóberendezési szakaszmérnök', dayShiftCount: posEngineerDay, nightShiftCount: posEngineerNight, department: 'SIGNALING' as DepartmentType },
      { role: 'Biztosítóberendezési diszpécser', dayShiftCount: posBbDispDay, nightShiftCount: posBbDispNight, department: 'SIGNALING' as DepartmentType },
    ].filter(p => p.dayShiftCount > 0 || p.nightShiftCount > 0);

    const newStation: StationConfig = {
      id,
      name: name.trim(),
      lineCode: lineCode.trim() || 'Vasúti fővonal',
      category,
      department: stationDepartment,
      description: description.trim() || 'Vasúti szolgálati hely',
      requiredPositions
    };

    onAddStation(newStation, autoGenerateStaff);
    onSelectStation(newStation);
    resetForm();
  };

  const startEdit = (st: StationConfig) => {
    setEditingStationId(st.id);
    setName(st.name);
    setLineCode(st.lineCode);
    setCategory(st.category);
    setStationDepartment(st.department || 'COMBINED');
    setDescription(st.description || '');

    const pForeman = st.requiredPositions.find(p => p.role.includes('Főrendelkező'));
    setPosForemanDay(pForeman?.dayShiftCount ?? 0);
    setPosForemanNight(pForeman?.nightShiftCount ?? 0);

    const pDisp = st.requiredPositions.find(p => p.role.includes('szolgálattevő') && !p.role.includes('Külső'));
    setPosDispDay(pDisp?.dayShiftCount ?? 0);
    setPosDispNight(pDisp?.nightShiftCount ?? 0);

    const pExt = st.requiredPositions.find(p => p.role.includes('Külső'));
    setPosExtDay(pExt?.dayShiftCount ?? 0);
    setPosExtNight(pExt?.nightShiftCount ?? 0);

    const pSwitch = st.requiredPositions.find(p => p.role.includes('Váltókezelő') || p.role.includes('Tolatásvezető'));
    setPosSwitchDay(pSwitch?.dayShiftCount ?? 0);
    setPosSwitchNight(pSwitch?.nightShiftCount ?? 0);

    const pTech = st.requiredPositions.find(p => p.role.includes('műszerész'));
    setPosTechDay(pTech?.dayShiftCount ?? 0);
    setPosTechNight(pTech?.nightShiftCount ?? 0);

    const pLock = st.requiredPositions.find(p => p.role.includes('lakatos'));
    setPosLocksmithDay(pLock?.dayShiftCount ?? 0);
    setPosLocksmithNight(pLock?.nightShiftCount ?? 0);

    const pEng = st.requiredPositions.find(p => p.role.includes('szakaszmérnök') || p.role.includes('mérnök'));
    setPosEngineerDay(pEng?.dayShiftCount ?? 0);
    setPosEngineerNight(pEng?.nightShiftCount ?? 0);

    const pBbDisp = st.requiredPositions.find(p => p.role.includes('diszpécser') && p.department === 'SIGNALING');
    setPosBbDispDay(pBbDisp?.dayShiftCount ?? 0);
    setPosBbDispNight(pBbDisp?.nightShiftCount ?? 0);

    setIsAddingNew(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStationId || !name.trim()) return;

    const requiredPositions: StationPositionRequirement[] = [
      { role: 'Főrendelkező', dayShiftCount: posForemanDay, nightShiftCount: posForemanNight, department: 'TRAFFIC' as DepartmentType },
      { role: 'Rendelkező forgalmi szolgálattevő', dayShiftCount: posDispDay, nightShiftCount: posDispNight, department: 'TRAFFIC' as DepartmentType },
      { role: 'Külső forgalmi szolgálattevő', dayShiftCount: posExtDay, nightShiftCount: posExtNight, department: 'TRAFFIC' as DepartmentType },
      { role: 'Váltókezelő', dayShiftCount: posSwitchDay, nightShiftCount: posSwitchNight, department: 'TRAFFIC' as DepartmentType },
      { role: 'Biztosítóberendezési műszerész', dayShiftCount: posTechDay, nightShiftCount: posTechNight, department: 'SIGNALING' as DepartmentType },
      { role: 'Biztosítóberendezési lakatos', dayShiftCount: posLocksmithDay, nightShiftCount: posLocksmithNight, department: 'SIGNALING' as DepartmentType },
      { role: 'Biztosítóberendezési szakaszmérnök', dayShiftCount: posEngineerDay, nightShiftCount: posEngineerNight, department: 'SIGNALING' as DepartmentType },
      { role: 'Biztosítóberendezési diszpécser', dayShiftCount: posBbDispDay, nightShiftCount: posBbDispNight, department: 'SIGNALING' as DepartmentType },
    ].filter(p => p.dayShiftCount > 0 || p.nightShiftCount > 0);

    const updated: StationConfig = {
      id: editingStationId,
      name: name.trim(),
      lineCode: lineCode.trim() || 'Vasúti fővonal',
      category,
      department: stationDepartment,
      description: description.trim(),
      requiredPositions
    };

    onUpdateStation(updated);
    if (selectedStation.id === editingStationId) {
      onSelectStation(updated);
    }
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>MÁV Szolgálati Helyek Kezelése</span>
                <span className="text-xs font-mono font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {stations.length} szolgálati hely regisztrálva
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Állomások és forgalomirányítási helyek felvétele, szerkesztése, műszaklétszám igények meghatározása
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAddingNew && (
              <button
                onClick={() => {
                  resetForm();
                  setIsAddingNew(true);
                }}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Új Szolgálati Hely Felvétele</span>
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Add / Edit Form */}
          {isAddingNew && (
            <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Train className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-sm text-white">
                    {editingStationId ? 'Szolgálati hely adatainak módosítása' : 'Új MÁV szolgálati hely rögzítése'}
                  </span>
                </div>
                <button 
                  onClick={resetForm} 
                  className="text-slate-400 hover:text-white text-xs flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Mégse
                </button>
              </div>

              <form onSubmit={editingStationId ? handleUpdate : handleCreateStation} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Szolgálati hely neve <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="pl. Szeged, Kelenföld TEB, Szolnok"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Vasútvonal / körzet
                    </label>
                    <input
                      type="text"
                      placeholder="pl. 140-es vonal, 1-es vonalcsoport"
                      value={lineCode}
                      onChange={(e) => setLineCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Szakterület / Profil
                    </label>
                    <select
                      value={stationDepartment}
                      onChange={(e) => setStationDepartment(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="COMBINED">Vegyes (Forgalom + TEB)</option>
                      <option value="SIGNALING">Biztosítóberendezés (TEB)</option>
                      <option value="TRAFFIC">Forgalmi Szolgálat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Besorolási Kategória (MÁV KSz)
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="MAJOR_HIGH_TRAFFIC">Kiemelt nagyforgalmú állomás (KSz 12/A)</option>
                      <option value="SIGNALING_DISTRICT">BB Szakaszmérnökség / TEB körzet (KSz 8.)</option>
                      <option value="DISPATCH_CENTER">Forgalomirányítás / Diszpécserközpont (12/B-C)</option>
                      <option value="STANDARD_STATION">Általános vasúti szolgálati hely</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Szolgálati hely leírása, biztosítóberendezési és forgalmi technológia
                  </label>
                  <input
                    type="text"
                    placeholder="pl. Folyamatos éjjel-nappali üzemelés, D55 jelfogófüggés, szakaszmérnöki és műszerész készenlét"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Staffing requirements per shift */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Műszakonként előírt kötelező minimális létszámigény (24/7 lefedettség):
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Nappali (N) és Éjszakai (É) szolgálat
                    </span>
                  </div>

                  {/* Section A: Forgalmi munkakörök */}
                  {(stationDepartment === 'COMBINED' || stationDepartment === 'TRAFFIC') && (
                    <div>
                      <span className="text-[11px] font-semibold text-sky-400 block mb-1.5 flex items-center gap-1">
                        <Train className="w-3 h-3" /> Forgalmi Szolgálat Létszámigénye:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="bg-slate-950 border border-slate-800 rounded p-2">
                          <span className="block text-slate-300 font-medium truncate mb-1">Főrendelkező</span>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-400">Nappal:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posForemanDay}
                              onChange={(e) => setPosForemanDay(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                            <label className="text-[10px] text-slate-400">Éjjel:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posForemanNight}
                              onChange={(e) => setPosForemanNight(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded p-2">
                          <span className="block text-slate-300 font-medium truncate mb-1">Rendelkező forgalmi</span>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-400">Nappal:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posDispDay}
                              onChange={(e) => setPosDispDay(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                            <label className="text-[10px] text-slate-400">Éjjel:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posDispNight}
                              onChange={(e) => setPosDispNight(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded p-2">
                          <span className="block text-slate-300 font-medium truncate mb-1">Külsős szolgálattevő</span>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-400">Nappal:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posExtDay}
                              onChange={(e) => setPosExtDay(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                            <label className="text-[10px] text-slate-400">Éjjel:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posExtNight}
                              onChange={(e) => setPosExtNight(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded p-2">
                          <span className="block text-slate-300 font-medium truncate mb-1">Váltókezelő</span>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-400">Nappal:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posSwitchDay}
                              onChange={(e) => setPosSwitchDay(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                            <label className="text-[10px] text-slate-400">Éjjel:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posSwitchNight}
                              onChange={(e) => setPosSwitchNight(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section B: Biztosítóberendezési (TEB) munkakörök */}
                  {(stationDepartment === 'COMBINED' || stationDepartment === 'SIGNALING') && (
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-400 block mb-1.5 flex items-center gap-1">
                        🔧 Biztosítóberendezési (TEB) Munkakörök Létszámigénye:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="bg-slate-950 border border-slate-800 rounded p-2">
                          <span className="block text-slate-300 font-medium truncate mb-1">BB Műszerész</span>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-400">Nappal:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posTechDay}
                              onChange={(e) => setPosTechDay(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                            <label className="text-[10px] text-slate-400">Éjjel:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posTechNight}
                              onChange={(e) => setPosTechNight(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded p-2">
                          <span className="block text-slate-300 font-medium truncate mb-1">BB Lakatos</span>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-400">Nappal:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posLocksmithDay}
                              onChange={(e) => setPosLocksmithDay(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                            <label className="text-[10px] text-slate-400">Éjjel:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posLocksmithNight}
                              onChange={(e) => setPosLocksmithNight(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded p-2">
                          <span className="block text-slate-300 font-medium truncate mb-1">BB Szakaszmérnök</span>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-400">Nappal:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posEngineerDay}
                              onChange={(e) => setPosEngineerDay(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                            <label className="text-[10px] text-slate-400">Éjjel:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posEngineerNight}
                              onChange={(e) => setPosEngineerNight(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded p-2">
                          <span className="block text-slate-300 font-medium truncate mb-1">BB Diszpécser</span>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-400">Nappal:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posBbDispDay}
                              onChange={(e) => setPosBbDispDay(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                            <label className="text-[10px] text-slate-400">Éjjel:</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={posBbDispNight}
                              onChange={(e) => setPosBbDispNight(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-11 bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-center text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {!editingStationId && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="autoStaff"
                      checked={autoGenerateStaff}
                      onChange={(e) => setAutoGenerateStaff(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="autoStaff" className="text-xs text-slate-300 cursor-pointer flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Induló vasúti dolgozói keret automatikus hozzárendelése ehhez az új szolgálati helyhez</span>
                    </label>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                  >
                    Mégse
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow cursor-pointer transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingStationId ? 'Módosítások Mentése' : 'Szolgálati Hely Mentése'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of existing stations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Rendszerben Rögzített Szolgálati Helyek ({stations.length})</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Kattintson az aktívvá tételhez vagy szerkesztéshez
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stations.map((st) => {
                const isSelected = selectedStation.id === st.id;
                return (
                  <div
                    key={st.id}
                    className={`rounded-xl border p-4 transition-all relative ${
                      isSelected 
                        ? 'bg-amber-950/20 border-amber-500/60 shadow-md shadow-amber-950/40' 
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">
                            {st.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded">
                              AKTÍV
                            </span>
                          )}
                          {st.department === 'SIGNALING' && (
                            <span className="text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                              🔧 TEB Szakasz
                            </span>
                          )}
                          {st.department === 'COMBINED' && (
                            <span className="text-[10px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded">
                              🚆+🔧 Vegyes
                            </span>
                          )}
                          {st.department === 'TRAFFIC' && (
                            <span className="text-[10px] font-medium bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded">
                              🚆 Forgalom
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {st.lineCode}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(st)}
                          title="Szerkesztés"
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {stations.length > 1 && (
                          <button
                            onClick={() => {
                              if (confirm(`Biztosan törölni kívánja a(z) ${st.name} szolgálati helyet?`)) {
                                onDeleteStation(st.id);
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

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {st.description || 'Nincs külön leírás rögzítve.'}
                    </p>

                    {/* Positions summary */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                      {st.requiredPositions.map((pos, idx) => {
                        const isSignaling = pos.department === 'SIGNALING' || pos.role.includes('Biztosítóberendezési') || pos.role.includes('TEB');
                        return (
                          <span 
                            key={idx}
                            className={`text-[10px] border px-2 py-0.5 rounded font-mono ${
                              isSignaling 
                                ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300' 
                                : 'bg-sky-950/40 border-sky-700/50 text-sky-300'
                            }`}
                          >
                            {pos.role}: {pos.dayShiftCount}N/{pos.nightShiftCount}É
                          </span>
                        );
                      })}
                    </div>

                    {/* Activate Button */}
                    {!isSelected && (
                      <div className="mt-3 pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            onSelectStation(st);
                            onClose();
                          }}
                          className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Kiválasztás vezényléshez →</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            A kiválasztott szolgálati helyre vonatkozóan fut le a 24/7 létszámfedezet és a szabályossági audit.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Bezárás
          </button>
        </div>

      </div>
    </div>
  );
};
