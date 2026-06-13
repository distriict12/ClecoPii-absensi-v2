/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { User } from '../types';
import {
  Zap,
  LayoutDashboard,
  CalendarCheck,
  Settings,
  LogOut,
  Moon,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import EmployeeDashboard from './EmployeeDashboard';
import EmployeeAttendanceView from './EmployeeAttendanceView';

interface EmployeeDashboardContainerProps {
  user: User;
  onLogout: () => void;
}

type EmployeeView = 'summary' | 'attendance' | 'settings';

const TABS: { id: EmployeeView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'summary',    label: 'Absensi', icon: LayoutDashboard },
  { id: 'attendance', label: 'Riwayat', icon: CalendarCheck },
];

export default function EmployeeDashboardContainer({ user, onLogout }: EmployeeDashboardContainerProps) {
  const [currentView,      setCurrentView]      = useState<EmployeeView>('summary');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (view: EmployeeView) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col md:flex-row relative">

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-on-surface/50 backdrop-blur-sm z-[50] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* TopNavBar (Mobile) — py-3 tetap, ikon dikecilkan sedikit */}
      <header className="md:hidden sticky top-0 z-[40] flex justify-between items-center px-4 py-3 w-full bg-surface border-b-4 border-on-surface shadow-hard">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 border-4 border-on-surface bg-primary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            aria-label="Buka menu"
          >
            <Menu className="w-5 h-5 stroke-[3px]" />
          </button>
          <div className="text-lg font-black text-on-surface tracking-tighter uppercase">ShiftForce</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 border-4 border-on-surface bg-surface shadow-hard relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-on-surface" />
          </button>
          <img src={user.avatar} alt={user.name} className="w-9 h-9 border-4 border-on-surface object-cover bg-surface-variant" />
        </div>
      </header>

      {/* SideNavBar — w-56 (dari w-64), padding p-3 */}
      <nav className={cn(
        'fixed left-0 top-0 h-screen w-[260px] md:w-56 border-r-4 border-on-surface shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] p-3 bg-surface z-[60] overflow-y-auto flex flex-col transition-transform duration-300 ease-in-out',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>

        {/* Logo — mb-8→mb-6, ikon w-9→w-8, text-2xl→text-xl */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-primary" fill="currentColor" />
            <div className="text-xl font-black text-on-surface uppercase tracking-tighter">ShiftForce</div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1 border-4 border-on-surface bg-surface hover:bg-error hover:text-on-error transition-colors"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5 stroke-[3px]" />
          </button>
        </div>

        {/* User card — sama persis dengan AdminDashboard */}
        <div className="flex items-center gap-3 mb-6 p-2 border-4 border-on-surface bg-surface-container shadow-hard">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 border-4 border-on-surface object-cover bg-surface-variant shrink-0"
            />
          ) : (
            <div className="w-10 h-10 border-4 border-on-surface bg-primary flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-black text-on-surface text-lg">
                {user.name ? user.name.charAt(0).toUpperCase() : 'K'}
              </span>
            </div>
          )}
          <div className="overflow-hidden flex flex-col items-start">
            <p className="text-sm font-black text-on-surface truncate w-full capitalize">
              {user.name}
            </p>
            <span className="mt-1 inline-block px-2 py-0.5 bg-primary text-on-surface text-[10px] font-black uppercase border-2 border-on-surface shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] tracking-widest">
              {(user as any).position ?? user.role}
            </span>
          </div>
        </div>

        {/* Nav items — gap-2→gap-1, p-4→p-3, ikon w-5→w-4 */}
        <div className="flex flex-col gap-1 flex-grow">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-3 p-3 text-sm font-bold border-4 transition-all uppercase tracking-wider',
                  active
                    ? 'bg-primary-container text-on-surface border-on-surface shadow-hard'
                    : 'text-on-surface bg-surface border-transparent hover:border-on-surface hover:bg-surface-container'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active && 'fill-current')} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Bottom actions — mt-8→mt-6, pt-4→pt-3, gap-2→gap-1 */}
        <div className="mt-6 flex flex-col gap-1 border-t-4 border-on-surface pt-3">
          <button
            onClick={() => handleTabChange('settings')}
            className={cn(
              'flex items-center gap-3 p-3 text-sm font-bold border-4 transition-all uppercase tracking-wider border-transparent hover:border-on-surface',
              currentView === 'settings' ? 'bg-surface-container border-on-surface' : 'text-on-surface'
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Pengaturan
          </button>
          <button
            onClick={onLogout}
            className="text-on-surface bg-surface border-4 border-transparent hover:border-on-surface hover:bg-error-container hover:text-on-error-container flex items-center gap-3 p-3 text-sm font-bold uppercase tracking-wider transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" /> KELUAR
          </button>
        </div>
      </nav>

      {/* Main Content — ml-64→ml-56, p-10→p-8, mb-8→mb-6, max-w-[900px] tetap */}
      <main className="flex-grow md:ml-56 p-4 md:p-8 w-full max-w-[900px] mx-auto bg-background">
        {/* Header actions (Desktop) */}
        <div className="hidden md:flex justify-end mb-6 gap-3">
          <button className="p-2 border-4 border-on-surface bg-surface shadow-hard hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-hard-lg active:translate-x-0 active:translate-y-0 transition-all">
            <Moon className="w-5 h-5" />
          </button>
          <button className="p-2 border-4 border-on-surface bg-surface shadow-hard hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-hard-lg active:translate-x-0 active:translate-y-0 transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-on-surface" />
          </button>
        </div>

        {currentView === 'summary'    && <EmployeeDashboard user={user} />}
        {currentView === 'attendance' && <EmployeeAttendanceView />}
        {currentView === 'settings'   && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-on-surface-variant">
            <div className="border-4 border-on-surface bg-surface-container p-6 shadow-hard">
              <Settings className="w-14 h-14 opacity-30" />
            </div>
            <p className="text-lg font-black uppercase border-4 border-on-surface px-5 py-2 bg-surface-variant">Pengaturan</p>
            <p className="text-xs font-bold uppercase tracking-widest">Segera Hadir...</p>
          </div>
        )}
      </main>

    </div>
  );
} 