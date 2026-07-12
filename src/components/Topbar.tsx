/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  Bell, Search, Command, Check, AlertTriangle, 
  Settings, User, HelpCircle, Shield 
} from 'lucide-react';

interface TopbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Topbar({ activeTab, setActiveTab }: TopbarProps) {
  const { notifications, setNotifications, selectedRole, labs, selectedLabId, userEmail, usersList } = useLab();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
 
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
 
  const activeLab = labs.find(l => l.id === selectedLabId) || labs[0];
 
  // Find current user object to render dynamic details
  const currentUserObj = usersList.find(u => u.email === userEmail);
  const displayName = currentUserObj ? currentUserObj.name : 'Alex Rivera';
  const initials = displayName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AR';

  // Map tabs to beautiful human labels
  const tabTitles: Record<string, string> = {
    dashboard: 'General Lab Dashboard',
    workstation: 'Chromatography Workstation',
    instruments: 'Instrument Asset Registry',
    health: 'SCADA Sensor Health Matrix',
    twin: 'Digital Twin Topology Diagram',
    samples: 'Sample Registration & Kanban Queue',
    methods: 'Assay Method Procedures Catalog',
    calibration: 'Standard Calibrations & QC',
    reports: 'GMP Compliance Certificate Reports',
    inventory: 'Chemicals & Consumables Inventory',
    calendar: 'Schedules & Preventative Bookings',
    audit: 'CFR Part 11 Compliance Audit Trail',
    insights: 'LabPulse AI Copilot Assistant',
    admin: 'Laboratory Administration & Access Control',
    settings: 'Laboratory Administration Settings'
  };

  // Keyboard shortcut CMD+K or CTRL+K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter commands for palette
  const commands = [
    { label: 'Go to Chromatography Workstation', id: 'workstation' },
    { label: 'Inspect SCADA Sensor Health Matrix', id: 'health' },
    { label: 'Check 21 CFR Part 11 Audit Trail', id: 'audit' },
    { label: 'Register New LIMS Chemical Sample', id: 'samples' },
    { label: 'Review Assay Methods Library', id: 'methods' },
    { label: 'Analyze standard calibrations curves', id: 'calibration' },
  ];

  const filteredCommands = commands.filter(c => 
    c.label.toLowerCase().includes(paletteSearch.toLowerCase())
  );

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="h-16 border-b border-slate-250 bg-white px-6 flex items-center justify-between shrink-0 no-print" id="lims-topbar">
      
      {/* Left: Breadcrumb Title */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-xs font-mono">Platform</span>
        <span className="text-slate-400 text-xs font-mono">/</span>
        <h2 className="text-xs font-bold text-slate-800 font-mono uppercase">{tabTitles[activeTab] || 'Dashboard'}</h2>
      </div>

      {/* Right: Actions Row */}
      <div className="flex items-center gap-4">
        
        {/* Command palette trigger */}
        <button 
          onClick={() => setShowPalette(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200/80 rounded-lg text-slate-400 text-[10px] hover:bg-slate-200/50 hover:text-slate-600 transition-all font-mono"
          title="Search Command Palette (CMD+K)"
        >
          <Search className="h-3.5 w-3.5" />
          <span>CMD+K search...</span>
        </button>

        {/* Notifications center trigger with badge */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              // reset unread count is fine, but let's just toggle
            }}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-colors relative"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-rose-600 rounded-full font-mono text-[9px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown list */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 bg-white border border-slate-250 rounded-xl shadow-xl w-72 z-50 overflow-hidden text-xs">
              <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between font-bold">
                <span className="text-slate-700">Lab Alerts & Alarms</span>
                <button 
                  onClick={markAllRead}
                  className="text-[10px] text-indigo-600 hover:underline font-semibold"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-50" id="notification-items-stage">
                {notifications.map(n => (
                  <div key={n.id} className={`p-3 space-y-1 ${n.read ? 'opacity-70' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                      <span>{n.message}</span>
                    </div>
                    <span className="block text-[9px] font-mono text-slate-400">{n.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Operator Badge summary */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4 text-xs">
          <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-extrabold shadow-sm font-sans">
            {initials}
          </div>
          <div className="hidden md:block">
            <span className="block font-bold text-slate-900">{displayName}</span>
            <span className="block text-[10px] text-indigo-600 font-mono font-bold leading-none">{selectedRole}</span>
          </div>
        </div>

      </div>

      {/* Command Palette Drawer (Modal) */}
      {showPalette && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-20 backdrop-blur-xs">
          <div className="bg-white border border-slate-250 rounded-2xl shadow-2xl max-w-lg w-full p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Type a screen or analytical action (e.g. Workstation, SCADA...)"
                value={paletteSearch}
                onChange={(e) => setPaletteSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-indigo-500"
                autoFocus
              />
              <button 
                onClick={() => setShowPalette(false)} 
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ESC
              </button>
            </div>

            <div className="space-y-1 text-xs max-h-48 overflow-y-auto" id="palette-filtered-commands">
              {filteredCommands.map(cmd => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    setActiveTab(cmd.id);
                    setShowPalette(false);
                    setPaletteSearch('');
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between text-slate-700 font-semibold"
                >
                  <span>{cmd.label}</span>
                  <span className="text-[10px] text-indigo-600 uppercase font-mono">Navigate ➔</span>
                </button>
              ))}
              {filteredCommands.length === 0 && (
                <p className="text-center py-6 text-slate-400 italic">No matching procedures or screens found.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </header>
  );
}
