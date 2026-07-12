/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  LayoutDashboard, Sliders, Settings, Shield, 
  Layers, Gauge, Network, BookOpen, Target, 
  FileText, ClipboardList, Package, Calendar, 
  Database, Sparkles, ChevronLeft, ChevronRight, Building 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { labs, selectedLabId, setSelectedLabId, selectedRole, logout, userEmail } = useLab();
  const [isCollapsed, setIsCollapsed] = useState(false);
 
  // Nav Links List
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workstation', label: 'Workstation', icon: Sliders },
    { id: 'instruments', label: 'Instruments', icon: ClipboardList },
    { id: 'health', label: 'SCADA Health', icon: Gauge },
    { id: 'twin', label: 'Digital Twin', icon: Network },
    { id: 'samples', label: 'Sample Queue', icon: Layers },
    { id: 'methods', label: 'Method Library', icon: BookOpen },
    { id: 'calibration', label: 'Calibration & QC', icon: Target },
    { id: 'reports', label: 'Compliance Reports', icon: FileText },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'calendar', label: 'Schedules', icon: Calendar },
    { id: 'audit', label: 'Audit Trail', icon: Database },
    { id: 'insights', label: 'AI Copilot', icon: Sparkles },
    { id: 'admin', label: 'Admin Panel', icon: Shield },
    { id: 'settings', label: 'Admin Settings', icon: Settings },
  ];

  return (
    <aside 
      className={`bg-slate-950 border-r border-slate-900 text-slate-300 flex flex-col justify-between transition-all duration-200 shrink-0 no-print ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      id="lims-sidebar"
    >
      {/* Upper Logo and Collapse trigger */}
      <div className="flex flex-col">
        <div className="p-4 border-b border-slate-900 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">LP</span>
              <span className="font-extrabold text-white tracking-wider text-sm font-sans uppercase">LABPULSE</span>
            </div>
          )}
          {isCollapsed && (
            <span className="h-6 w-6 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-white text-xs mx-auto">L</span>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-white"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Laboratory Selector (Only shown if not collapsed) */}
        {!isCollapsed && (
          <div className="p-4 border-b border-slate-900 space-y-1.5" id="lab-selector-pane">
            <span className="text-[9px] uppercase font-mono font-bold text-slate-500 flex items-center gap-1">
              <Building className="h-3 w-3" /> Active Laboratory Node
            </span>
            <select
              value={selectedLabId}
              onChange={(e) => setSelectedLabId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 outline-none font-semibold"
            >
              {labs.map(l => (
                <option key={l.id} value={l.id}>{l.code}: {l.name.split(' - ')[0]}</option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation list */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[50vh]" id="sidebar-nav-links">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive 
                    ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500' 
                    : 'hover:bg-slate-900 text-slate-400 hover:text-white'
                }`}
                title={item.label}
                id={`sidebar-link-${item.id}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Operator Badge */}
      <div className="p-4 border-t border-slate-900 text-center space-y-1">
        {!isCollapsed && (
          <div className="text-left bg-slate-900 p-2.5 rounded-lg border border-slate-800/60 space-y-2" id="sidebar-operator-badge">
            <div>
              <span className="text-[9px] uppercase font-mono text-slate-500 flex items-center gap-1 font-bold">
                <Shield className="h-3 w-3 text-indigo-500" /> Operator Privilege
              </span>
              <p className="text-xs font-bold text-slate-200 truncate mt-0.5" title={userEmail}>{userEmail.split('@')[0]}</p>
              <p className="text-[9px] text-indigo-400 mt-0.5 font-mono">{selectedRole}</p>
            </div>
            <button
              onClick={logout}
              className="w-full py-1 text-[10px] font-mono font-bold bg-rose-950/40 hover:bg-rose-900/30 text-rose-400 hover:text-rose-300 border border-rose-900/30 rounded transition-all cursor-pointer"
            >
              SIGN OUT WORKSTATION
            </button>
          </div>
        )}
        {isCollapsed && (
          <Shield className="h-4 w-4 text-indigo-500 mx-auto" />
        )}
      </div>
    </aside>
  );
}
