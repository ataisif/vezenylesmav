import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  Train, 
  Lightbulb, 
  Scale, 
  Flame, 
  ArrowLeftRight,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { 
  USER_GUIDE_DATA, 
  downloadUserGuideDOCX 
} from '../utils/userGuideGenerator';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeSectionId, setActiveSectionId] = useState<string>(USER_GUIDE_DATA.sections[0].id);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadDOCX = async () => {
    try {
      setIsDownloading(true);
      await downloadUserGuideDOCX();
      setDownloadSuccess('A Word (.docx) felhasználói útmutató sikeresen letöltve!');
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error('Hiba a DOCX letöltésekor:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const activeSection = USER_GUIDE_DATA.sections.find(s => s.id === activeSectionId) || USER_GUIDE_DATA.sections[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  MÁV Vezényléstervező Felhasználói Útmutató
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  v{USER_GUIDE_DATA.version}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rendszerkezelési kézikönyv forgalmi és TEB biztosítóberendezési szakszolgálatok számára
              </p>
            </div>
          </div>

          {/* Action Button: DOCX Download */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDOCX}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Letöltés szerkeszthető Word (.docx) formátumban"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Letöltés Word (.docx)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {downloadSuccess && (
          <div className="px-6 py-2 bg-emerald-950/70 border-b border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Main Body: 2 Columns (Sidebar Navigation + Section Viewer) */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Sidebar: Chapters */}
          <div className="w-72 bg-slate-950/60 border-r border-slate-800 p-3 overflow-y-auto space-y-1">
            <div className="text-[10px] uppercase font-mono text-slate-400 px-3 py-1.5 font-bold">
              Fejezetek & Témakörök
            </div>

            {USER_GUIDE_DATA.sections.map((section, idx) => {
              const isSelected = section.id === activeSectionId;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <span className="truncate">{section.title}</span>
                  {isSelected && <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>
              );
            })}

            {/* Quick Download Card at bottom of sidebar */}
            <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-white block">
                Offline használatra
              </span>
              <p className="text-[10px] text-slate-400 leading-normal">
                Töltse le a kézikönyvet PDF vagy szerkeszthető Word (DOCX) formátumban a nyomtatáshoz vagy irattározáshoz.
              </p>
              <div className="pt-1">
                <button
                  onClick={handleDownloadDOCX}
                  className="w-full text-center py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Word (.docx) Letöltése</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Main Viewer: Content */}
          <div className="flex-1 p-8 overflow-y-auto bg-slate-900/50 space-y-6">
            <div>
              <div className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">
                MÁV Felhasználói Útmutató · Fejezet
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {activeSection.title}
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 italic">
                {activeSection.summary}
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Lépésről-lépésre útmutató:</span>
              </h4>

              <div className="space-y-2.5">
                {activeSection.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center justify-center shrink-0 border border-amber-500/40">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed pt-0.5">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips & Recommendations */}
            {activeSection.tips && activeSection.tips.length > 0 && (
              <div className="bg-sky-950/20 border border-sky-800/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                  <Lightbulb className="w-4 h-4" />
                  <span>Hasznos tanácsok és vezénylői tippek:</span>
                </div>
                <div className="space-y-1.5 pl-2 text-xs text-sky-200">
                  {activeSection.tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-sky-400">•</span>
                      <span className="leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legal References */}
            {activeSection.legalReference && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Scale className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Vonatkozó MÁV KSz szabályzat:</span>
                  <span className="font-mono text-amber-300 font-bold">{activeSection.legalReference}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  MÁV Zrt. Munkaügyi Kézikönyv
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Train className="w-4 h-4 text-amber-400" />
            <span>MÁV Pályaműködtetés — Szolgálati Vezényléstervező Rendszer</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadDOCX}
              className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              Word letöltése (.docx)
            </button>
            <span>·</span>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer"
            >
              Bezárás
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
