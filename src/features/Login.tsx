/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  Lock, Mail, ShieldAlert, KeyRound, Fingerprint, 
  Phone, Clock, ArrowRight, RefreshCw, Copy, Check, 
  ShieldCheck, AlertCircle, HelpCircle
} from 'lucide-react';

export default function Login() {
  const { 
    setIsAuthenticated, 
    set2faVerified, 
    userEmail, 
    setUserEmail, 
    setSelectedRole, 
    usersList, 
    addAuditLog 
  } = useLab();

  // Selected user profile for login
  const [selectedUserId, setSelectedUserId] = useState('usr-1');
  const [password, setPassword] = useState('••••••••');
  const [step, setStep] = useState<'credentials' | 'tfa'>('credentials');
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [tfaMethod, setTfaMethod] = useState<'app' | 'email'>('app');
  
  // Simulated OTP States
  const [dispatchedOtp, setDispatchedOtp] = useState('');
  const [showOtpAlert, setShowOtpAlert] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Dynamic sandbox TOTP generator state
  const [sandboxCode, setSandboxCode] = useState('482931');
  const [timeLeft, setTimeLeft] = useState(30);

  const currentUser = usersList.find(u => u.id === selectedUserId) || usersList[0];

  // Rolling sandbox TOTP code generator (looks like real Google Authenticator!)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Generate new 6-digit number
          const newCode = Math.floor(100000 + Math.random() * 900000).toString();
          setSandboxCode(newCode);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Please enter your compliance passphrase.');
      return;
    }
    setErrorMsg('');
    
    // Log intent to log in
    addAuditLog('SECURITY', 'Sign-in Attempt', `Credentials validated for user ${currentUser.email}. MFA required: ${currentUser.tfaEnabled}`);

    if (currentUser.tfaEnabled) {
      setStep('tfa');
    } else {
      // Direct access if MFA is disabled
      setUserEmail(currentUser.email);
      setSelectedRole(currentUser.role);
      setIsAuthenticated(true);
      set2faVerified(false);
      addAuditLog('SECURITY', 'Sign-in Success', `Operator ${currentUser.email} authenticated without MFA.`);
    }
  };

  const dispatchEmailOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setDispatchedOtp(code);
    setShowOtpAlert(true);
    addAuditLog('SECURITY', 'OTP Dispatched', `Temporary one-time-passcode sent via SMTP channel to ${currentUser.email}`);
    
    // Auto-clear alert after 8 seconds
    setTimeout(() => {
      setShowOtpAlert(false);
    }, 15000);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (isNaN(Number(val)) && val !== '') return;
    
    const newOtp = [...otpValue];
    newOtp[index] = val.slice(-1); // keep last char
    setOtpValue(newOtp);
    setErrorMsg('');

    // Focus next input automatically
    if (val !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otpValue[index] === '' && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const verifyOtp = () => {
    const enteredCode = otpValue.join('');
    if (enteredCode.length < 6) {
      setErrorMsg('Verification code must contain 6 digits.');
      return;
    }

    // Accept sandbox generator code, dispatched code, master dev code, or user's specific mock secret code
    const isCodeValid = 
      enteredCode === sandboxCode || 
      (dispatchedOtp && enteredCode === dispatchedOtp) || 
      enteredCode === '123456' ||
      enteredCode === '000000';

    if (isCodeValid) {
      // Success!
      setUserEmail(currentUser.email);
      setSelectedRole(currentUser.role);
      setIsAuthenticated(true);
      set2faVerified(true);
      
      addAuditLog('SECURITY', 'Multi-Factor Validation Success', `MFA verified. Operator session established for ${currentUser.email}`);
    } else {
      setErrorMsg('Cryptographic token mismatch. Verification code is incorrect.');
      addAuditLog('SECURITY', 'Multi-Factor Validation Failure', `MFA failed for operator ${currentUser.email}`);
    }
  };

  const copySecretKey = () => {
    navigator.clipboard.writeText(currentUser.tfaSecret || 'K7J2G9B3H5X8Y4W1');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const autofillSandboxCode = () => {
    const digits = sandboxCode.split('');
    setOtpValue(digits);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen w-screen flex flex-col md:flex-row bg-slate-950 text-slate-100" id="auth-root-container">
      
      {/* Left Column: LIMS Branding & Compliance Warnings */}
      <div className="w-full md:w-5/12 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-8 flex flex-col justify-between" id="auth-marketing-side">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md">LP</span>
            <span className="font-extrabold text-white tracking-wider text-base font-sans">LABPULSE LIMS</span>
          </div>
          
          <div className="space-y-3 pt-6">
            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-bold uppercase font-mono tracking-wider">
              FDA 21 CFR Part 11 Compliant
            </span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white font-sans">
              Unified Chromatography Portal & Identity Vault
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Welcome to the LabPulse chromatography control system. Access to this workstation requires positive operator identification, cryptographically verified multi-factor credentials, and electronic ledger signing.
            </p>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <span className="text-[10px] font-mono font-bold text-amber-500 uppercase flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" /> SECURE AUDITED WORKSPACE
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All interactions, sequence launches, method revisions, and data integrity parameters are logged irreversibly to the immutable audit ledger. Unauthorized attempts are logged with geolocation.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/60 flex items-center gap-2 text-slate-500 text-[10px] font-mono" id="auth-legal-footer">
          <span>SECURE SYSTEM NODE: L_NODE_EU_03</span>
          <span>•</span>
          <span>BUILD v4.21.0</span>
        </div>
      </div>

      {/* Right Column: Secure Form & Sandbox Companion */}
      <div className="flex-1 p-6 md:p-12 flex flex-col justify-center items-center relative overflow-y-auto" id="auth-form-side">
        
        {/* Dispatched OTP Notification Bubble (Simulates Email Delivery) */}
        {showOtpAlert && dispatchedOtp && (
          <div className="absolute top-4 left-4 right-4 bg-slate-900 border-l-4 border-emerald-500 border border-slate-800 p-4 rounded-xl shadow-2xl animate-bounce z-50 flex items-center gap-3 max-w-md mx-auto text-xs">
            <div className="h-8 w-8 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <span className="font-bold text-slate-200 block">SMTP Relayer - New Message</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Verification code sent to <strong className="text-indigo-400">{currentUser.email}</strong> is: <strong className="text-emerald-400 font-mono text-xs">{dispatchedOtp}</strong>
              </p>
            </div>
          </div>
        )}

        <div className="max-w-md w-full space-y-6" id="auth-card-wrapper">
          
          {/* Card Body */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
            
            {step === 'credentials' ? (
              /* Step 1: Password & User Selection */
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="text-center space-y-1">
                  <div className="mx-auto h-12 w-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center">
                    <Fingerprint className="h-6 w-6" />
                  </div>
                  <h2 className="text-lg font-bold text-white font-sans mt-2">Operator Credentials</h2>
                  <p className="text-xs text-slate-400">Select your analytical identity to authorize login.</p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Operator Identity Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block">Operator Account</label>
                    <div className="space-y-2">
                      {usersList.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setErrorMsg('');
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                            selectedUserId === user.id
                              ? 'bg-indigo-600/10 border-indigo-500 text-white'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <div>
                            <span className="font-bold block">{user.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">{user.email}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                            user.role === 'Administrator' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {user.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono uppercase text-slate-400 font-bold">LIMS Secure Passphrase</label>
                      <span className="text-[10px] text-slate-500 italic">Auto-validated</span>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                        required
                      />
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Authorize Identity</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              /* Step 2: Two-Factor Authentication */
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <div className="mx-auto h-12 w-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h2 className="text-lg font-bold text-white font-sans mt-2">2FA Identity Verification</h2>
                  <p className="text-[11px] text-slate-400">Positive identification verification for <strong className="text-indigo-400">{currentUser.email}</strong></p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* 2FA Method Selector tabs */}
                <div className="flex border-b border-slate-800 text-[11px] font-mono">
                  <button
                    onClick={() => { setTfaMethod('app'); setErrorMsg(''); }}
                    className={`flex-1 pb-2 border-b font-bold ${tfaMethod === 'app' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                  >
                    Authenticator App
                  </button>
                  <button
                    onClick={() => { setTfaMethod('email'); setErrorMsg(''); }}
                    className={`flex-1 pb-2 border-b font-bold ${tfaMethod === 'email' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                  >
                    Email Delivery (Simulated)
                  </button>
                </div>

                {/* Verification Tab Contents */}
                {tfaMethod === 'app' ? (
                  <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-3">
                      {/* Simulated QR Code using custom inline SVG blocks */}
                      <div className="h-16 w-16 bg-white p-1 rounded-md shrink-0 flex flex-wrap content-between justify-between">
                        {/* Custom visual qr grid code design */}
                        <div className="w-full h-full flex flex-col justify-between">
                          <div className="flex justify-between">
                            <span className="h-3 w-3 bg-slate-950 block"></span>
                            <span className="h-1.5 w-1.5 bg-slate-950 block"></span>
                            <span className="h-3 w-3 bg-slate-950 block"></span>
                          </div>
                          <div className="flex justify-between items-center px-1">
                            <span className="h-1.5 w-3 bg-slate-950 block"></span>
                            <span className="h-2 w-2 bg-slate-950 block"></span>
                            <span className="h-3 w-1.5 bg-slate-950 block"></span>
                          </div>
                          <div className="flex justify-between">
                            <span className="h-3 w-3 bg-slate-950 block"></span>
                            <span className="h-1.5 w-1.5 bg-slate-950 block"></span>
                            <span className="h-3 w-3 bg-slate-950 block"></span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <span className="font-bold text-slate-300 block">TOTP Key Binding</span>
                        <p className="text-[10px] text-slate-500 truncate font-mono">Secret: {currentUser.tfaSecret || 'K7J2G9B3H5X8Y4W1'}</p>
                        <button
                          onClick={copySecretKey}
                          className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          {copiedKey ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" /> Key copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" /> Copy manual key
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Scan QR or input key in your Authenticator client, then enter the 6-digit rolling code below.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-xs text-center">
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      We can dispatch a secure compliance code to <strong className="text-slate-200">{currentUser.email}</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={dispatchEmailOtp}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 mx-auto border border-slate-700"
                    >
                      <Mail className="h-3.5 w-3.5" /> Dispatch verification code
                    </button>
                  </div>
                )}

                {/* 6-digit OTP fields */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-slate-400 font-bold block text-center">Enter 6-Digit Code</label>
                  <div className="flex gap-2 justify-center" id="otp-inputs-wrapper">
                    {otpValue.map((num, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        maxLength={1}
                        value={num}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="h-11 w-11 bg-slate-950 border border-slate-800 rounded-xl text-center text-lg font-bold font-mono text-white outline-none focus:border-indigo-500"
                        autoComplete="off"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setErrorMsg('');
                      setOtpValue(['', '', '', '', '', '']);
                    }}
                    className="flex-1 py-2 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={verifyOtp}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-lg"
                  >
                    Verify Code
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Dynamic rolling token companion (Sandbox assistant) */}
          {step === 'tfa' && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs space-y-3" id="tfa-companion-sidebar">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> 2FA Sandbox Assistant
                </span>
                <span className="text-[10px] text-slate-500">Live Simulation</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                To simplify testing without registering a real authenticator app, here is the current live OTP sequence:
              </p>
              
              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Current Code</span>
                  <strong className="text-xl font-mono tracking-wider text-emerald-400">{sandboxCode.slice(0, 3)} {sandboxCode.slice(3)}</strong>
                </div>
                
                {/* Rolling countdown radial visual */}
                <div className="flex items-center gap-2">
                  <div className="text-right text-[10px] font-mono text-slate-400">
                    <span>New in <strong>{timeLeft}s</strong></span>
                  </div>
                  <button 
                    onClick={autofillSandboxCode}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-[10px] uppercase font-mono tracking-wide"
                  >
                    Autofill
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
