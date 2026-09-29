import { ShiftType, StationConfig } from '../types';

export const MAV_SHIFT_TYPES: ShiftType[] = [
  // --- Forgalmi és Általános Műszaktípusok ---
  {
    id: 'N12',
    code: 'N12',
    name: 'Nappali Szolgálat (12h)',
    category: 'WORK',
    defaultStartTime: '06:00',
    defaultEndTime: '18:00',
    durationHours: 12,
    isNightShift: false,
    isDayShift: true,
    color: '#0284c7', // Sky 600
    textColor: '#ffffff',
    badgeBg: 'bg-sky-600',
    description: 'Négybrigádos vagy 12/24 fordulós nappali 12 órás vasútüzemi szolgálat (06:00-18:00).',
    applicablePatterns: ['CONTINUOUS_4_SHIFT', 'CONTINUOUS_12_24', 'EXTENDED_SHIFT', 'DISPATCHED'],
    targetDepartment: 'ALL'
  },
  {
    id: 'E12',
    code: 'É12',
    name: 'Éjszakai Szolgálat (12h)',
    category: 'WORK',
    defaultStartTime: '18:00',
    defaultEndTime: '06:00',
    durationHours: 12,
    isNightShift: true, // 18:00-06:00 között 8 óra esik 22-06 közé (min 3h -> KSz 24.§ 1.e)
    isDayShift: false,
    color: '#4338ca', // Indigo 700
    textColor: '#ffffff',
    badgeBg: 'bg-indigo-700',
    description: 'Fordulós éjszakai 12 órás szolgálat (18:00-06:00). KSz 32.§ 2.: legfeljebb 2 egymást követő!',
    applicablePatterns: ['CONTINUOUS_4_SHIFT', 'CONTINUOUS_12_24', 'DISPATCHED'],
    targetDepartment: 'ALL'
  },
  {
    id: 'DE8',
    code: 'DE8',
    name: 'Délelőtti Műszak (8h)',
    category: 'WORK',
    defaultStartTime: '06:00',
    defaultEndTime: '14:00',
    durationHours: 8,
    isNightShift: false,
    isDayShift: true,
    color: '#0d9488', // Teal 600
    textColor: '#ffffff',
    badgeBg: 'bg-teal-600',
    description: 'Többműszakos vagy vezényelt délelőtti műszak (06:00-14:00).',
    applicablePatterns: ['THREE_SHIFT', 'TWO_SHIFT', 'DISPATCHED', 'STANDARD'],
    targetDepartment: 'ALL'
  },
  {
    id: 'DU8',
    code: 'DU8',
    name: 'Délutáni Műszak (8h)',
    category: 'WORK',
    defaultStartTime: '14:00',
    defaultEndTime: '22:00',
    durationHours: 8,
    isNightShift: false,
    isDayShift: true,
    color: '#d97706', // Amber 600
    textColor: '#ffffff',
    badgeBg: 'bg-amber-600',
    description: 'Délutáni műszak (14:00-22:00).',
    applicablePatterns: ['THREE_SHIFT', 'TWO_SHIFT', 'DISPATCHED'],
    targetDepartment: 'ALL'
  },
  {
    id: 'EJ8',
    code: 'ÉJ8',
    name: 'Éjszakai Műszak (8h)',
    category: 'WORK',
    defaultStartTime: '22:00',
    defaultEndTime: '06:00',
    durationHours: 8,
    isNightShift: true,
    isDayShift: false,
    color: '#6d28d9', // Purple 700
    textColor: '#ffffff',
    badgeBg: 'bg-purple-700',
    description: 'Háromműszakos éjszakai műszak (22:00-06:00). KSz 32.§ 3.: max 5 egymást követő.',
    applicablePatterns: ['THREE_SHIFT', 'DISPATCHED'],
    targetDepartment: 'ALL'
  },
  {
    id: 'NY12',
    code: 'NY12',
    name: 'Nyújtott Műszak (12h)',
    category: 'WORK',
    defaultStartTime: '07:00',
    defaultEndTime: '19:00',
    durationHours: 12,
    isNightShift: false,
    isDayShift: true,
    color: '#2563eb', // Blue 600
    textColor: '#ffffff',
    badgeBg: 'bg-blue-600',
    description: 'Nyújtott műszakos munkarend (KSz 24.§ 1.h).',
    applicablePatterns: ['EXTENDED_SHIFT', 'DISPATCHED'],
    targetDepartment: 'ALL'
  },

  // --- Biztosítóberendezési (TEB) Specifikus Műszakok ---
  {
    id: 'BB_KARB',
    code: 'BB-K',
    name: 'BB Karbantartás (8h)',
    category: 'WORK',
    defaultStartTime: '07:00',
    defaultEndTime: '15:20',
    durationHours: 8,
    isNightShift: false,
    isDayShift: true,
    color: '#059669', // Emerald 600
    textColor: '#ffffff',
    badgeBg: 'bg-emerald-600',
    description: 'Biztosítóberendezési (műszerész/lakatos) tervszerű megelőző karbantartás (váltók, fényjelzők, jelfogók, vágányáramkörök).',
    applicablePatterns: ['STANDARD', 'DISPATCHED'],
    targetDepartment: 'SIGNALING'
  },
  {
    id: 'BB_ZAVAR_N',
    code: 'BB-HN',
    name: 'BB Hibaelhárítás Nappal (12h)',
    category: 'WORK',
    defaultStartTime: '06:00',
    defaultEndTime: '18:00',
    durationHours: 12,
    isNightShift: false,
    isDayShift: true,
    color: '#0891b2', // Cyan 600
    textColor: '#ffffff',
    badgeBg: 'bg-cyan-600',
    description: 'Biztosítóberendezési operatív vonali hibaelhárító és helyszínelő szolgálat (KSz 8. sz. melléklet).',
    applicablePatterns: ['DISPATCHED', 'CONTINUOUS_4_SHIFT', 'CONTINUOUS_12_24'],
    targetDepartment: 'SIGNALING'
  },
  {
    id: 'BB_ZAVAR_E',
    code: 'BB-HÉ',
    name: 'BB Hibaelhárítás Éjjel (12h)',
    category: 'WORK',
    defaultStartTime: '18:00',
    defaultEndTime: '06:00',
    durationHours: 12,
    isNightShift: true,
    isDayShift: false,
    color: '#4f46e5', // Indigo 600
    textColor: '#ffffff',
    badgeBg: 'bg-indigo-600',
    description: 'Biztosítóberendezési éjszakai zavarelhárító szolgálat a forgalom zavartalan fenntartásához.',
    applicablePatterns: ['DISPATCHED', 'CONTINUOUS_4_SHIFT', 'CONTINUOUS_12_24'],
    targetDepartment: 'SIGNALING'
  },
  {
    id: 'BB_DISZP_N',
    code: 'BBD-N',
    name: 'BB Diszpécser Nappal (12h)',
    category: 'WORK',
    defaultStartTime: '06:00',
    defaultEndTime: '18:00',
    durationHours: 12,
    isNightShift: false,
    isDayShift: true,
    color: '#7c3aed', // Violet 600
    textColor: '#ffffff',
    badgeBg: 'bg-violet-600',
    description: 'Biztosítóberendezési hálózati diszpécseri felügyelet (KSz 12/C. sz. melléklet).',
    applicablePatterns: ['CONTINUOUS_4_SHIFT', 'CONTINUOUS_12_24'],
    targetDepartment: 'SIGNALING'
  },
  {
    id: 'BB_DISZP_E',
    code: 'BBD-É',
    name: 'BB Diszpécser Éjjel (12h)',
    category: 'WORK',
    defaultStartTime: '18:00',
    defaultEndTime: '06:00',
    durationHours: 12,
    isNightShift: true,
    isDayShift: false,
    color: '#581c87', // Purple 900
    textColor: '#ffffff',
    badgeBg: 'bg-purple-900',
    description: 'Biztosítóberendezési hálózati éjszakai diszpécseri szolgálat (KSz 12/C. melléklet).',
    applicablePatterns: ['CONTINUOUS_4_SHIFT', 'CONTINUOUS_12_24'],
    targetDepartment: 'SIGNALING'
  },
  {
    id: 'KESZ',
    code: 'KÉSZ',
    name: 'Készenlét (Otthoni hibaelhárítás)',
    category: 'STANDBY',
    defaultStartTime: '15:20',
    defaultEndTime: '07:00',
    durationHours: 0, // Készenlét alatt nem rendes munkaidő (KSz 37.§), évi max 800h
    isNightShift: false,
    isDayShift: false,
    color: '#f59e0b', // Amber 500
    textColor: '#0f172a',
    badgeBg: 'bg-amber-500',
    description: 'Lakóhelyen töltött készenlét azonnali biztosítóberendezési zavarelhárításra (KSz 37.§). Évente max 800 óra.',
    applicablePatterns: ['DISPATCHED', 'STANDARD'],
    targetDepartment: 'SIGNALING'
  },
  {
    id: 'UGY',
    code: 'ÜGY',
    name: 'Szolgálati Ügyelet',
    category: 'DUTY',
    defaultStartTime: '08:00',
    defaultEndTime: '20:00',
    durationHours: 12,
    isNightShift: false,
    isDayShift: true,
    color: '#ea580c', // Orange 600
    textColor: '#ffffff',
    badgeBg: 'bg-orange-600',
    description: 'Munkáltató által kijelölt helyen rendelkezésre állás (KSz 39.§).',
    applicablePatterns: ['DISPATCHED', 'STANDARD'],
    targetDepartment: 'ALL'
  },
  {
    id: 'BB_ADMIN',
    code: 'ADM',
    name: 'BB Szakasz Adminisztráció (8h)',
    category: 'WORK',
    defaultStartTime: '07:30',
    defaultEndTime: '15:50',
    durationHours: 8,
    isNightShift: false,
    isDayShift: true,
    color: '#0284c7', // Sky 600
    textColor: '#ffffff',
    badgeBg: 'bg-sky-600',
    description: 'Biztosítóberendezési szakaszadminisztráció, forgalmi és műszaki nyilvántartási feladatok általános munkarendben (H-P).',
    applicablePatterns: ['STANDARD'],
    targetDepartment: 'SIGNALING'
  },

  // --- Szabadságok és Távollétek ---
  {
    id: 'SZAB',
    code: 'SZAB',
    name: 'Rendes Szabadság',
    category: 'LEAVE',
    defaultStartTime: '08:00',
    defaultEndTime: '16:00',
    durationHours: 8,
    isNightShift: false,
    isDayShift: true,
    color: '#16a34a', // Green 600
    textColor: '#ffffff',
    badgeBg: 'bg-green-600',
    description: 'Éves rendes fizetett szabadság (Mt. 115-125.§, KSz 43.§: órában elszámolva, napi 8h).',
    applicablePatterns: ['CONTINUOUS_4_SHIFT', 'CONTINUOUS_12_24', 'THREE_SHIFT', 'TWO_SHIFT', 'EXTENDED_SHIFT', 'DISPATCHED', 'STANDARD'],
    targetDepartment: 'ALL'
  },
  {
    id: 'VER',
    code: 'VÉR',
    name: 'Véradói Pótszabadság',
    category: 'LEAVE',
    defaultStartTime: '08:00',
    defaultEndTime: '16:00',
    durationHours: 8,
    isNightShift: false,
    isDayShift: true,
    color: '#dc2626', // Red 600
    textColor: '#ffffff',
    badgeBg: 'bg-red-600',
    description: 'Véradásért járó pótszabadság: nők 3x / férfiak 4x véradása esetén +2 munkanap (KSz 43.§ 3.).',
    applicablePatterns: ['CONTINUOUS_4_SHIFT', 'CONTINUOUS_12_24', 'THREE_SHIFT', 'TWO_SHIFT', 'EXTENDED_SHIFT', 'DISPATCHED', 'STANDARD'],
    targetDepartment: 'ALL'
  },
  {
    id: 'KSZ_SZAB',
    code: 'RSZ',
    name: 'Rendkívüli Szabadság (MÁV)',
    category: 'LEAVE',
    defaultStartTime: '08:00',
    defaultEndTime: '16:00',
    durationHours: 8,
    isNightShift: false,
    isDayShift: true,
    color: '#059669', // Emerald 600
    textColor: '#ffffff',
    badgeBg: 'bg-emerald-600',
    description: 'Főrendelkező, tartalékos térfőnök munkakör esetén évi 2 nap rendkívüli szabadság (KSz 43.§ 4.).',
    applicablePatterns: ['CONTINUOUS_4_SHIFT', 'CONTINUOUS_12_24', 'DISPATCHED'],
    targetDepartment: 'TRAFFIC'
  },
  {
    id: 'BETEG',
    code: 'BET',
    name: 'Betegszabadság / Keresőképtelenség',
    category: 'LEAVE',
    defaultStartTime: '08:00',
    defaultEndTime: '16:00',
    durationHours: 8,
    isNightShift: false,
    isDayShift: true,
    color: '#e11d48', // Rose 600
    textColor: '#ffffff',
    badgeBg: 'bg-rose-600',
    description: 'Orvosilag igazolt keresőképtelenség (Mt. 126.§).',
    applicablePatterns: ['CONTINUOUS_4_SHIFT', 'CONTINUOUS_12_24', 'THREE_SHIFT', 'TWO_SHIFT', 'EXTENDED_SHIFT', 'DISPATCHED', 'STANDARD'],
    targetDepartment: 'ALL'
  },
  {
    id: 'ORV',
    code: 'ORV',
    name: 'Időszakos Orvosi Vizsgálat',
    category: 'MEDICAL',
    defaultStartTime: '08:00',
    defaultEndTime: '16:00',
    durationHours: 8,
    isNightShift: false,
    isDayShift: true,
    color: '#0891b2', // Cyan 600
    textColor: '#ffffff',
    badgeBg: 'bg-cyan-600',
    description: 'Vasútegészségügyi alkalmassági vizsgálat (KSz 34.§ 3. pont: beosztás részeként előre vezényelendő).',
    applicablePatterns: ['CONTINUOUS_4_SHIFT', 'CONTINUOUS_12_24', 'THREE_SHIFT', 'TWO_SHIFT', 'EXTENDED_SHIFT', 'DISPATCHED', 'STANDARD'],
    targetDepartment: 'ALL'
  },
  {
    id: 'OKT',
    code: 'OKT',
    name: 'Kötelező Oktatás / Vizsga',
    category: 'EDUCATION',
    defaultStartTime: '08:00',
    defaultEndTime: '16:00',
    durationHours: 8,
    isNightShift: false,
    isDayShift: true,
    color: '#7c3aed', // Violet 600
    textColor: '#ffffff',
    badgeBg: 'bg-violet-600',
    description: 'Munkaidőbe beszámító kötelező oktatás, BGOK tanfolyam (KSz 34.§ 1.).',
    applicablePatterns: ['CONTINUOUS_4_SHIFT', 'CONTINUOUS_12_24', 'THREE_SHIFT', 'TWO_SHIFT', 'EXTENDED_SHIFT', 'DISPATCHED', 'STANDARD'],
    targetDepartment: 'ALL'
  },
  {
    id: 'PIH',
    code: 'P',
    name: 'Heti Pihenőidő',
    category: 'REST',
    defaultStartTime: '00:00',
    defaultEndTime: '00:00',
    durationHours: 0,
    isNightShift: false,
    isDayShift: false,
    color: '#059669', // Emerald Green 600 (Zöld)
    textColor: '#ffffff',
    badgeBg: 'bg-emerald-600',
    description: 'Előre közölt heti pihenőidő vagy szolgálatközi pihenő (KSz 41.§, 42.§).',
    applicablePatterns: ['CONTINUOUS_4_SHIFT', 'CONTINUOUS_12_24', 'THREE_SHIFT', 'TWO_SHIFT', 'EXTENDED_SHIFT', 'DISPATCHED', 'STANDARD'],
    targetDepartment: 'ALL'
  }
];

export const MAV_STATIONS: StationConfig[] = [
  {
    id: 'st-kelenfold',
    name: 'Budapest-Kelenföld',
    category: 'MAJOR_HIGH_TRAFFIC', // 12/A melléklet szerinti kiemelt állomás
    lineCode: '1-es vasútvonal',
    department: 'COMBINED',
    description: 'Kiemelt nagyforgalmi csomóponti személypályaudvar (KSz 12/A és 10. sz. melléklet)',
    requiredPositions: [
      { role: 'Főrendelkező', dayShiftCount: 1, nightShiftCount: 1, department: 'TRAFFIC' },
      { role: 'Rendelkező forgalmi szolgálattevő', dayShiftCount: 2, nightShiftCount: 2, department: 'TRAFFIC' },
      { role: 'Külső forgalmi szolgálattevő', dayShiftCount: 1, nightShiftCount: 1, department: 'TRAFFIC' },
      { role: 'Váltókezelő', dayShiftCount: 2, nightShiftCount: 2, department: 'TRAFFIC' },
      { role: 'Biztosítóberendezési műszerész', dayShiftCount: 1, nightShiftCount: 1, department: 'SIGNALING' },
      { role: 'Biztosítóberendezési lakatos', dayShiftCount: 1, nightShiftCount: 0, department: 'SIGNALING' },
      { role: 'Biztosítóberendezési adminisztrátor', dayShiftCount: 1, nightShiftCount: 0, department: 'SIGNALING' }
    ]
  },
  {
    id: 'st-kelenfold-teb',
    name: 'Budapest-Kelenföld TEB Szakaszmérnökség',
    category: 'SIGNALING_DISTRICT',
    lineCode: '1-es / 30a / 40a vonalcsoport',
    department: 'SIGNALING',
    description: 'Biztosítóberendezési fenntartási és üzemzavar-elhárítási szakasz (KSz 8. sz. melléklet)',
    requiredPositions: [
      { role: 'Biztosítóberendezési szakaszmérnök', dayShiftCount: 1, nightShiftCount: 0, department: 'SIGNALING' },
      { role: 'Biztosítóberendezési műszerész', dayShiftCount: 2, nightShiftCount: 1, department: 'SIGNALING' },
      { role: 'Biztosítóberendezési lakatos', dayShiftCount: 2, nightShiftCount: 1, department: 'SIGNALING' },
      { role: 'Biztosítóberendezési technikus', dayShiftCount: 1, nightShiftCount: 0, department: 'SIGNALING' },
      { role: 'Biztosítóberendezési adminisztrátor', dayShiftCount: 1, nightShiftCount: 0, department: 'SIGNALING' }
    ]
  },
  {
    id: 'st-nyugat-bb-diszp',
    name: 'Budapest-Nyugat Biztosítóberendezési Főnökség (KSz 12/C)',
    category: 'DISPATCH_CENTER',
    lineCode: 'Hálózati központ (Budapest-Nyugat)',
    department: 'SIGNALING',
    description: 'Biztosítóberendezési diszpécseri és üzemirányítási központ (KSz 12/C. sz. melléklet)',
    requiredPositions: [
      { role: 'Biztosítóberendezési diszpécser', dayShiftCount: 2, nightShiftCount: 2, department: 'SIGNALING' },
      { role: 'Biztosítóberendezési mérnök', dayShiftCount: 1, nightShiftCount: 0, department: 'SIGNALING' }
    ]
  },
  {
    id: 'st-ferencvaros',
    name: 'Ferencváros',
    category: 'MAJOR_HIGH_TRAFFIC', // 12/A melléklet
    lineCode: '1-es / 150-es vonal',
    department: 'COMBINED',
    description: 'Országos központi rendező- és teherpályaudvar (KSz 12/A. melléklet)',
    requiredPositions: [
      { role: 'Főrendelkező', dayShiftCount: 1, nightShiftCount: 1, department: 'TRAFFIC' },
      { role: 'Forgalmi szolgálattevő (táblakezelő)', dayShiftCount: 2, nightShiftCount: 2, department: 'TRAFFIC' },
      { role: 'Tolatásvezető', dayShiftCount: 2, nightShiftCount: 2, department: 'TRAFFIC' },
      { role: 'Kocsimester', dayShiftCount: 1, nightShiftCount: 1, department: 'TRAFFIC' },
      { role: 'Biztosítóberendezési műszerész', dayShiftCount: 1, nightShiftCount: 1, department: 'SIGNALING' }
    ]
  },
  {
    id: 'st-keleti',
    name: 'Budapest-Keleti',
    category: 'MAJOR_HIGH_TRAFFIC', // 12/A melléklet
    lineCode: '1-es / 80-as vonal',
    department: 'COMBINED',
    description: 'Kiemelt fejpályaudvar nagy nemzetközi és belföldi forgalommal (KSz 12/A. melléklet)',
    requiredPositions: [
      { role: 'Főrendelkező', dayShiftCount: 1, nightShiftCount: 1, department: 'TRAFFIC' },
      { role: 'Rendelkező forgalmi szolgálattevő', dayShiftCount: 2, nightShiftCount: 2, department: 'TRAFFIC' },
      { role: 'Tolatásvezető II.', dayShiftCount: 1, nightShiftCount: 1, department: 'TRAFFIC' },
      { role: 'Kocsimester', dayShiftCount: 1, nightShiftCount: 1, department: 'TRAFFIC' }
    ]
  },
  {
    id: 'st-szolnok',
    name: 'Szolnok',
    category: 'MAJOR_HIGH_TRAFFIC', // 12/A melléklet
    lineCode: '100-as / 120-as vonal',
    department: 'TRAFFIC',
    description: 'Alföldi központi vasúti csomópont és rendező pályaudvar (KSz 12/A. melléklet)',
    requiredPositions: [
      { role: 'Főrendelkező', dayShiftCount: 1, nightShiftCount: 1, department: 'TRAFFIC' },
      { role: 'Forgalmi szolgálattevő (táblakezelő)', dayShiftCount: 1, nightShiftCount: 1, department: 'TRAFFIC' },
      { role: 'Külső forgalmi szolgálattevő', dayShiftCount: 1, nightShiftCount: 1, department: 'TRAFFIC' }
    ]
  },
  {
    id: 'st-gyor',
    name: 'Győr',
    category: 'MAJOR_HIGH_TRAFFIC', // 12/A melléklet
    lineCode: '1-es vasútvonal',
    department: 'TRAFFIC',
    description: 'Nyugat-dunántúli fővonali állomás (KSz 12/A. melléklet)',
    requiredPositions: [
      { role: 'Főrendelkező', dayShiftCount: 1, nightShiftCount: 1, department: 'TRAFFIC' },
      { role: 'Forgalmi szolgálattevő (táblakezelő)', dayShiftCount: 1, nightShiftCount: 1, department: 'TRAFFIC' },
      { role: 'Külső forgalmi szolgálattevő', dayShiftCount: 1, nightShiftCount: 1, department: 'TRAFFIC' }
    ]
  }
];

// Magyar nemzeti ünnepek és munkaszüneti napok 2025 és 2026-ban
export const HUNGARIAN_HOLIDAYS_MAP: Record<string, string> = {
  // 2025
  '2025-01-01': 'Újév',
  '2025-03-15': 'Nemzeti ünnep (1848)',
  '2025-04-18': 'Nagypéntek',
  '2025-04-21': 'Húsvéthétfő',
  '2025-05-01': 'A Munka ünnepe',
  '2025-06-09': 'Pünkösdhétfő',
  '2025-08-20': 'Államalapítás ünnepe',
  '2025-10-23': 'Nemzeti ünnep (1956)',
  '2025-11-01': 'Mindenszentek',
  '2025-12-25': 'Karácsony első napja',
  '2025-12-26': 'Karácsony másnapja',

  // 2026
  '2026-01-01': 'Újév',
  '2026-03-15': 'Nemzeti ünnep (1848)',
  '2026-04-03': 'Nagypéntek',
  '2026-04-06': 'Húsvéthétfő',
  '2026-05-01': 'A Munka ünnepe',
  '2026-05-25': 'Pünkösdhétfő',
  '2026-08-20': 'Államalapítás ünnepe',
  '2026-10-23': 'Nemzeti ünnep (1956)',
  '2026-11-01': 'Mindenszentek',
  '2026-12-25': 'Karácsony első napja',
  '2026-12-26': 'Karácsony másnapja',
};

// Vasárnapi ünnepek (KSz 45. § 4.)
export const SPECIAL_PREMIUM_DATES: Record<string, string> = {
  '2025-04-20': 'Húsvétvasárnap',
  '2025-06-08': 'Pünkösdvasárnap',
  '2026-04-05': 'Húsvétvasárnap',
  '2026-05-24': 'Pünkösdvasárnap',
};

export const MAV_LEGAL_RULES_INFO = [
  {
    code: 'KSZ-32-2',
    name: 'Éjszakai szolgálat korlátja (Fordulós)',
    citation: 'MÁV KSz 32. § 2. pont',
    summary: 'A megszakítás nélküli (fordulós) munkarendben foglalkoztatott munkavállalók legfeljebb KETTŐ (2) egymást követő éjszakai szolgálatra oszthatók be.',
    ruleLevel: 'ERROR',
    category: 'Műszakbeosztás'
  },
  {
    code: 'KSZ-32-3',
    name: 'Éjszakai szolgálat korlátja (Többműszakos / Nyújtott / Vezényelt)',
    citation: 'MÁV KSz 32. § 3. pont & 2025. aug. 27. Megállapodás III.',
    summary: 'A nyújtott műszakos, többműszakos, illetve vezényelt munkarendben foglalkoztatott munkavállalók esetében legfeljebb ÖT (5) egymást követő éjszakai szolgálat rendelhető el, ezt követően kötelezően heti pihenőidőt kell biztosítani.',
    ruleLevel: 'ERROR',
    category: 'Műszakbeosztás'
  },
  {
    code: 'KSZ-8-MELL',
    name: 'Biztosítóberendezési (TEB) munkakörök jogállása',
    citation: 'MÁV KSz 8. sz. melléklet & 24. § 1. g) pont',
    summary: 'A zavartalan vasúti közlekedést biztosító munkakörök (biztosítóberendezési lakatos, műszerész, technikus, vonalellenőr, diszpécser) a KSz 24. § 1. g) pontja alapján vezényelt munkarendben vagy megszakítás nélküli munkarendben is foglalkoztathatók.',
    ruleLevel: 'INFO',
    category: 'Biztosítóberendezés'
  },
  {
    code: 'KSZ-12C-DISZP',
    name: 'Biztosítóberendezési diszpécseri szolgálat',
    citation: 'MÁV KSz 12/C. sz. melléklet & 47. § 2. c) pont',
    summary: 'A biztosítóberendezési diszpécser munkakörben foglalkoztatott munkavállalók a forgalomirányítás zavartalan lebonyolítását felügyelik 24/7 folyamatos szolgálatban.',
    ruleLevel: 'INFO',
    category: 'Biztosítóberendezés'
  },
  {
    code: 'KSZ-37-KESZ',
    name: 'Készenléti szabályok biztosítóberendezési hibaelhárításra',
    citation: 'MÁV KSz 37. § 1-4. pont & 38. §',
    summary: 'Zavarelhárításra elrendelt készenlét naptári évenként max 800 óra lehet. Riasztás esetén a kivonulás kezdetétől a befejezésig rendkívüli munkaidőként kerül elszámolásra.',
    ruleLevel: 'WARNING',
    category: 'Biztosítóberendezés'
  },
  {
    code: 'KSZ-41-1',
    name: 'Napi pihenőidő lakásra érkezéstől számítva (12 óra)',
    citation: 'MÁV KSz 41. § 1-2. pont & 2025. aug. 27. Megállapodás VIII.',
    summary: 'A zavartalan vasúti közlekedést biztosító fordulós munkakörökben a napi pihenőidő 12 óra, amelyet a lakásra (állandó/tartózkodási helyre) való érkezéstől a munkába indulásig kell figyelembe venni (utazási idő!). Minimális törvényi határ: 8 óra.',
    ruleLevel: 'ERROR',
    category: 'Pihenőidő'
  },
  {
    code: 'KSZ-42-3',
    name: 'Havi kötelező 36 órás vasárnapi pihenőidő',
    citation: 'MÁV KSz 42. § 3. pont & 2025. aug. 27. Megállapodás IX.',
    summary: 'A heti pihenőidőt havonta legalább egyszer úgy kell beosztani, hogy időtartama elérje a 36 órát, és abba a szombat 19:00 - hétfő 05:00 közötti időszak (és a teljes vasárnapi nap) beleessen.',
    ruleLevel: 'ERROR',
    category: 'Pihenőidő'
  },
  {
    code: 'KSZ-28-1',
    name: 'Tárgyhavi beosztás közlési határidő (23-áig)',
    citation: 'MÁV KSz 28. § 1. pont',
    summary: 'A tárgyhónapra irányadó munkaidő-beosztást a tárgyhónapot megelőző hónap 23-áig írásban közölni kell a munkavállalóval.',
    ruleLevel: 'WARNING',
    category: 'Adminisztráció'
  },
  {
    code: 'KSZ-29-2',
    name: '120 órán belüli műszakmódosítás szabálya',
    citation: 'MÁV KSz 29. § 1-3. pont',
    summary: 'Előzetes munkaidő-beosztás legalább 120 órával (5 nap) korábban módosítható a munkáltató által. 120 órán belül csak a munkavállaló írásbeli kérelmére vagy írásos megállapodás alapján módosítható.',
    ruleLevel: 'WARNING',
    category: 'Jog & Adminisztráció'
  },
  {
    code: 'KSZ-35-1',
    name: 'Éves rendkívüli munkaidő keret (300 óra)',
    citation: 'MÁV KSz 35. § 1. pont',
    summary: 'Naptári évente legfeljebb 300 óra rendkívüli munkaidő (túlóra) rendelhető el.',
    ruleLevel: 'ERROR',
    category: 'Túlóra'
  },
  {
    code: 'KSZ-43-1',
    name: 'Szabadság elszámolás és bejelentési kötelezettség',
    citation: 'MÁV KSz 43. § 1-2. pont',
    summary: 'A szabadságokat órában kell megállapítani, kiadni és elszámolni (napi 8h). A dolgozó rendelkezési szabadságát (7 munkanap) kezdete előtt legalább 7 nappal köteles bejelenteni.',
    ruleLevel: 'INFO',
    category: 'Szabadság'
  }
];
