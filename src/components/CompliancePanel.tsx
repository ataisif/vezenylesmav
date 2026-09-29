import React, { useState } from 'react';
import { ComplianceViolation, MonthSummary, StationConfig } from '../types';
import { MAV_LEGAL_RULES_INFO } from '../data/mavRegulations';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  BookOpen, 
  ArrowRight,
  Filter
} from 'lucide-react';

interface CompliancePanelProps {
  violations: ComplianceViolation[];
  monthSummary: MonthSummary;
  station: StationConfig;
  onSelectViolationDate?: (employeeId: string, date: string) => void;
  onAutoFixAll?: () => void;
}

export const CompliancePanel: React.FC<CompliancePanelProps> = ({
  violations,
  monthSummary,
  station,
  onSelectViolationDate,
  onAutoFixAll
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'ERROR' | 'WARNING' | 'INFO'>('ALL');

  const errors = violations.filter(v => v.severity === 'ERROR');
  const warnings = violations.filter(v => v.severity === 'WARNING');
  const infos = violations.filter(v => v.severity === 'INFO');

  const filteredViolations = violations.filter(v => {
    if (filterSeverity === 'ALL') return true;
    return v.severity === filterSeverity;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg shrink-0 ${
              errors.length > 0 
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' 
                : warnings.length > 0 
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' 
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            }`}>
              {errors.length > 0 ? (
                <ShieldAlert className="w-6 h-6" />
              ) : warnings.length > 0 ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                MÁV Kollektív Szerződés & Mt. Munkaidő Audit
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ellenőrzés a hatályos 2025. augusztus 1-től alkalmazandó és a 2025. augusztus 27-ei megállapodással módosított szabályok szerint.
              </p>
            </div>
          </div>

          {/* Quick Stats Pill Counters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterSeverity('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterSeverity === 'ALL' ? 'bg-slate-800 text-white border border-slate-700' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              Összes ({violations.length})
            </button>
            <button
              onClick={() => setFilterSeverity('ERROR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filterSeverity === 'ERROR' ? 'bg-rose-950/40 text-rose-300 border border-rose-700/60' : 'bg-slate-950 text-slate-400 hover:text-rose-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Törvényszegés ({errors.length})
            </button>
            <button
              onClick={() => setFilterSeverity('WARNING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filterSeverity === 'WARNING' ? 'bg-amber-950/40 text-amber-300 border border-amber-700/60' : 'bg-slate-950 text-slate-400 hover:text-amber-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Figyelmeztetés ({warnings.length})
            </button>
            <button
              onClick={() => setFilterSeverity('INFO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                filterSeverity === 'INFO' ? 'bg-sky-950/40 text-sky-300 border border-sky-700/60' : 'bg-slate-950 text-slate-400 hover:text-sky-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Tájékoztató ({infos.length})
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Active Violations List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200">
              Észrevételek részletezése ({filteredViolations.length})
            </h3>
            {violations.length > 0 && onAutoFixAll && (
              <button
                onClick={onAutoFixAll}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium underline flex items-center gap-1 cursor-pointer"
              >
                Automatikus szabályosítás futtatása
              </button>
            )}
          </div>

          {filteredViolations.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-white">Nincs aktív szabálytalanság</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                A havi vezénylés maradéktalanul megfelel a MÁV Pályaműködtetési Zrt. Kollektív Szerződésének és az Mt. vasúti munkarendi előírásainak.
              </p>
            </div>
          ) : (
            filteredViolations.map((v) => (
              <div 
                key={v.id}
                className={`p-4 rounded-xl border transition-all ${
                  v.severity === 'ERROR'
                    ? 'bg-rose-950/10 border-rose-800/40 hover:border-rose-700/60'
                    : v.severity === 'WARNING'
                    ? 'bg-amber-950/10 border-amber-800/40 hover:border-amber-700/60'
                    : 'bg-sky-950/10 border-sky-800/40 hover:border-sky-700/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        v.severity === 'ERROR'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : v.severity === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                        {v.severity === 'ERROR' ? 'Törvényszegés' : v.severity === 'WARNING' ? 'Figyelmeztetés' : 'Tájékoztató'}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-400">
                        {v.ruleCode}
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs font-medium text-amber-400">
                        {v.legalCitation}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-100">
                      {v.title}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {v.description}
                    </p>

                    {v.suggestedAction && (
                      <div className="mt-2 text-xs text-slate-400 bg-slate-900/60 rounded p-2 border border-slate-800 flex items-start gap-1.5">
                        <span className="font-semibold text-slate-300 shrink-0">Javaslat:</span>
                        <span>{v.suggestedAction}</span>
                      </div>
                    )}
                  </div>

                  {v.employeeId && v.date && onSelectViolationDate && (
                    <button
                      onClick={() => onSelectViolationDate(v.employeeId!, v.date!)}
                      className="shrink-0 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors whitespace-nowrap"
                    >
                      <span>Módosítás</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Key MÁV Rulebook Quick Reference */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Auditált MÁV Szabályok</span>
            </h3>

            <div className="space-y-3 divide-y divide-slate-800/80">
              {MAV_LEGAL_RULES_INFO.map(rule => (
                <div key={rule.code} className="pt-2.5 first:pt-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-200">{rule.name}</span>
                    <span className="text-[10px] font-mono text-amber-400">{rule.citation}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {rule.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
