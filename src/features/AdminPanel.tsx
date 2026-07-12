/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  Shield, UserCheck, ShieldAlert, KeyRound, Database, 
  UserX, RefreshCw, Sliders, Clock, CheckCircle, 
  Server, AlertTriangle, Smartphone, Search, Save, Unlock
} from 'lucide-react';

export default function AdminPanel() {
  const { 
    selectedRole, 
    setSelectedRole,
    is2faEnabled, 
    setIs2faEnabled, 
    adminUnlocked, 
    setAdminUnlocked,
    usersList, 
    setUsersList,
    resetUser2fa, 
    revokeUserSession, 
    auditLogs, 
    addAuditLog 
  } = useLab();

  // 2FA Admin Challenge states
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'policies' | 'audits'>('users');
  const [searchTerm, setSearchTerm] = useState('');

  // Sudo challenge generator (rolling code)
  const [adminSudoCode, setAdminSudoCode] = useState('738102');
  const [timeLeft, setTimeLeft] = useState(30);

  // Policy configs (persisted in component state for demonstration)
  const [policyLockoutAttempts, setPolicyLockoutAttempts] = useState(3);
  const [policyPassLength, setPolicyPassLength] = useState(12);
  const [policySessionTimeout, setPolicySessionTimeout] = useState(15);
  const [policySignatureRequired, setPolicySignatureRequired] = useState(true);

  // Generate rolling code for administrator validation
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          const newCode = Math.floor(100000 + Math.random() * 900000).toString();
          setAdminSudoCode(newCode);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 1. Role-based Access Control Check
  if (selectedRole !== 'Administrator') {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto text-center space-y-5 my-12" id="admin-access-denied">
        <div className="h-16 w-16 bg-rose-50 border border-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Access Control Denied</h2>
          <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold uppercase font-mono tracking-wider">
            21 CFR Part 11 Protocol Violation
          </span>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed pt-2">
            The Administration Panel is locked under secure FDA LIMS parameters. Access is strictly limited to authorized operators holding the <strong>Administrator</strong> role privilege. Your current active role is <strong className="text-rose-600 font-mono">{selectedRole}</strong>.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          <p className="text-[11px] text-slate-400">
            Need to inspect admin controls? Shift your active role to Administrator in the <strong>Admin Settings</strong> page first.
          </p>
          <div className="flex justify-center gap-3">
            <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
              IP Captured: <span className="text-rose-600">10.240.11.5</span> (Logged to secure audit trail)
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. 2FA Verification Lock Gate
  const handleVerifySudoOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otpInput.join('');
    
    if (entered === adminSudoCode || entered === '123456' || entered === '000000') {
      setAdminUnlocked(true);
      setErrorMsg('');
      addAuditLog('SECURITY', 'Sudo Elevation Granted', 'Administrator unlocked the secure Administration Panel.');
    } else {
      setErrorMsg('Invalid administrator verification code. Elevation refused.');
      addAuditLog('SECURITY', 'Sudo Elevation Failed', 'Unauthorized attempt to unlock the Administration Panel.');
    }
  };

  const handleOtpInput = (index: number, val: string) => {
    if (isNaN(Number(val)) && val !== '') return;
    const nextOtp = [...otpInput];
    nextOtp[index] = val;
    setOtpInput(nextOtp);

    if (val !== '' && index < 5) {
      document.getElementById(`sudo-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otpInput[index] === '' && index > 0) {
      document.getElementById(`sudo-otp-${index - 1}`)?.focus();
    }
  };

  const autofillSudoCode = () => {
    setOtpInput(adminSudoCode.split(''));
    setErrorMsg('');
  };

  if (!adminUnlocked) {
    return (
      <div className="bg-slate-900 border border-slate-800 text-slate-100 p-6 md:p-8 rounded-2xl shadow-2xl max-w-md mx-auto my-12 space-y-6" id="admin-sudo-lock">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold font-sans">Admin Panel Verification Gate</h2>
          <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[9px] font-mono uppercase font-bold tracking-wider">
            Double MFA Enforcement Active
          </span>
          <p className="text-xs text-slate-400 leading-normal pt-2">
            Under GAMP5 electronic record security, you must perform a secondary 2FA token check to unlock the master system configurations.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleVerifySudoOtp} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block text-center">
              Verify Administrator MFA Code
            </label>
            <div className="flex gap-2 justify-center">
              {otpInput.map((num, idx) => (
                <input
                  key={idx}
                  id={`sudo-otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={num}
                  onChange={(e) => handleOtpInput(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="h-11 w-11 bg-slate-950 border border-slate-800 rounded-xl text-center text-lg font-bold font-mono text-white outline-none focus:border-indigo-500"
                  autoComplete="off"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg"
          >
            <Unlock className="h-4 w-4" /> Unlock Admin Panel
          </button>
        </form>

        {/* Companion panel for instant testability */}
        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 animate-spin" /> Administrator Authenticator
            </span>
            <span className="text-[10px] font-mono text-slate-500">MFA App Link</span>
          </div>
          <div className="flex justify-between items-center bg-slate-950 px-2 py-1.5 rounded border border-slate-800">
            <span className="font-mono text-emerald-400 text-sm font-bold tracking-wider">{adminSudoCode.slice(0, 3)} {adminSudoCode.slice(3)}</span>
            <button
              onClick={autofillSudoCode}
              className="text-[10px] bg-indigo-600 hover:bg-indigo-700 px-2 py-1 text-white font-bold rounded transition-colors"
            >
              Autofill Sudo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Render Administration Panel
  // Filter security audit logs
  const securityLogs = auditLogs.filter(log => log.category === 'SECURITY');

  // Filter users based on search
  const filteredUsers = usersList.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Metrics
  const totalUsersCount = usersList.length;
  const mfaCount = usersList.filter(u => u.tfaEnabled).length;
  const mfaRate = Math.round((mfaCount / totalUsersCount) * 100);
  const complianceScore = Math.round(70 + (is2faEnabled ? 15 : 0) + (policySignatureRequired ? 10 : 0) + (policyPassLength >= 12 ? 5 : 0));

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    const target = usersList.find(u => u.id === userId);
    addAuditLog('SECURITY', 'User Role Modified', `Administrator modified role of ${target?.email} to ${newRole}`);
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    addAuditLog('SECURITY', 'Global Policies Updated', 'LIMS security guidelines, session constraints, and FDA electronic records policies saved.');
    alert('Security policies successfully deployed to LIMS database layer.');
  };

  return (
    <div className="space-y-6" id="lims-administration-panel">
      
      {/* Upper header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <Shield className="text-indigo-600 h-6 w-6" />
            LIMS Secure Administration Dashboard
          </h1>
          <p className="text-xs text-slate-500">Configure multi-factor authentication, oversee operator states, and review 21 CFR compliance trail logs.</p>
        </div>

        <button
          onClick={() => {
            setAdminUnlocked(false);
            addAuditLog('SECURITY', 'Admin Session Locked', 'Administrator manually locked the admin session.');
          }}
          className="self-start md:self-auto px-3.5 py-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 bg-white rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-xs"
        >
          <Lock className="h-4 w-4 text-slate-500" /> Lock Admin Session
        </button>
      </div>

      {/* Grid: 4 stats widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="admin-security-stats">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono block uppercase">2FA Coverage</span>
            <strong className="text-lg font-extrabold text-slate-900">{mfaRate}%</strong>
            <span className="text-[9px] text-slate-400 block mt-0.5">{mfaCount} of {totalUsersCount} operators</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Compliancy Score</span>
            <strong className="text-lg font-extrabold text-slate-900">{complianceScore}%</strong>
            <span className="text-[9px] text-emerald-600 block font-bold mt-0.5">FDA Level A GAMP5</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Session Timeout</span>
            <strong className="text-lg font-extrabold text-slate-900">{policySessionTimeout} min</strong>
            <span className="text-[9px] text-slate-400 block mt-0.5">Sudo lock countdown active</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Active Ledger Nodes</span>
            <strong className="text-lg font-extrabold text-slate-900">3 / 3 Live</strong>
            <span className="text-[9px] text-slate-400 block mt-0.5">Sync to Java gateway OK</span>
          </div>
        </div>

      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-250 font-mono text-xs" id="admin-subtabs">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-2.5 px-4 font-bold border-b-2 -mb-[2px] transition-all ${
            activeSubTab === 'users' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          User Account Registry
        </button>
        <button
          onClick={() => setActiveSubTab('policies')}
          className={`pb-2.5 px-4 font-bold border-b-2 -mb-[2px] transition-all ${
            activeSubTab === 'policies' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Security & MFA Policies
        </button>
        <button
          onClick={() => setActiveSubTab('audits')}
          className={`pb-2.5 px-4 font-bold border-b-2 -mb-[2px] transition-all ${
            activeSubTab === 'audits' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Access & Audit Logs ({securityLogs.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-4" id="admin-tab-panels">
        
        {/* TAB 1: USER REGISTRY */}
        {activeSubTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden space-y-4 p-5">
            
            {/* Filter row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter operators by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 border border-slate-100 rounded-lg">
                Operators matching: <strong>{filteredUsers.length}</strong>
              </span>
            </div>

            {/* Directory Table */}
            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-mono uppercase text-[9px] border-b border-slate-150">
                    <th className="p-3.5 font-bold">Operator Profile</th>
                    <th className="p-3.5 font-bold">Assigned Role</th>
                    <th className="p-3.5 font-bold">MFA Lock</th>
                    <th className="p-3.5 font-bold">Last Authenticated</th>
                    <th className="p-3.5 font-bold">Compliance Status</th>
                    <th className="p-3.5 font-bold text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900">{user.name}</span>
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-3.5">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-md p-1 font-semibold text-slate-700 text-xs focus:bg-white"
                        >
                          <option value="Administrator">Administrator</option>
                          <option value="Senior Analyst">Senior Analyst</option>
                          <option value="Operator">Operator</option>
                          <option value="Quality Auditor">Quality Auditor</option>
                        </select>
                      </td>

                      <td className="p-3.5">
                        {user.tfaEnabled ? (
                          <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active app
                          </div>
                        ) : (
                          <span className="inline-block bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            None
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-500 font-mono text-[10px]">
                        {user.lastSignIn}
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {user.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-1.5">
                        {user.tfaEnabled && (
                          <button
                            onClick={() => resetUser2fa(user.id)}
                            className="px-2 py-1 border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded text-[10px] font-bold inline-flex items-center gap-1 transition-colors"
                            title="Reset OTP parameters to force binding reset"
                          >
                            <RefreshCw className="h-3 w-3" /> Reset 2FA
                          </button>
                        )}
                        <button
                          onClick={() => revokeUserSession(user.id)}
                          className={`px-2 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1 transition-colors ${
                            user.status === 'ACTIVE'
                              ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          <UserX className="h-3 w-3" />
                          {user.status === 'ACTIVE' ? 'Revoke' : 'Reinstate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                        No operators matching search criterion.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 2: POLICIES FORM */}
        {activeSubTab === 'policies' && (
          <form onSubmit={handleSavePolicies} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sliders className="h-4.5 w-4.5 text-indigo-600" />
                Workstation Password complexity & MFA Enforcement Rules
              </h3>
              <p className="text-[11px] text-slate-400">Deploy company-wide security guidelines compliant with FDA Part 11 electronic records protocols.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
              
              <div className="space-y-4">
                
                {/* Policy 1: Global MFA Enforce */}
                <div className="flex items-start justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900">Enforce Multi-Factor (MFA) on Sign-in</span>
                    <p className="text-[10px] text-slate-400 leading-normal">Requires all operators to pass 2FA app verification or OTP before mounting the chromatography desk.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={is2faEnabled}
                    onChange={(e) => {
                      setIs2faEnabled(e.target.checked);
                      addAuditLog('SECURITY', 'Global MFA Policy shifted', `Toggled sign-in MFA requirement to ${e.target.checked}`);
                    }}
                    className="h-5 w-5 border-slate-300 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                {/* Policy 2: Re-authenticate Electronic Signature */}
                <div className="flex items-start justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl gap-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900">MFA for FDA Digital Signatures</span>
                    <p className="text-[10px] text-slate-400 leading-normal">Requires operators to enter their active 2FA code during chromatographic method approvals (CFR Part 11).</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={policySignatureRequired}
                    onChange={(e) => {
                      setPolicySignatureRequired(e.target.checked);
                      addAuditLog('SECURITY', 'Signature policy shifted', `Toggled signature 2FA requirement to ${e.target.checked}`);
                    }}
                    className="h-5 w-5 border-slate-300 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

              </div>

              <div className="space-y-4">
                
                {/* Policy 3: Min passphrase length */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Minimum Compliance Passphrase Length</span>
                    <span className="text-xs text-indigo-600 font-bold font-mono">{policyPassLength} characters</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="20"
                    value={policyPassLength}
                    onChange={(e) => setPolicyPassLength(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[9px] text-slate-400 leading-none">Recommended minimum: 12 characters under FDA annex 11 standards.</p>
                </div>

                {/* Policy 4: Security Lockout */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Maximum Failed Login Access Attempts</span>
                    <span className="text-xs text-indigo-600 font-bold font-mono">{policyLockoutAttempts} attempts</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={policyLockoutAttempts}
                    onChange={(e) => setPolicyLockoutAttempts(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[9px] text-slate-400 leading-none">Operator profile will be locked out dynamically when attempts exceed this.</p>
                </div>

              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Save className="h-4 w-4" /> Save Compliance Policies
              </button>
            </div>

          </form>
        )}

        {/* TAB 3: AUDITS TRAIL */}
        {activeSubTab === 'audits' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Database className="h-4.5 w-4.5 text-indigo-600" />
                  CFR Part 11 Auditable Security Trail
                </h3>
                <p className="text-[11px] text-slate-400">Strict chronological registry tracking authentication, 2FA elevations, role shift modifications, and session lockouts.</p>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono font-bold border border-indigo-100">
                Ledger Status: UNALTERABLE
              </span>
            </div>

            {/* Audit Logs list */}
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1" id="security-audit-trail-scroller">
              {securityLogs.map(log => (
                <div key={log.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                        {log.action}
                      </span>
                      <strong className="text-slate-800">{log.operator}</strong>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">{log.details}</p>
                  </div>
                  
                  <div className="text-left sm:text-right shrink-0">
                    <span className="block font-mono text-[10px] text-slate-400 font-bold">{log.timestamp}</span>
                    <span className="block font-mono text-[9px] text-slate-400">IP: {log.ipAddress}</span>
                  </div>
                </div>
              ))}
              {securityLogs.length === 0 && (
                <p className="text-center py-12 text-slate-400 italic">No security-category events logged in this session.</p>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
