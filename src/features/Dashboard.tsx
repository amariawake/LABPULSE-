/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  Play, Pause, AlertTriangle, CheckCircle, Activity, 
  Layers, Thermometer, Clock, RefreshCw, ChevronRight, User, Database
} from 'lucide-react';

export default function Dashboard({ onViewWorkstation }: { onViewWorkstation: (id: string) => void }) {
  const { 
    instruments, samples, qcResults, notifications, auditLogs, 
    completedRuns, selectedLabId, labs 
  } = useLab();

  // Filter based on selected laboratory
  const labInstruments = instruments.filter(i => i.laboratoryId === selectedLabId);
  const activeLab = labs.find(l => l.id === selectedLabId);

  // Status counters
  const runningCount = labInstruments.filter(i => i.status === 'RUNNING').length;
  const idleCount = labInstruments.filter(i => i.status === 'IDLE').length;
  const errorCount = labInstruments.filter(i => i.status === 'ERROR').length;
  const offlineCount = labInstruments.filter(i => i.status === 'OFFLINE').length;
  const maintCount = labInstruments.filter(i => i.status === 'MAINTENANCE').length;

  const totalRunsToday = completedRuns.length + runningCount;
  const totalSamples = samples.length;
  const qcPassedRate = qcResults.length > 0 
    ? Math.round((qcResults.filter(q => q.status === 'PASS').length / qcResults.length) * 100) 
    : 100;
  const averageHealthScore = labInstruments.length > 0
    ? Math.round(labInstruments.reduce((acc, i) => acc + i.healthScore, 0) / labInstruments.length)
    : 100;

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Upper Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900" id="dash-main-title">
            Laboratory Telemetry & LIMS Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time analytics for <span className="font-semibold text-slate-800">{activeLab?.name}</span> • LIMS Gateway Active
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            LIMS WebSocket Connected (10.240.11.82)
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Sync Time: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* KPI Stats Panel - Bloomberg/Siemens High-Density Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-panel">
        {/* Stat 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between" id="kpi-stat-runs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">Completed Runs Today</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-sans text-slate-900">{totalRunsToday}</span>
              <span className="text-xs font-medium text-emerald-600">+12% vs yesterday</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between" id="kpi-stat-samples">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">API Samples In Queue</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{totalSamples}</span>
              <span className="text-xs font-medium text-slate-500">{samples.filter(s => s.status === 'PENDING').length} awaiting prep</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(samples.filter(s => s.status === 'COMPLETED').length / totalSamples) * 100 || 50}%` }}></div>
            </div>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between" id="kpi-stat-qc">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">QC Suitability Rate</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{qcPassedRate}%</span>
              <span className="text-xs font-medium text-slate-500">Levy-Jennings compliant</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${qcPassedRate}%` }}></div>
            </div>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between" id="kpi-stat-health">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">Avg Instrument Health</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Thermometer className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{averageHealthScore}%</span>
              <span className="text-xs font-medium text-amber-600">6 instruments online</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${averageHealthScore}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Instrument State Grid */}
      <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-lg border border-slate-800" id="instrument-live-summary">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
              Instrument Status Center
            </h2>
            <p className="text-xs text-slate-400 mt-1">Direct live metrics monitoring HPLC, UHPLC, and GC gateways</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-0 text-xs">
            <span className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded">
              <span className="h-2 w-2 rounded-full bg-indigo-400"></span> {runningCount} Running
            </span>
            <span className="flex items-center gap-1.5 bg-slate-500/10 text-slate-300 border border-slate-500/20 px-2 py-1 rounded">
              <span className="h-2 w-2 rounded-full bg-slate-400"></span> {idleCount} Idle
            </span>
            <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-1 rounded">
              <span className="h-2 w-2 rounded-full bg-amber-400"></span> {maintCount} Maintenance
            </span>
            <span className="flex items-center gap-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-1 rounded">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse"></span> {errorCount} Error
            </span>
            <span className="flex items-center gap-1.5 bg-zinc-500/10 text-zinc-300 border border-zinc-500/20 px-2 py-1 rounded">
              <span className="h-2 w-2 rounded-full bg-zinc-400"></span> {offlineCount} Offline
            </span>
          </div>
        </div>

        {/* Live Status Cards - Highly Graphical */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="instrument-telemetry-grid">
          {labInstruments.map(inst => {
            const isRunning = inst.status === 'RUNNING';
            const isIdle = inst.status === 'IDLE';
            const isError = inst.status === 'ERROR';
            const isMaint = inst.status === 'MAINTENANCE';

            let statusColorClass = "bg-slate-800 text-slate-300 border-slate-700";
            let indicatorBgClass = "bg-slate-400";
            if (isRunning) {
              statusColorClass = "bg-indigo-950/40 text-indigo-300 border-indigo-900/60";
              indicatorBgClass = "bg-indigo-400 animate-ping";
            } else if (isError) {
              statusColorClass = "bg-rose-950/40 text-rose-300 border-rose-900/60";
              indicatorBgClass = "bg-rose-500 animate-pulse";
            } else if (isMaint) {
              statusColorClass = "bg-amber-950/40 text-amber-300 border-amber-900/60";
              indicatorBgClass = "bg-amber-400";
            }

            return (
              <div 
                key={inst.id} 
                onClick={() => onViewWorkstation(inst.id)}
                className={`p-5 rounded-xl border transition-all cursor-pointer hover:border-indigo-500/50 group flex flex-col justify-between ${statusColorClass}`}
                id={`inst-card-${inst.id}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/35 text-slate-300">
                      {inst.type}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium">
                      <span className={`h-2.5 w-2.5 rounded-full ${indicatorBgClass}`}></span>
                      {inst.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold tracking-tight text-white mt-3 group-hover:text-indigo-400 transition-colors">
                    {inst.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">S/N: {inst.serialNumber} • {inst.vendor}</p>

                  {/* Real-time Telemetry Row */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-mono uppercase">Pressure</p>
                      <p className="text-xs font-bold font-mono text-white mt-0.5">
                        {inst.sensorData.pressure.toFixed(1)} <span className="text-[9px] font-normal text-slate-400">{inst.type === 'GC' ? 'psi' : 'bar'}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-mono uppercase">Flow Rate</p>
                      <p className="text-xs font-bold font-mono text-white mt-0.5">
                        {inst.sensorData.flowRate.toFixed(2)} <span className="text-[9px] font-normal text-slate-400">mL</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-mono uppercase">Signal</p>
                      <p className="text-xs font-bold font-mono text-white mt-0.5">
                        {inst.sensorData.detectorSignal.toFixed(1)} <span className="text-[9px] font-normal text-slate-400">mAU</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between text-xs text-slate-400 group-hover:text-white pt-2 border-t border-white/5">
                  <span className="font-mono text-[10px]">Health: {inst.healthScore}%</span>
                  <span className="flex items-center gap-1">
                    Open Workstation <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column split for Activity Ledger and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-columns-split">
        {/* Left Column: Recent LIMS/Audit Activity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200" id="audit-logs-summary">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Database className="h-5 w-5 text-slate-500" />
                Audit Trail & compliance Ledger
              </h3>
              <p className="text-xs text-slate-400">Real-time GLP/GMP secure compliance logger</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-700">
              GLP compliant
            </span>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1" id="audit-trail-list">
            {auditLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-xs border border-transparent hover:border-slate-100" id={`audit-log-${log.id}`}>
                <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 font-mono mt-0.5">
                  {log.category.substring(0, 4)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-500 mt-0.5 text-xs">{log.details}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                    <span className="inline-flex items-center gap-0.5 font-medium text-slate-600">
                      <User className="h-2.5 w-2.5" /> {log.operator}
                    </span>
                    • IP: {log.ipAddress}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: LIMS Alerts & Realtime Alarm notifications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200" id="notifications-summary">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Live Instrument Alarms & Alerts
              </h3>
              <p className="text-xs text-slate-400">Live warning stream from chromatography workstations</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-200">
              {notifications.filter(n => !n.read).length} unread
            </span>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1" id="notifications-list">
            {notifications.slice(0, 5).map(notif => {
              let alertColorClass = "bg-indigo-50 text-indigo-700 border-indigo-100";
              if (notif.type === 'ALERT') alertColorClass = "bg-rose-50 text-rose-700 border-rose-100";
              else if (notif.type === 'WARNING') alertColorClass = "bg-amber-50 text-amber-700 border-amber-100";
              else if (notif.type === 'SUCCESS') alertColorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";

              return (
                <div 
                  key={notif.id} 
                  className={`p-3 rounded-lg border flex gap-3 text-xs ${alertColorClass} ${!notif.read ? 'ring-1 ring-inset ring-indigo-500/20 font-medium' : ''}`}
                  id={`notif-${notif.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span>{notif.title}</span>
                      <span className="text-[10px] font-mono font-normal opacity-70">{notif.timestamp}</span>
                    </div>
                    <p className="mt-1 opacity-90 leading-normal">{notif.message}</p>
                    {notif.instrumentId && (
                      <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.2 rounded bg-black/5 font-mono">
                        Device Gateway: {notif.instrumentId}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
