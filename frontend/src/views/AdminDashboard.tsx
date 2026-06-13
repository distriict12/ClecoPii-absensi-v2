/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { User, AdminTab } from '../types';
import { 
  Zap, 
  LayoutDashboard, 
  Store, 
  CalendarCheck, 
  Banknote, 
  Settings, 
  LogOut, 
  Moon, 
  Bell,
  Menu,
  X,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import SummarySubView from './admin/SummarySubView';
import EmployeeSubView from './admin/EmployeeSubView';
import OutletSubView from './admin/OutletSubView';
import AttendanceSubView from './admin/AttendanceSubView';
import PayrollSubView from './admin/PayrollSubView';

const GroupIcon = Users;

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('summary');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'summary', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'employee', label: 'Karyawan', icon: GroupIcon },
    { id: 'outlet', label: 'Cabang', icon: Store },
    { id: 'attendance', label: 'Kehadiran', icon: CalendarCheck },
    { id: 'payroll', label: 'Penggajian', icon: Banknote },
  ];

  const handleTabChange = (tabId: AdminTab | 'settings') => {
    setActiveTab(tabId as AdminTab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col md:flex-row relative">
      
      {/* ── Overlay ── */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-on-surface/50 backdrop-blur-sm z-[50] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── TopNavBar (Mobile Only) ── */}
      <header className="md:hidden sticky top-0 z-[40] flex justify-between items-center px-4 py-3 w-full bg-surface border-b-4 border-on-surface shadow-hard">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 border-4 border-on-surface bg-primary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Menu className="w-5 h-5 stroke-[3px]" />
          </button>
          <div className="text-lg font-black text-on-surface tracking-tighter uppercase">ShiftForce</div>
        </div>
          <div className="flex items-center gap-2">
          <button className="p-2 border-4 border-on-surface bg-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Moon className="w-4 h-4" />
          </button>
          <img
            src={user.avatar}
            alt={user.name}
            className="w-9 h-9 border-4 border-on-surface object-cover bg-surface-variant"
          />
        </div>
      </header>

      {/* ── SideNavBar ── */}
      <nav className={cn(
        // Lebar sidebar dikecilkan: w-[280px] mobile, w-56 desktop (dari w-64)
        "fixed left-0 top-0 h-screen w-[260px] md:w-56 border-r-4 border-on-surface shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] p-3 bg-surface z-[60] overflow-y-auto flex flex-col transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        
        {/* Logo — margin dikecilkan mb-10 → mb-6 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-primary" fill="currentColor" />
            <div className="text-xl font-black text-on-surface tracking-tighter uppercase">ShiftForce</div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="md:hidden p-1 border-4 border-on-surface bg-surface hover:bg-error hover:text-on-error transition-colors"
          >
            <X className="w-5 h-5 stroke-[3px]" />
          </button>
        </div>

        {/* User card — padding dan margin dikecilkan */}
       <div className="flex items-center gap-3 mb-6 p-2 border-4 border-on-surface bg-surface-container shadow-hard">
          {/* Avatar dengan Fallback Inisial */}
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 border-4 border-on-surface object-cover bg-surface-variant shrink-0"
            />
          ) : (
            <div className="w-10 h-10 border-4 border-on-surface bg-primary flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-black text-on-surface text-lg">
                {user.name && user.name.toLowerCase() !== 'owner' ? user.name.charAt(0).toUpperCase() : 'M'}
              </span>
            </div>
          )}
          
          <div className="overflow-hidden flex flex-col items-start">
            <p className="text-sm font-black text-on-surface truncate w-full capitalize">
              {user.name === 'owner' ? 'OWNER' : user.name}
            </p>
            {/* Brutalist Badge untuk Jabatan */}
            <span className="mt-1 inline-block px-2 py-0.5 bg-primary text-on-surface text-[10px] font-black uppercase border-2 border-on-surface shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] tracking-widest">
              {user.role}
            </span>
          </div>
        </div>

        {/* Nav items — padding dikecilkan p-4 → p-3 */}
        <div className="flex flex-col gap-1 flex-grow">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-3 p-3 text-sm font-bold border-4 transition-all uppercase tracking-wider",
                  activeTab === tab.id
                    ? "bg-primary-container text-on-surface border-on-surface shadow-hard"
                    : "text-on-surface bg-surface border-transparent hover:border-on-surface hover:bg-surface-container"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", activeTab === tab.id && "fill-current")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Bottom — margin dikecilkan mt-10 → mt-6, padding pt-4 → pt-3 */}
        <div className="mt-6 flex flex-col gap-1 border-t-4 border-on-surface pt-3">
          <button
            onClick={() => handleTabChange('settings')}
            className={cn(
              "flex items-center gap-3 p-3 text-sm font-bold border-4 transition-all uppercase tracking-wider border-transparent hover:border-on-surface",
              activeTab === 'settings' ? "bg-surface-container border-on-surface" : "text-on-surface"
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Pengaturan
          </button>
          <button
            onClick={onLogout}
            className="text-on-surface flex items-center gap-3 p-3 text-sm font-bold border-4 border-transparent hover:border-on-surface hover:bg-error-container hover:text-on-error-container transition-all uppercase tracking-wider"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Keluar
          </button>
        </div>
      </nav>

      {/* ── Main Content ── */}
      {/* ml-56 sesuai lebar sidebar baru, max-w dari 1200px → 1024px, padding dari p-10 → p-6 md:p-8 */}
      <main className="flex-grow md:ml-56 p-4 md:p-8 w-full max-w-[1024px] mx-auto bg-background">
        {/* Header Actions (Desktop) — mb dikecilkan mb-10 → mb-6 */}
        <div className="hidden md:flex justify-end mb-6 gap-3">
          <button className="p-2 border-4 border-on-surface bg-surface shadow-hard hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-hard-lg active:translate-x-0 active:translate-y-0 transition-all flex items-center justify-center">
            <Moon className="w-5 h-5" />
          </button>
          <button className="p-2 border-4 border-on-surface bg-surface shadow-hard hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-hard-lg active:translate-x-0 active:translate-y-0 transition-all flex items-center justify-center relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-on-surface"></span>
          </button>
        </div>

        {activeTab === 'summary' && <SummarySubView />}
        {activeTab === 'employee' && <EmployeeSubView />}
        {activeTab === 'outlet' && <OutletSubView />}
        {activeTab === 'attendance' && <AttendanceSubView />}
        {activeTab === 'payroll' && <PayrollSubView />}
      </main>
    </div>
  );
}