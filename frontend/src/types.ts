/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'employee' | 'admin' | 'owner';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  outlet: string;
  position: string;
}

export type ViewState = 'login' | 'employee-dashboard' | 'admin-dashboard';

export type AdminTab = 'summary' | 'employee' | 'outlet' | 'attendance' | 'payroll' | 'settings';

export interface Outlet {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radius: number;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  employeeId: string;
  pin: string;
  outletId: string;
  outletName: string;
  tipeGaji: 'Bulanan' | 'Harian';
  gajiPokok: number;
  jamMasuk: string;
  jamKeluar: string;
  potonganTelat: number;
  potonganAbsen: number;
  bonusRajin: number;
  selectedDays: string[];
  targetHariKerja: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  outletId: string;
  outletName: string;
  date: string;
  entryTime: string;
  exitTime?: string;
  status: 'tepat' | 'telat' | 'bolos';
  entryPhoto?: string;
  exitPhoto?: string;
  workSchedule: {
    jamMasuk: string;
    jamKeluar: string;
  };
  jamMasuk: string;
  jamKeluar: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  name: string;
  outlet: string;
  tipeGaji: 'Bulanan' | 'Harian';
  targetHariKerja: number;
  hadirHari: number;
  frekuensiTelat: number;
  gajiPokok: number;
  bonus: number;
  potAbsen: number;
  potTelat: number;
}
