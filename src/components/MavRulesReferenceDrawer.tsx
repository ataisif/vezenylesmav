import React, { useState } from 'react';
import { BookOpen, X, FileText, CheckCircle2, Search, Scale, Train } from 'lucide-react';

interface MavRulesReferenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MavRulesReferenceDrawer: React.FC<MavRulesReferenceDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const sections = [
    {
      title: '2025. augusztus 27. Megállapodás (Legfrissebb Módosítások)',
      badge: 'Aláírva: 2025.08.27 · Hatályos',
      items: [
        {
          num: 'Megállapodás I. & KSz 24. § 1. c)',
          name: 'Munkaidő-beosztás fogalma és heti pihenőidő',
          text: 'Munkaidő-beosztás: a munkaidőkeret alatt teljesítendő munkaidő („kötelező óra”) felosztása munkanapokra, valamint az egyes munkanapokon a munkakezdési, a munka-befejezési időpontok, valamint a munkavégzés időtartamának meghatározása. A munkaidő-beosztás körébe tartozik az általánostól eltérő munkarendben foglalkoztatottak heti pihenőidejének kijelölése is.'
        },
        {
          num: 'Megállapodás III. & KSz 32. § 3.',
          name: 'Éjszakai szolgálatok maximális száma',
          text: 'A nyújtott műszakos, a többműszakos, illetve a vezényelt munkarendben foglalkoztatott munkavállalók esetében legfeljebb öt (5) egymást követő éjszakai szolgálat rendelhető el, ezt követően pedig kötelezően heti pihenőidőt kell biztosítani.'
        },
        {
          num: 'Megállapodás VIII. & KSz 41. §',
          name: 'Napi pihenőidő lakásra érkezéstől számítva (12 óra)',
          text: 'A 8. számú mellékletben meghatározott zavartalan vasúti közlekedést biztosító munkakörben, megszakítás nélküli (fordulós) munkarendű munkavállaló napi pihenőideje 12 óra, amelyet a lakásra (állandó, vagy ideiglenes tartózkodási helyre) való érkezéstől az onnan való munkába indulásig kell figyelembe venni. Helyi függelék eltérhet, de 8 óránál (Mt. 104. § (3) esetén 7 óránál) kevesebb nem lehet.'
        },
        {
          num: 'Megállapodás IX. & KSz 42. §',
          name: 'Heti pihenőidő és 36 órás vasárnapi szabály',
          text: 'A heti pihenőidőt havonta legalább egyszer úgy kell beosztani, hogy annak időtartama a 36 órát elérje és abba a szombat 19 órától hétfő 05 óráig tartó időszak is beleessen (benne a teljes vasárnapi nappal).'
        },
        {
          num: 'Megállapodás VII. & KSz 39. § 2.',
          name: 'Ügyelet díjazása',
          text: 'A munkanapra elrendelt ügyelet esetében az alapbér 50%-a, a heti pihenőidőre, munkaszüneti napra elrendelt ügyelet esetében az alapbér 65%-a illeti meg a munkavállalót.'
        }
      ]
    },
    {
      title: 'Kollektív Szerződés Egységes Szerkezetben',
      badge: 'MÁV Pályaműködtetési Zrt. KSz',
      items: [
        {
          num: 'KSz 24. § 1. e)',
          name: 'Éjszakai szolgálat definíciója',
          text: 'Éjszakai szolgálatnak minősül, ha a munkavállaló számára elrendelt munkavégzés időtartamából legalább három óra éjszakára (a 22 és 06 óra közötti) időtartamra esik.'
        },
        {
          num: 'KSz 28. § 1. pont',
          name: 'Beosztás közlési határidő (tárgyhó előtti hó 23.)',
          text: 'A tárgyhónapra irányadó munkaidő-beosztást a tárgyhónapot megelőző hónap 23-áig kell írásban közölni a munkavállalóval. Tartalékos munkakörben 1 héttel korábban 1 hétre.'
        },
        {
          num: 'KSz 29. § 1-3. pont',
          name: '120 órás módosítási szabály és 2.500 Ft átvezénylési díj',
          text: 'A munkavállaló előzetesen közölt tárgyhavi munkaidő-beosztását a munkáltató legalább 120 órával korábban módosíthatja. 120 órán belül csak a munkavállaló írásbeli kérelmére, vagy a munkavállalóval kötött írásos megállapodás alapján módosítható. Ez esetben munkavállalót módosított szolgálatonként 2.500 Ft rendkívüli átvezénylési díj illeti meg.'
        },
        {
          num: 'KSz 32. § 2. pont',
          name: 'Fordulós éjszakai szolgálat korlátja (max 2)',
          text: 'A megszakítás nélküli (fordulós) munkarendben foglalkoztatott munkavállalók legfeljebb kettő (2) egymást követő éjszakai szolgálatra oszthatók be.'
        },
        {
          num: 'KSz 35. § 1. pont',
          name: 'Éves rendkívüli munkaidő (túlóra) plafon',
          text: 'Naptári évente legfeljebb 300 óra rendkívüli munkaidő rendelhető el, amelybe valamennyi rendkívüli munkaidő tartama beszámít.'
        },
        {
          num: 'KSz 36. § 1. pont',
          name: 'Rendkívüli munkavégzés sávos bérpótléka',
          text: '20 óráig: 50% pótlék; 21–150 óráig: 75% pótlék; 151–200 óráig: 100% pótlék; 201–230 óráig: 135% pótlék; 231–300 óráig: 215% pótlék.'
        },
        {
          num: 'KSz 43. §',
          name: 'Szabadságok, véradói és 60. évi pótszabadság',
          text: 'A szabadságokat órában kell megállapítani, kiadni és elszámolni (8h/nap). Munkáltató legalább 7 nappal korábban közli. Dolgozó a 7 munkanap rendelkezési szabadságát 7 nappal korábban köteles bejelenteni. A 60. életévét betöltött munkavállalót +1 nap pótszabadság illeti meg. Évi 3x igazolt véradás (nő) vagy 4x (férfi) után a következő évben +2 nap pótszabadság illeti meg. Főrendelkező, tartalékos térfőnök részére évi 2 nap rendkívüli szabadság jár.'
        },
        {
          num: 'KSz 45. § 4. pont',
          name: 'Munkaszüneti nap 120% bérpótlék',
          text: '120% bérpótlék illeti meg az Mt. 102. § munkaszüneti napjain (0-24h), Húsvétvasárnap (0-24h), Pünkösdvasárnap (0-24h), december 24-én 18-24h és december 31-én 18-24h között teljesített munkaidőre.'
        },
        {
          num: 'KSz 47. § 1-2. pont',
          name: 'Műszakpótlék (20%, 30%, 40%)',
          text: 'Többműszakos: délutáni műszak (14-22) törzsbér 20%-a, éjszakai műszak (22-06) törzsbér 40%-a. Megszakítás nélküli (fordulós): törzsbér 30%-a, de a 12/A. sz. melléklet szerinti nagy forgalmi leterheltségű állomásokon (pl. Kelenföld, Keleti, Nyugati, Debrecen, Szolnok) 40% mértékű műszakpótlék illeti meg.'
        }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              <span>MÁV Pályaműködtetési Zrt. Szabályozási Tár</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hivatalos Kollektív Szerződés és a 2025. augusztus 27-én aláírt módosítások szövege
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Keresés a MÁV szabályzatban (pl. 41. §, pihenőidő, 120 óra, éjszaka, szabadság)..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {sections.map((sec, idx) => {
            const matchingItems = sec.items.filter(
              item => item.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
                      item.num.toLowerCase().includes(filterQuery.toLowerCase()) ||
                      item.text.toLowerCase().includes(filterQuery.toLowerCase())
            );

            if (matchingItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <h4 className="font-bold text-slate-200 text-sm">{sec.title}</h4>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    {sec.badge}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {matchingItems.map((item, itemIdx) => (
                    <div key={itemIdx} className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-100">{item.name}</span>
                        <span className="font-mono text-amber-400 text-[11px]">{item.num}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed font-sans">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
          >
            Bezárás
          </button>
        </div>

      </div>
    </div>
  );
};
