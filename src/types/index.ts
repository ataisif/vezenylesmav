export type WorkPattern =
  | 'CONTINUOUS_4_SHIFT' // Megszakítás nélküli 4-brigádos (12h nappal, 24h pihenő, 12h éjjel, 48h pihenő)
  | 'CONTINUOUS_12_24'   // 12/24-es fordulós (12h szolgálat, 24h pihenő)
  | 'THREE_SHIFT'        // Háromműszakos (DE 06-14, DU 14-22, ÉJ 22-06)
  | 'TWO_SHIFT'          // Kétműszakos (DE 06-14, DU 14-22)
  | 'EXTENDED_SHIFT'     // Nyújtott műszakos (12h, nem váltó)
  | 'DISPATCHED'         // Vezényelt munkarend (zavartalan vasút, egyenlőtlen - KSz 24.§ 1.g)
  | 'STANDARD';          // Általános munkarend (H-P 07:00 - 15:20 vagy 08:00 - 16:30)

export type DepartmentType = 'TRAFFIC' | 'SIGNALING';

export type ShiftCategory = 
  | 'WORK' 
  | 'LEAVE' 
  | 'REST' 
  | 'STANDBY' 
  | 'DUTY' 
  | 'EDUCATION' 
  | 'MEDICAL';

export interface ShiftType {
  id: string;
  code: string;
  name: string;
  category: ShiftCategory;
  defaultStartTime: string;
  defaultEndTime: string;
  durationHours: number;
  isNightShift: boolean; // legalább 3 óra esik 22:00-06:00 közé (KSz 24.§ 1.e)
  isDayShift: boolean;
  color: string;
  textColor: string;
  badgeBg: string;
  description: string;
  applicablePatterns?: WorkPattern[];
  targetDepartment?: 'ALL' | 'TRAFFIC' | 'SIGNALING';
}

export interface Employee {
  id: string;
  name: string;
  employeeNumber: string; // Személyi törzsszám
  role: string;           // Munkakör (pl. Biztosítóberendezési műszerész, Rendelkező forgalmi szolgálattevő)
  department: DepartmentType; // 'TRAFFIC' (Forgalmi) vagy 'SIGNALING' (Biztosítóberendezési)
  workPattern: WorkPattern;
  station: string;        // Szolgálati hely (pl. Budapest-Kelenföld, Kelenföld TEB Szakaszmérnökség)
  travelMinutes: number;     // Utazási idő egy irányba (perc) - KSz 41.§ 2. lakásra érkezéstől számít
  age: number;               // Életkor (60. életévtől +1 nap pótszabadság KSz 43.§ 3.)
  bloodDonationsThisYear: number; // Véradások (3x nő / 4x férfi -> +2 nap pótszabadság)
  isEligibleForSpecialLeave: boolean; // Főrendelkező / Tartalékos térfőnök (+2 nap rendkívüli szabadság KSz 43.§ 4.)
  annualOvertimeHours: number; // Göngyölített rendkívüli munkaidő naptári évben (max 300 óra KSz 35.§ 1.)
  totalAnnualLeaveDays: number;
  usedLeaveDays: number;
  avatarUrl?: string;
  phone: string;
  email: string;
}

export type RequestType = 
  | 'ANNUAL_LEAVE'      // Rendes szabadság
  | 'BLOOD_DONOR_LEAVE' // Véradói pótszabadság
  | 'SPECIAL_MAV_LEAVE' // Főrendelkezői 2 nap rendkívüli szabadság
  | 'SICK_LEAVE'        // Betegszabadság / Keresőképtelenség
  | 'PREFER_DAY'        // Nappali műszak kérése
  | 'PREFER_NIGHT'      // Éjszakai műszak kérése
  | 'REQUEST_OFF'       // Szabadnap igény
  | 'MEDICAL_EXAM'      // Soron kívüli / Időszakos orvosi vizsgálat (KSz 34.§ 3.)
  | 'TRAINING_EXAM'     // Kötelező oktatás / időszakos vizsga (KSz 34.§ 1.)
  | 'SHIFT_SWAP';       // Kölcsönös műszakcsere kérelem (KSz 29. § 2.)

export interface TeamRequest {
  id: string;
  employeeId: string;
  type: RequestType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  submissionDate: string; // beküldés dátuma (KSz 43.§ 2. - 7 nappal előre!)
  swapPartnerId?: string;
  swapTargetDate?: string;
  swapTargetShiftTypeId?: string;
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftTypeId: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  durationHours: number;
  isNightShift: boolean;
  nightHours: number;      // 22:00-06:00 közötti ledolgozott órák
  afternoonHours: number;  // 14:00-22:00 közötti ledolgozott órák
  holidayHours: number;    // Munkaszüneti napra eső órák
  isOvertime: boolean;     // Rendkívüli munkaidő (túlóra)
  isModifiedWithin120h: boolean; // KSz 29.§ 2. 120 órán belüli módosítás
  note?: string;
  locked?: boolean; // Nem módosítható (pl. jóváhagyott szabadság)
}

export type ViolationSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface ComplianceViolation {
  id: string;
  severity: ViolationSeverity;
  ruleCode: string;
  title: string;
  description: string;
  legalCitation: string; // MÁV KSz paragrafus / Mt. hivatkozás
  employeeId?: string;
  employeeName?: string;
  date?: string;
  suggestedAction?: string;
}

export interface StationPositionRequirement {
  role: string;
  dayShiftCount: number;
  nightShiftCount: number;
  department?: DepartmentType;
}

export interface StationConfig {
  id: string;
  name: string;
  category: 'MAJOR_HIGH_TRAFFIC' | 'DISPATCH_CENTER' | 'STANDARD_STATION' | 'SIGNALING_DISTRICT'; // 12/A, 12/B, standard, vagy Biztosítóberendezési szakasz
  lineCode: string;
  department?: 'TRAFFIC' | 'SIGNALING' | 'COMBINED';
  description?: string;
  requiredPositions: StationPositionRequirement[];
}

export interface MonthSummary {
  year: number;
  month: number; // 0-indexed (0 = Január)
  totalDays: number;
  workingDays: number; // Hétfő-Péntek munkanapok, levonva a munkanapra eső ünnepnapokat
  holidayDates: string[]; // YYYY-MM-DD
  statutoryRequiredHours: number; // "Kötelező óra" (workingDays * 8 óra)
  publicationDeadlineDate: string; // Előző hónap 23. napja (KSz 28.§ 1.)
}

export interface EmployeeMonthWorkSummary {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  role: string;
  department: DepartmentType;
  station: string;
  workPattern: WorkPattern;
  scheduledHours: number;
  requiredHours: number;
  overtimeHours: number;
  nightHours: number;
  afternoonHours: number;
  holidayHours: number;
  leaveHours: number;
  shiftsCount: number;
  modifiedWithin120hCount: number;
  balanceHours: number; // scheduled - required
}

// Biztosítóberendezési és Forgalmi Munkakörök listái és csoportosítása
export const TRAFFIC_ROLES = [
  'Főrendelkező',
  'Rendelkező forgalmi szolgálattevő',
  'Forgalmi szolgálattevő (táblakezelő)',
  'Külső forgalmi szolgálattevő',
  'Váltókezelő',
  'Tolatásvezető',
  'Tolatásvezető II.',
  'Kocsimester',
  'Térfőnök',
  'Tartalékos térfőnök',
  'Állomásfőnök I-III.',
  'Vezénylő tiszt'
] as const;

export const SIGNALING_ROLES = [
  'Biztosítóberendezési adminisztrátor',
  'Biztosítóberendezési szakaszadminisztrátor',
  'Biztosítóberendezési lakatos',
  'Biztosítóberendezési műszerész',
  'Biztosítóberendezési szakaszmérnök',
  'Biztosítóberendezési diszpécser',
  'Biztosítóberendezési technikus',
  'Biztosítóberendezési vonalellenőr',
  'Biztosítóberendezési műhelyi egységjavító (műszerész)',
  'Biztosítóberendezési betanított munkás',
  'TEB műszerész gyakornok',
  'Területi biztosítóberendezési szakértő',
  'Biztosítóberendezési művezető',
  'Digitális és hibaelhárító mérnök',
  'Központi felépítmény- és biztosítóberendezés felügyelő'
] as const;
