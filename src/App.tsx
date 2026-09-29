/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Employee, 
  ShiftAssignment, 
  TeamRequest, 
  StationConfig,
  MonthSummary
} from './types';
import { 
  MAV_STATIONS, 
  MAV_SHIFT_TYPES 
} from './data/mavRegulations';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_REQUESTS 
} from './data/mockData';
import { 
  getMonthSummary, 
  checkScheduleCompliance 
} from './utils/complianceChecker';
import { 
  generateSmartMonthlySchedule 
} from './utils/schedulerEngine';
import { 
  exportScheduleToCSV 
} from './utils/exportUtils';

import { Header } from './components/Header';
import { HeroStats } from './components/HeroStats';
import { ScheduleGrid } from './components/ScheduleGrid';
import { CompliancePanel } from './components/CompliancePanel';
import { LeaveAndPreferencesModal } from './components/LeaveAndPreferencesModal';
import { ShiftEditModal } from './components/ShiftEditModal';
import { TeamManagementModal } from './components/TeamManagementModal';
import { StationManagementModal } from './components/StationManagementModal';
import { WorkTimeSummaryModal } from './components/WorkTimeSummaryModal';
import { MavRulesReferenceDrawer } from './components/MavRulesReferenceDrawer';
import { PrintScheduleView } from './components/PrintScheduleView';
import { Plus, Users, Building2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'compliance' | 'leaves' | 'worktime' | 'rules'>('schedule');
  
  // Stations state (user can add, update, delete stations)
  const [stations, setStations] = useState<StationConfig[]>(MAV_STATIONS);
  const [selectedStation, setSelectedStation] = useState<StationConfig>(MAV_STATIONS[0]);

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // Október (0-indexed)

  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [requests, setRequests] = useState<TeamRequest[]>(INITIAL_REQUESTS);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter: show only employees of selected station, or all
  const [filterByStation, setFilterByStation] = useState(false);

  // Modals state
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isWorkTimeModalOpen, setIsWorkTimeModalOpen] = useState(false);
  const [isRulesDrawerOpen, setIsRulesDrawerOpen] = useState(false);
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false);

  const [editingCell, setEditingCell] = useState<{
    employee: Employee;
    dateStr: string;
    currentAssignment?: ShiftAssignment;
    prevAssignment?: ShiftAssignment;
    nextAssignment?: ShiftAssignment;
    initialTab?: 'edit' | 'swap';
  } | null>(null);

  // Month summary & statutory parameters (KSz 24.§)
  const monthSummary: MonthSummary = useMemo(() => {
    return getMonthSummary(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Current active employees to display in schedule
  const activeStationEmployees = useMemo(() => {
    if (!filterByStation) return employees;
    const matching = employees.filter(e => e.station === selectedStation.name);
    return matching.length > 0 ? matching : employees;
  }, [employees, selectedStation, filterByStation]);

  // Initial schedule generated on load or month change
  const [assignments, setAssignments] = useState<ShiftAssignment[]>(() => {
    const summary = getMonthSummary(2026, 9);
    return generateSmartMonthlySchedule(INITIAL_EMPLOYEES, INITIAL_REQUESTS, summary, MAV_STATIONS[0]);
  });

  // Re-generate schedule when month or station changes
  const handleAutoGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateSmartMonthlySchedule(employees, requests, monthSummary, selectedStation);
      setAssignments(generated);
      setIsGenerating(false);
    }, 200);
  };

  // Run full compliance audit against MÁV KSz and Hungarian Labor Code (Mt.)
  const violations = useMemo(() => {
    return checkScheduleCompliance(assignments, employees, monthSummary, selectedStation);
  }, [assignments, employees, monthSummary, selectedStation]);

  // Handle cell click in schedule grid
  const handleCellClick = (
    employee: Employee, 
    dateStr: string, 
    currentAssignment?: ShiftAssignment,
    mode: 'edit' | 'swap' = 'edit'
  ) => {
    const currentDate = new Date(dateStr);
    
    // Find prev assignment
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
    const prevAssignment = assignments.find(a => a.employeeId === employee.id && a.date === prevDateStr);

    // Find next assignment
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
    const nextAssignment = assignments.find(a => a.employeeId === employee.id && a.date === nextDateStr);

    setEditingCell({
      employee,
      dateStr,
      currentAssignment,
      prevAssignment,
      nextAssignment,
      initialTab: mode
    });
  };

  // Handle shift swap between two employees with automatic state synchronization
  const handleSwapShifts = (
    empA: Employee,
    dateA: string,
    empB: Employee,
    dateB: string,
    appliedImmediately: boolean,
    reason?: string
  ) => {
    if (appliedImmediately) {
      setAssignments(prev => {
        const asgA = prev.find(a => a.employeeId === empA.id && a.date === dateA);
        const asgB = prev.find(a => a.employeeId === empB.id && a.date === dateB);
        const defaultPih = MAV_SHIFT_TYPES.find(s => s.id === 'PIH')!;

        const isSameDay = dateA === dateB;
        let updated = [...prev];

        if (isSameDay) {
          const newA: ShiftAssignment = asgB ? {
            ...asgB,
            id: asgA ? asgA.id : `asg-${empA.id}-${dateA}`,
            employeeId: empA.id,
            date: dateA,
            isModifiedWithin120h: true,
            note: reason || `Kölcsönös műszakcsere (${empB.name})`
          } : {
            id: asgA ? asgA.id : `asg-${empA.id}-${dateA}`,
            employeeId: empA.id,
            date: dateA,
            shiftTypeId: 'PIH',
            startTime: defaultPih.defaultStartTime,
            endTime: defaultPih.defaultEndTime,
            durationHours: 0,
            isNightShift: false,
            nightHours: 0,
            afternoonHours: 0,
            holidayHours: 0,
            isOvertime: false,
            isModifiedWithin120h: true,
            note: reason || `Kölcsönös műszakcsere (${empB.name})`
          };

          const newB: ShiftAssignment = asgA ? {
            ...asgA,
            id: asgB ? asgB.id : `asg-${empB.id}-${dateA}`,
            employeeId: empB.id,
            date: dateA,
            isModifiedWithin120h: true,
            note: reason || `Kölcsönös műszakcsere (${empA.name})`
          } : {
            id: asgB ? asgB.id : `asg-${empB.id}-${dateA}`,
            employeeId: empB.id,
            date: dateA,
            shiftTypeId: 'PIH',
            startTime: defaultPih.defaultStartTime,
            endTime: defaultPih.defaultEndTime,
            durationHours: 0,
            isNightShift: false,
            nightHours: 0,
            afternoonHours: 0,
            holidayHours: 0,
            isOvertime: false,
            isModifiedWithin120h: true,
            note: reason || `Kölcsönös műszakcsere (${empA.name})`
          };

          updated = updated.map(a => {
            if (a.employeeId === empA.id && a.date === dateA) return newA;
            if (a.employeeId === empB.id && a.date === dateA) return newB;
            return a;
          });

          if (!prev.some(a => a.employeeId === empA.id && a.date === dateA)) updated.push(newA);
          if (!prev.some(a => a.employeeId === empB.id && a.date === dateA)) updated.push(newB);

        } else {
          // Cross-day swap
          const newAonDateB: ShiftAssignment = asgB ? {
            ...asgB,
            id: `asg-${empA.id}-${dateB}`,
            employeeId: empA.id,
            date: dateB,
            isModifiedWithin120h: true,
            note: reason || `Műszakcsere (${empB.name} ${dateB})`
          } : {
            id: `asg-${empA.id}-${dateB}`,
            employeeId: empA.id,
            date: dateB,
            shiftTypeId: 'PIH',
            startTime: defaultPih.defaultStartTime,
            endTime: defaultPih.defaultEndTime,
            durationHours: 0,
            isNightShift: false,
            nightHours: 0,
            afternoonHours: 0,
            holidayHours: 0,
            isOvertime: false,
            isModifiedWithin120h: true
          };

          const pihAonDateA: ShiftAssignment = {
            id: asgA ? asgA.id : `asg-${empA.id}-${dateA}`,
            employeeId: empA.id,
            date: dateA,
            shiftTypeId: 'PIH',
            startTime: defaultPih.defaultStartTime,
            endTime: defaultPih.defaultEndTime,
            durationHours: 0,
            isNightShift: false,
            nightHours: 0,
            afternoonHours: 0,
            holidayHours: 0,
            isOvertime: false,
            isModifiedWithin120h: true,
            note: `Csere pihenőnap (${empB.name} javára)`
          };

          const newBonDateA: ShiftAssignment = asgA ? {
            ...asgA,
            id: `asg-${empB.id}-${dateA}`,
            employeeId: empB.id,
            date: dateA,
            isModifiedWithin120h: true,
            note: reason || `Műszakcsere (${empA.name} ${dateA})`
          } : {
            id: `asg-${empB.id}-${dateA}`,
            employeeId: empB.id,
            date: dateA,
            shiftTypeId: 'PIH',
            startTime: defaultPih.defaultStartTime,
            endTime: defaultPih.defaultEndTime,
            durationHours: 0,
            isNightShift: false,
            nightHours: 0,
            afternoonHours: 0,
            holidayHours: 0,
            isOvertime: false,
            isModifiedWithin120h: true
          };

          const pihBonDateB: ShiftAssignment = {
            id: asgB ? asgB.id : `asg-${empB.id}-${dateB}`,
            employeeId: empB.id,
            date: dateB,
            shiftTypeId: 'PIH',
            startTime: defaultPih.defaultStartTime,
            endTime: defaultPih.defaultEndTime,
            durationHours: 0,
            isNightShift: false,
            nightHours: 0,
            afternoonHours: 0,
            holidayHours: 0,
            isOvertime: false,
            isModifiedWithin120h: true,
            note: `Csere pihenőnap (${empA.name} javára)`
          };

          updated = updated.map(a => {
            if (a.employeeId === empA.id && a.date === dateA) return pihAonDateA;
            if (a.employeeId === empA.id && a.date === dateB) return newAonDateB;
            if (a.employeeId === empB.id && a.date === dateA) return newBonDateA;
            if (a.employeeId === empB.id && a.date === dateB) return pihBonDateB;
            return a;
          });

          if (!updated.some(a => a.employeeId === empA.id && a.date === dateB)) updated.push(newAonDateB);
          if (!updated.some(a => a.employeeId === empB.id && a.date === dateA)) updated.push(newBonDateA);
        }

        return updated;
      });
    }

    // Register formal shift swap request
    const newReq: TeamRequest = {
      id: `req-swap-${Date.now()}`,
      employeeId: empA.id,
      type: 'SHIFT_SWAP',
      startDate: dateA,
      endDate: dateB,
      reason: reason || `Kölcsönös műszakcsere: ${empA.name} ↔ ${empB.name}`,
      status: appliedImmediately ? 'APPROVED' : 'PENDING',
      submissionDate: new Date().toISOString().split('T')[0],
      swapPartnerId: empB.id,
      swapTargetDate: dateB
    };
    setRequests(prev => [newReq, ...prev]);
  };

  const handleSaveShift = (updated: ShiftAssignment) => {
    setAssignments(prev => {
      const exists = prev.some(a => a.employeeId === updated.employeeId && a.date === updated.date);
      if (exists) {
        return prev.map(a => (a.employeeId === updated.employeeId && a.date === updated.date ? updated : a));
      }
      return [...prev, updated];
    });
  };

  const handleDeleteShift = (employeeId: string, dateStr: string) => {
    const pihShift = MAV_SHIFT_TYPES.find(s => s.id === 'PIH')!;
    const restAssignment: ShiftAssignment = {
      id: `asg-${employeeId}-${dateStr}`,
      employeeId,
      date: dateStr,
      shiftTypeId: 'PIH',
      startTime: pihShift.defaultStartTime,
      endTime: pihShift.defaultEndTime,
      durationHours: 0,
      isNightShift: false,
      nightHours: 0,
      afternoonHours: 0,
      holidayHours: 0,
      isOvertime: false,
      isModifiedWithin120h: false,
      locked: false
    };

    setAssignments(prev => 
      prev.map(a => (a.employeeId === employeeId && a.date === dateStr ? restAssignment : a))
    );
  };

  // Add new request
  const handleAddRequest = (newReq: Omit<TeamRequest, 'id'>) => {
    const created: TeamRequest = {
      ...newReq,
      id: `req-${Date.now()}`
    };
    const updatedRequests = [...requests, created];
    setRequests(updatedRequests);

    // If approved, synchronize with schedule
    if (created.status === 'APPROVED') {
      const regenerated = generateSmartMonthlySchedule(employees, updatedRequests, monthSummary, selectedStation);
      setAssignments(regenerated);
    }
  };

  // Update request status
  const handleUpdateRequestStatus = (id: string, status: 'APPROVED' | 'REJECTED') => {
    const updated = requests.map(r => r.id === id ? { ...r, status } : r);
    setRequests(updated);

    if (status === 'APPROVED') {
      const regenerated = generateSmartMonthlySchedule(employees, updated, monthSummary, selectedStation);
      setAssignments(regenerated);
    }
  };

  // Add new employee
  const handleAddEmployee = (newEmp: Omit<Employee, 'id'>) => {
    const created: Employee = {
      ...newEmp,
      id: `emp-${Date.now()}`
    };
    const updated = [...employees, created];
    setEmployees(updated);
    const regenerated = generateSmartMonthlySchedule(updated, requests, monthSummary, selectedStation);
    setAssignments(regenerated);
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    const updated = employees.map(e => e.id === updatedEmp.id ? updatedEmp : e);
    setEmployees(updated);
  };

  const handleDeleteEmployee = (empId: string) => {
    const updated = employees.filter(e => e.id !== empId);
    setEmployees(updated);
    setAssignments(prev => prev.filter(a => a.employeeId !== empId));
  };

  // Station Management Handlers
  const handleAddStation = (newStation: StationConfig, generateStaff = true) => {
    setStations(prev => [...prev, newStation]);
    setSelectedStation(newStation);

    if (generateStaff) {
      let newStaff: Employee[] = [];

      if (newStation.department === 'SIGNALING' || newStation.category === 'SIGNALING_DISTRICT') {
        // Dedicated TEB Signaling District Team
        newStaff = [
          {
            id: `emp-st-${Date.now()}-1`,
            name: `${newStation.name} Szakaszmérnök`,
            employeeNumber: `MV-${Math.floor(20000 + Math.random() * 80000)}`,
            role: 'Biztosítóberendezési szakaszmérnök',
            department: 'SIGNALING',
            workPattern: 'STANDARD',
            station: newStation.name,
            travelMinutes: 20,
            age: 50,
            bloodDonationsThisYear: 1,
            isEligibleForSpecialLeave: false,
            annualOvertimeHours: 12,
            totalAnnualLeaveDays: 29,
            usedLeaveDays: 8,
            phone: '+36 30 110 2200',
            email: `mernok.${newStation.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@teb.mav.hu`
          },
          {
            id: `emp-st-${Date.now()}-2`,
            name: `${newStation.name} Vezető Műszerész`,
            employeeNumber: `MV-${Math.floor(20000 + Math.random() * 80000)}`,
            role: 'Biztosítóberendezési műszerész',
            department: 'SIGNALING',
            workPattern: 'DISPATCHED',
            station: newStation.name,
            travelMinutes: 25,
            age: 44,
            bloodDonationsThisYear: 3,
            isEligibleForSpecialLeave: false,
            annualOvertimeHours: 28,
            totalAnnualLeaveDays: 27,
            usedLeaveDays: 10,
            phone: '+36 30 110 2201',
            email: `muszeresz1.${newStation.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@teb.mav.hu`
          },
          {
            id: `emp-st-${Date.now()}-3`,
            name: `${newStation.name} BB Lakatos I.`,
            employeeNumber: `MV-${Math.floor(20000 + Math.random() * 80000)}`,
            role: 'Biztosítóberendezési lakatos',
            department: 'SIGNALING',
            workPattern: 'DISPATCHED',
            station: newStation.name,
            travelMinutes: 30,
            age: 46,
            bloodDonationsThisYear: 4,
            isEligibleForSpecialLeave: false,
            annualOvertimeHours: 35,
            totalAnnualLeaveDays: 28,
            usedLeaveDays: 12,
            phone: '+36 30 110 2202',
            email: `lakatos1.${newStation.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@teb.mav.hu`
          },
          {
            id: `emp-st-${Date.now()}-4`,
            name: `${newStation.name} BB Technikus`,
            employeeNumber: `MV-${Math.floor(20000 + Math.random() * 80000)}`,
            role: 'Biztosítóberendezési technikus',
            department: 'SIGNALING',
            workPattern: 'DISPATCHED',
            station: newStation.name,
            travelMinutes: 35,
            age: 33,
            bloodDonationsThisYear: 0,
            isEligibleForSpecialLeave: false,
            annualOvertimeHours: 20,
            totalAnnualLeaveDays: 24,
            usedLeaveDays: 6,
            phone: '+36 30 110 2203',
            email: `technikus.${newStation.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@teb.mav.hu`
          },
          {
            id: `emp-st-${Date.now()}-5`,
            name: `${newStation.name} BB Lakatos II.`,
            employeeNumber: `MV-${Math.floor(20000 + Math.random() * 80000)}`,
            role: 'Biztosítóberendezési lakatos',
            department: 'SIGNALING',
            workPattern: 'DISPATCHED',
            station: newStation.name,
            travelMinutes: 20,
            age: 39,
            bloodDonationsThisYear: 2,
            isEligibleForSpecialLeave: false,
            annualOvertimeHours: 24,
            totalAnnualLeaveDays: 26,
            usedLeaveDays: 7,
            phone: '+36 30 110 2204',
            email: `lakatos2.${newStation.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@teb.mav.hu`
          }
        ];
      } else {
        // Combined or Traffic Station
        newStaff = [
          {
            id: `emp-st-${Date.now()}-1`,
            name: `${newStation.name} Főrendelkező`,
            employeeNumber: `MV-${Math.floor(10000 + Math.random() * 90000)}`,
            role: 'Főrendelkező',
            department: 'TRAFFIC',
            workPattern: 'CONTINUOUS_4_SHIFT',
            station: newStation.name,
            travelMinutes: 25,
            age: 48,
            bloodDonationsThisYear: 1,
            isEligibleForSpecialLeave: true,
            annualOvertimeHours: 20,
            totalAnnualLeaveDays: 28,
            usedLeaveDays: 6,
            phone: '+36 30 111 2233',
            email: `foreman.${newStation.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@palyavasut.mav.hu`
          },
          {
            id: `emp-st-${Date.now()}-2`,
            name: `${newStation.name} Rendelkező I.`,
            employeeNumber: `MV-${Math.floor(10000 + Math.random() * 90000)}`,
            role: 'Rendelkező forgalmi szolgálattevő',
            department: 'TRAFFIC',
            workPattern: 'CONTINUOUS_4_SHIFT',
            station: newStation.name,
            travelMinutes: 30,
            age: 36,
            bloodDonationsThisYear: 2,
            isEligibleForSpecialLeave: false,
            annualOvertimeHours: 15,
            totalAnnualLeaveDays: 25,
            usedLeaveDays: 5,
            phone: '+36 30 222 3344',
            email: `disp1.${newStation.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@palyavasut.mav.hu`
          },
          {
            id: `emp-st-${Date.now()}-3`,
            name: `${newStation.name} Rendelkező II.`,
            employeeNumber: `MV-${Math.floor(10000 + Math.random() * 90000)}`,
            role: 'Rendelkező forgalmi szolgálattevő',
            department: 'TRAFFIC',
            workPattern: 'CONTINUOUS_4_SHIFT',
            station: newStation.name,
            travelMinutes: 40,
            age: 42,
            bloodDonationsThisYear: 0,
            isEligibleForSpecialLeave: false,
            annualOvertimeHours: 24,
            totalAnnualLeaveDays: 27,
            usedLeaveDays: 8,
            phone: '+36 30 333 4455',
            email: `disp2.${newStation.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@palyavasut.mav.hu`
          },
          {
            id: `emp-st-${Date.now()}-4`,
            name: `${newStation.name} Külsős Szolgálattevő`,
            employeeNumber: `MV-${Math.floor(10000 + Math.random() * 90000)}`,
            role: 'Külső forgalmi szolgálattevő',
            department: 'TRAFFIC',
            workPattern: 'CONTINUOUS_4_SHIFT',
            station: newStation.name,
            travelMinutes: 20,
            age: 31,
            bloodDonationsThisYear: 3,
            isEligibleForSpecialLeave: false,
            annualOvertimeHours: 10,
            totalAnnualLeaveDays: 24,
            usedLeaveDays: 4,
            phone: '+36 30 444 5566',
            email: `ext.${newStation.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@palyavasut.mav.hu`
          },
          {
            id: `emp-st-${Date.now()}-5`,
            name: `${newStation.name} Váltókezelő`,
            employeeNumber: `MV-${Math.floor(10000 + Math.random() * 90000)}`,
            role: 'Váltókezelő',
            department: 'TRAFFIC',
            workPattern: 'CONTINUOUS_4_SHIFT',
            station: newStation.name,
            travelMinutes: 35,
            age: 39,
            bloodDonationsThisYear: 0,
            isEligibleForSpecialLeave: false,
            annualOvertimeHours: 32,
            totalAnnualLeaveDays: 26,
            usedLeaveDays: 7,
            phone: '+36 30 555 6677',
            email: `switch1.${newStation.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@palyavasut.mav.hu`
          },
          // Biztosítóberendezési munkakörök a kombinált állomáshoz:
          {
            id: `emp-st-${Date.now()}-6`,
            name: `${newStation.name} BB Műszerész`,
            employeeNumber: `MV-${Math.floor(20000 + Math.random() * 80000)}`,
            role: 'Biztosítóberendezési műszerész',
            department: 'SIGNALING',
            workPattern: 'DISPATCHED',
            station: newStation.name,
            travelMinutes: 25,
            age: 41,
            bloodDonationsThisYear: 2,
            isEligibleForSpecialLeave: false,
            annualOvertimeHours: 18,
            totalAnnualLeaveDays: 27,
            usedLeaveDays: 8,
            phone: '+36 30 777 8899',
            email: `bb.muszeresz.${newStation.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@teb.mav.hu`
          },
          {
            id: `emp-st-${Date.now()}-7`,
            name: `${newStation.name} BB Lakatos`,
            employeeNumber: `MV-${Math.floor(20000 + Math.random() * 80000)}`,
            role: 'Biztosítóberendezési lakatos',
            department: 'SIGNALING',
            workPattern: 'DISPATCHED',
            station: newStation.name,
            travelMinutes: 30,
            age: 46,
            bloodDonationsThisYear: 3,
            isEligibleForSpecialLeave: false,
            annualOvertimeHours: 22,
            totalAnnualLeaveDays: 28,
            usedLeaveDays: 9,
            phone: '+36 30 888 9900',
            email: `bb.lakatos.${newStation.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@teb.mav.hu`
          },
          {
            id: `emp-st-${Date.now()}-8`,
            name: `${newStation.name} BB Szakaszmérnök`,
            employeeNumber: `MV-${Math.floor(20000 + Math.random() * 80000)}`,
            role: 'Biztosítóberendezési szakaszmérnök',
            department: 'SIGNALING',
            workPattern: 'STANDARD',
            station: newStation.name,
            travelMinutes: 20,
            age: 52,
            bloodDonationsThisYear: 0,
            isEligibleForSpecialLeave: false,
            annualOvertimeHours: 10,
            totalAnnualLeaveDays: 30,
            usedLeaveDays: 11,
            phone: '+36 30 999 0011',
            email: `bb.mernok.${newStation.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@teb.mav.hu`
          }
        ];
      }

      const mergedEmployees = [...employees, ...newStaff];
      setEmployees(mergedEmployees);
      const regenerated = generateSmartMonthlySchedule(mergedEmployees, requests, monthSummary, newStation);
      setAssignments(regenerated);
    }
  };

  const handleUpdateStation = (updated: StationConfig) => {
    setStations(prev => prev.map(s => s.id === updated.id ? updated : s));
    if (selectedStation.id === updated.id) {
      setSelectedStation(updated);
    }
  };

  const handleDeleteStation = (stationId: string) => {
    if (stations.length <= 1) return;
    const remaining = stations.filter(s => s.id !== stationId);
    setStations(remaining);
    if (selectedStation.id === stationId) {
      setSelectedStation(remaining[0]);
    }
  };

  const handleExportCSV = () => {
    exportScheduleToCSV(activeStationEmployees, assignments, monthSummary, selectedStation.name);
  };

  const handlePrint = () => {
    setIsPrintViewOpen(true);
  };

  const handleViolationDateClick = (employeeId: string, date: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;
    const assignment = assignments.find(a => a.employeeId === employeeId && a.date === date);
    handleCellClick(emp, date, assignment);
    setActiveTab('schedule');
  };

  // Handle direct navigation to drawers from header
  useEffect(() => {
    if (activeTab === 'leaves') {
      setIsLeaveModalOpen(true);
      setActiveTab('schedule');
    } else if (activeTab === 'worktime') {
      setIsWorkTimeModalOpen(true);
      setActiveTab('schedule');
    } else if (activeTab === 'rules') {
      setIsRulesDrawerOpen(true);
      setActiveTab('schedule');
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* If print view is triggered, display printable document */}
      {isPrintViewOpen ? (
        <PrintScheduleView
          employees={activeStationEmployees}
          assignments={assignments}
          monthSummary={monthSummary}
          station={selectedStation}
          onClosePrint={() => setIsPrintViewOpen(false)}
        />
      ) : (
        <>
          {/* Header Navigation */}
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            stations={stations}
            selectedStation={selectedStation}
            setSelectedStation={(st) => {
              setSelectedStation(st);
              // auto re-generate for selected station
              const generated = generateSmartMonthlySchedule(employees, requests, monthSummary, st);
              setAssignments(generated);
            }}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            onAutoGenerate={handleAutoGenerate}
            onExportCSV={handleExportCSV}
            onPrint={handlePrint}
            onOpenTeamModal={() => setIsTeamModalOpen(true)}
            onOpenStationModal={() => setIsStationModalOpen(true)}
            violationCount={violations.length}
            isGenerating={isGenerating}
          />

          {/* Hero Statistics and Alert Strip */}
          <HeroStats
            monthSummary={monthSummary}
            station={selectedStation}
            violations={violations}
            assignments={assignments}
            employees={activeStationEmployees}
            requests={requests}
            onViewViolations={() => setActiveTab('compliance')}
            onViewRequests={() => setIsLeaveModalOpen(true)}
            onOpenStationModal={() => setIsStationModalOpen(true)}
          />

          {/* Station Context Banner & Station Switch Bar */}
          <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2 no-print flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Aktív szolgálati hely:
              </span>
              <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {selectedStation.name} ({selectedStation.lineCode})
              </span>
              <button
                onClick={() => setIsStationModalOpen(true)}
                className="text-amber-400 hover:text-amber-300 underline underline-offset-2 ml-1 cursor-pointer font-medium"
              >
                Szolgálati hely adatai / Új állomás felvétele
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={filterByStation}
                  onChange={(e) => setFilterByStation(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span>Csak ezen állomás személyzete ({activeStationEmployees.length} fő)</span>
              </label>

              <button
                onClick={() => setIsTeamModalOpen(true)}
                className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Dolgozó hozzárendelése</span>
              </button>
            </div>
          </div>

          {/* Main Workspace Body */}
          <main className="flex-1 flex flex-col">
            {activeTab === 'schedule' && (
              <ScheduleGrid
                employees={activeStationEmployees}
                assignments={assignments}
                monthSummary={monthSummary}
                station={selectedStation}
                violations={violations}
                onCellClick={handleCellClick}
                onQuickAssignAllRest={() => {}}
              />
            )}

            {activeTab === 'compliance' && (
              <CompliancePanel
                violations={violations}
                monthSummary={monthSummary}
                station={selectedStation}
                onSelectViolationDate={handleViolationDateClick}
                onAutoFixAll={handleAutoGenerate}
              />
            )}
          </main>
        </>
      )}

      {/* Modals & Drawers */}
      {editingCell && (
        <ShiftEditModal
          isOpen={true}
          onClose={() => setEditingCell(null)}
          employee={editingCell.employee}
          dateStr={editingCell.dateStr}
          currentAssignment={editingCell.currentAssignment}
          prevAssignment={editingCell.prevAssignment}
          nextAssignment={editingCell.nextAssignment}
          allEmployees={employees}
          allAssignments={assignments}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
          onSwapShifts={handleSwapShifts}
          onRequestSwapProposal={handleAddRequest}
          initialTab={editingCell.initialTab || 'edit'}
        />
      )}

      {/* Station Management Modal */}
      <StationManagementModal
        isOpen={isStationModalOpen}
        onClose={() => setIsStationModalOpen(false)}
        stations={stations}
        selectedStation={selectedStation}
        onSelectStation={(st) => {
          setSelectedStation(st);
          const generated = generateSmartMonthlySchedule(employees, requests, monthSummary, st);
          setAssignments(generated);
        }}
        onAddStation={handleAddStation}
        onUpdateStation={handleUpdateStation}
        onDeleteStation={handleDeleteStation}
      />

      <LeaveAndPreferencesModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        employees={employees}
        requests={requests}
        onAddRequest={handleAddRequest}
        onUpdateRequestStatus={handleUpdateRequestStatus}
        onApplyScheduleSync={handleAutoGenerate}
      />

      <TeamManagementModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        employees={employees}
        stations={stations}
        currentStation={selectedStation}
        onUpdateEmployee={handleUpdateEmployee}
        onAddEmployee={handleAddEmployee}
        onDeleteEmployee={handleDeleteEmployee}
      />

      {/* Work Time Summary Modal (strictly work hours, no wage data) */}
      <WorkTimeSummaryModal
        isOpen={isWorkTimeModalOpen}
        onClose={() => setIsWorkTimeModalOpen(false)}
        employees={activeStationEmployees}
        assignments={assignments}
        monthSummary={monthSummary}
        station={selectedStation}
      />

      <MavRulesReferenceDrawer
        isOpen={isRulesDrawerOpen}
        onClose={() => setIsRulesDrawerOpen(false)}
      />

    </div>
  );
}
