/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  Activity, ShieldAlert, CheckCircle, Thermometer, 
  Droplet, Gauge, Flame, RefreshCw, Zap, Bell, Clock 
} from 'lucide-react';

export default function Health() {
  const { instruments, activeInstrumentId, setActiveInstrumentId, notifications } = useLab();

  // Find currently focused instrument
  const inst = instruments.find(i => i.id === activeInstrumentId) || instruments[0];

  // Specific telemetry values
  const pressure = inst.sensorData.pressure;
  const flowRate = inst.sensorData.flowRate;
  const temp = inst.sensorData.temperature;
  const signal = inst.sensorData.detectorSignal;

  // Max thresholds based on type
  const maxPressure = inst.type === 'HPLC' ? 400 : inst.type === 'UHPLC' ? 1200 : 150;
  const targetFlow = inst.status === 'RUNNING' ? (inst.type === 'GC' ? 2.5 : 1.2) : 0;
  const targetTemp = inst.status === 'RUNNING' ? (inst.type === 'GC' ? 120 : 35) : 21;

  // Percentages for Gauges
  const pressurePercent = Math.min(100, Math.round((pressure / maxPressure) * 100));
  const tempPercent = Math.min(100, Math.round((temp / targetTemp) * 100 || 50));

  // Determine pump seals and leak status
  const pumpSealsHealth = inst.healthScore;
  const leakDetected = inst.status === 'ERROR' && inst.id === 'inst-06'; // Thermo Vanquish has leak/error simulated
  const lampRemainingPercent = Math.max(0, Math.round(((3000 - inst.lampHours) / 3000) * 100));

  // Circular gauge calculations
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pressurePercent / 100) * circumference;

  return (
    <div className="space-y-6" id="health-scada-module">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <Gauge className="text-indigo-600 h-6 w-6" />
            SCADA Instrument Health & Diagnostics
          </h1>
          <p className="text-xs text-slate-500">Real-time pump pressure, seal wear-rates, and sensor diagnostics.</p>
        </div>
        
        {/* Quick selector dropdown */}
        <div className="flex items-center gap-1.5 mt-3 md:mt-0">
          <span className="text-xs text-slate-400 font-mono">Diagnostics node:</span>
          <select
            value={activeInstrumentId}
            onChange={(e) => setActiveInstrumentId(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 bg-white font-mono font-semibold text-slate-700 outline-none"
          >
            {instruments.map(i => (
              <option key={i.id} value={i.id}>{i.type}: {i.name.split(' (')[1]?.replace(')', '') || i.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main SCADA Control Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="scada-dashboard-grid">
        
        {/* Left Card: Pressure & Temperature gauges */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between" id="pressure-gauge-scada">
          <div>
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Pump Pressure Monitoring</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time transducer load cell feed</p>
          </div>

          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative h-40 w-40">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle 
                  cx="80" cy="80" r={radius} 
                  stroke="#f1f5f9" strokeWidth={strokeWidth} 
                  fill="transparent" 
                />
                {/* Foreground value circle */}
                <circle 
                  cx="80" cy="80" r={radius} 
                  stroke={inst.status === 'ERROR' ? '#ef4444' : '#6366f1'} 
                  strokeWidth={strokeWidth} 
                  fill="transparent" 
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold font-mono text-slate-900">{pressure.toFixed(1)}</span>
                <span className="text-[10px] text-slate-400 font-mono uppercase">{inst.type === 'GC' ? 'psi' : 'bar'}</span>
              </div>
            </div>
            
            <div className="text-center text-xs text-slate-500 max-w-xs px-4">
              Safe operating threshold for this {inst.type} column is configured at <span className="font-semibold text-slate-700">{maxPressure} {inst.type === 'GC' ? 'psi' : 'bar'}</span>.
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Transducer Feed Status</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <Zap className="h-3 w-3" /> Online & Responsive
            </span>
          </div>
        </div>

        {/* Center Card: SCADA Sensor Grid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between" id="scada-sensor-grid">
          <div>
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">LIMS Sensor Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time environmental & chemical sensors</p>
          </div>

          <div className="grid grid-cols-2 gap-4 my-6">
            {/* Sensor 1: Column Oven */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-slate-400">Column Oven</span>
                <Thermometer className="h-4 w-4 text-rose-500" />
              </div>
              <p className="text-base font-bold font-mono text-slate-800">{temp.toFixed(1)}°C</p>
              <p className="text-[10px] text-slate-400">Target: {targetTemp}°C</p>
            </div>

            {/* Sensor 2: Liquid leak sensor */}
            <div className={`p-3 rounded-xl border space-y-1 ${
              leakDetected 
                ? 'bg-rose-50 border-rose-200 text-rose-800' 
                : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-slate-400">Leak Sensor</span>
                <Droplet className={`h-4 w-4 ${leakDetected ? 'text-rose-500 animate-bounce' : 'text-slate-400'}`} />
              </div>
              <p className="text-base font-bold font-mono text-slate-800">{leakDetected ? 'ALARM ACTIVE' : 'DRY'}</p>
              <p className="text-[10px] text-slate-400">{leakDetected ? 'Solvent pooling' : 'No moisture detected'}</p>
            </div>

            {/* Sensor 3: Proportioning Pump Seals */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-slate-400">Pump Seal Wear</span>
                <RefreshCw className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-base font-bold font-mono text-slate-800">{pumpSealsHealth}%</p>
              <p className="text-[10px] text-slate-400">Rating: Excellent</p>
            </div>

            {/* Sensor 4: Detector Lamp/Column Lifetime */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-slate-400">Lamp Lifetime</span>
                <Flame className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-base font-bold font-mono text-slate-800">{lampRemainingPercent}%</p>
              <p className="text-[10px] text-slate-400">{3000 - inst.lampHours} hrs remaining</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Maintenance Countdown</span>
            <span className={`font-semibold ${inst.maintenanceCountdown >= 15 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {inst.maintenanceCountdown >= 0 ? `${inst.maintenanceCountdown} days left` : 'OVERDUE FOR SERVICE'}
            </span>
          </div>
        </div>

        {/* Right Card: Alarm logs & Notifications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between" id="scada-alarm-logs">
          <div>
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">SCADA System Alarm History</h3>
            <p className="text-xs text-slate-500 mt-0.5">Automated safety relay shutdowns</p>
          </div>

          <div className="my-4 space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
            {notifications.filter(n => n.type === 'ALERT' || n.type === 'WARNING').map(notif => (
              <div key={notif.id} className="p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 text-[11px] space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1">
                    <Bell className="h-3 w-3 text-rose-500" /> {notif.title}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">{notif.timestamp}</span>
                </div>
                <p className="opacity-90 leading-tight">{notif.message}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Safety interlock loop status</span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold font-mono text-[10px] rounded">
              FAIL-SAFE RE-ARMED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
