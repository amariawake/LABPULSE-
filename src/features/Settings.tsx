/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLab } from '../contexts/LabContext';
import { Settings, Shield, Key, Eye, User, Building, Moon, Sun } from 'lucide-react';

export default function SettingsView() {
  const { selectedRole, setSelectedRole, selectedLabId, setSelectedLabId, labs, addAuditLog } = useLab();
  
  const [apiKey, setApiKey] = useState('lp_live_8391209381029382103982');
  const [showKey, setShowKey] = useState(false);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
    // Standard visual feedback
    const htmlEl = document.documentElement;
    if (htmlEl) {
      if (!isDarkMode) {
        htmlEl.classList.add('dark');
        addAuditLog('SYSTEM', 'Theme Toggle', 'Flipped system visual layout to Dark mode');
      } else {
        htmlEl.classList.remove('dark');
        addAuditLog('SYSTEM', 'Theme Toggle', 'Flipped system visual layout to Light mode');
      }
    }
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    addAuditLog('SECURITY', 'API Keys rotatated', 'Updated and signed new labpulse API gateway key');
  };

  return (
    <div className="space-y-6" id="settings-module">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
          <Settings className="text-indigo-600 h-6 w-6" />
          Laboratory Administration & LIMS Settings
        </h1>
        <p className="text-xs text-slate-500">Configure OAuth credentials, select default analytical roles, and toggle dark/light theme parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="settings-grid">
        
        {/* Left Column: Visual Options & Role Switching (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Theme & Visual Options */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sun className="h-4 w-4 text-indigo-500" /> System Visual Preferences
            </h3>
            <p className="text-xs text-slate-500">Adjust the visual density and theme parameters of your LabPulse chromatography terminal.</p>
            
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
              <div>
                <span className="font-bold text-slate-800">Visual Mode Switcher</span>
                <p className="text-slate-400 text-[11px] mt-0.5">Toggle between crisp Light mode and dark Bloomberg/SCADA interfaces.</p>
              </div>
              <button 
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="h-4 w-4 text-amber-500" /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-indigo-600" /> Dark SCADA Mode
                  </>
                )}
              </button>
            </div>
          </div>

          {/* User Role Switching */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-indigo-500" /> LIMS User Privileges & Role
            </h3>
            <p className="text-xs text-slate-500">Select your active role to simulate compliance permissions under FDA guidelines.</p>
            
            <div className="grid grid-cols-2 gap-3" id="roles-selectors">
              {['Administrator', 'Senior Analyst', 'Operator', 'Quality Auditor'].map(role => (
                <button
                  key={role}
                  onClick={() => {
                    setSelectedRole(role);
                    addAuditLog('SECURITY', 'User Privilege Shifted', `Operator shifted role to ${role}`);
                  }}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    selectedRole === role
                      ? 'border-indigo-500 bg-indigo-50/30 font-bold text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-slate-900 font-semibold">{role}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {role === 'Administrator' ? 'Full access, rotate keys, add hardware' : 
                     role === 'Senior Analyst' ? 'Approve methods, build sequences' : 
                     role === 'Operator' ? 'Log samples, run workstation baseline checks' : 
                     'View-only compliance audit trail access'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: LIMS API Credentials (1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between" id="lims-keys-panel">
          <form onSubmit={handleSaveKeys} className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Key className="h-4 w-4 text-indigo-500" />
              Kafka / LIMS API Keys
            </h3>
            <p className="text-xs text-slate-500">Provide credentials to map this interface to Java Spring Boot microservices later.</p>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">LabPulse LIMS Client Secret</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full p-2 pr-9 border border-slate-200 rounded bg-slate-50 font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 transition-colors"
            >
              Rotate & Sign Secret
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400 space-y-1.5">
            <span className="font-bold text-slate-500 block uppercase font-mono">Gateway Connection URL</span>
            <p className="font-mono text-slate-700">wss://api.labpulse.enterprise/ws/v1</p>
          </div>
        </div>

      </div>
    </div>
  );
}
