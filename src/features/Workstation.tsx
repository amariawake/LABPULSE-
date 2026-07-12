/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  Play, Pause, RefreshCw, ZoomIn, ZoomOut, Maximize2, 
  Download, Copy, Sliders, Layers, Info, Check, Edit2, Columns 
} from 'lucide-react';
import { METHOD_PEAKS, calculateIntegratedPeaks, generateChromatogramPoints } from '../mocks/chromatogramGenerator';
import { InstrumentType } from '../types';

export default function Workstation() {
  const { 
    instruments, activeInstrumentId, setActiveInstrumentId, 
    activeLiveSignalPoints, elapsedTime, runProgress, methods, samples,
    completedRuns, addAuditLog
  } = useLab();

  // Selected instrument
  const inst = instruments.find(i => i.id === activeInstrumentId) || instruments[0];
  const activeMethod = methods.find(m => m.id === inst?.methodId);
  const activeSample = samples.find(s => s.id === inst?.currentSampleId);

  // States
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [overlayRunId, setOverlayRunId] = useState<string>('');
  const [editingCommentPeakId, setEditingCommentPeakId] = useState<string | null>(null);
  const [peakComments, setPeakComments] = useState<Record<string, string>>({});

  // Fetch completed runs for overlay comparison
  const selectableOverlayRuns = useMemo(() => {
    return completedRuns.filter(r => r.instrumentId !== inst.id || r.id !== `run-${inst.currentSampleId}`);
  }, [completedRuns, inst]);

  // Integrated peaks
  const integratedPeaks = useMemo(() => {
    return calculateIntegratedPeaks(inst.type);
  }, [inst.type]);

  // SVG Chart Dimensions
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const width = 800;
  const height = 300;

  // Max bounds
  const maxTime = activeMethod?.parameters.runTime || 5.0;
  const maxSignal = inst.type === 'HPLC' ? 600 : inst.type === 'UHPLC' ? 800 : 500;

  // Active points to draw
  const pointsToDraw = useMemo(() => {
    if (inst.status === 'RUNNING') {
      return activeLiveSignalPoints;
    } else {
      // Show completed or standard template points
      return generateChromatogramPoints(inst.type, maxTime, undefined, 0.2);
    }
  }, [inst.status, activeLiveSignalPoints, inst.type, maxTime]);

  // Handle comment save
  const saveComment = (peakId: string, text: string) => {
    setPeakComments(prev => ({ ...prev, [peakId]: text }));
    setEditingCommentPeakId(null);
    addAuditLog('SAMPLE', 'Peak Comment Edited', `Updated integrator annotation for peak: ${peakId} with text "${text}"`);
  };

  // SVG coordinates translation
  const getCoords = (time: number, signal: number) => {
    // Apply zoom and pan
    const zoomedWidth = width * zoomLevel;
    const xOffset = panOffset;
    
    const x = padding.left + ((time / maxTime) * (zoomedWidth - padding.left - padding.right)) + xOffset;
    const y = height - padding.bottom - ((signal / maxSignal) * (height - padding.top - padding.bottom));
    return { x, y };
  };

  // Generate SVG Path
  const mainPathD = useMemo(() => {
    if (pointsToDraw.length === 0) return '';
    let d = '';
    pointsToDraw.forEach((pt, idx) => {
      const { x, y } = getCoords(pt.time, pt.signal);
      // Clamp coordinates within grid bounding box
      const clampedX = Math.max(padding.left, Math.min(width - padding.right, x));
      const clampedY = Math.max(padding.top, Math.min(height - padding.bottom, y));

      if (idx === 0) {
        d += `M ${clampedX} ${clampedY}`;
      } else {
        d += ` L ${clampedX} ${clampedY}`;
      }
    });
    return d;
  }, [pointsToDraw, zoomLevel, panOffset, inst.status]);

  // Overlay Path
  const overlayPathD = useMemo(() => {
    if (!overlayRunId) return '';
    const run = completedRuns.find(r => r.id === overlayRunId);
    if (!run) return '';
    
    let d = '';
    run.points.forEach((pt: any, idx: number) => {
      const { x, y } = getCoords(pt.time, pt.signal);
      const clampedX = Math.max(padding.left, Math.min(width - padding.right, x));
      const clampedY = Math.max(padding.top, Math.min(height - padding.bottom, y));

      if (idx === 0) {
        d += `M ${clampedX} ${clampedY}`;
      } else {
        d += ` L ${clampedX} ${clampedY}`;
      }
    });
    return d;
  }, [overlayRunId, completedRuns, zoomLevel, panOffset]);

  // Download raw chromatogram data
  const handleExportCSV = () => {
    let csv = "Time (min),Detector Signal (mAU)\n";
    pointsToDraw.forEach(pt => {
      csv += `${pt.time},${pt.signal}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${inst.name.replace(/ /g, "_")}_chromatogram.csv`;
    link.click();
    addAuditLog('INSTRUMENT', 'Export raw points', `Exported chromatogram CSV data for ${inst.name}`);
  };

  return (
    <div className="space-y-6" id="workstation-module">
      {/* Top Selector Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Sliders className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Focused Chromatograph Node</h2>
            <p className="text-xs text-slate-500">Live WebSockets routed from physical instruments</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3 md:mt-0">
          {instruments.map(i => (
            <button
              key={i.id}
              onClick={() => setActiveInstrumentId(i.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all ${
                activeInstrumentId === i.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
              id={`inst-btn-${i.id}`}
            >
              {i.type}: {i.name.split(' (')[1]?.replace(')', '') || i.name.substring(0, 10)}
              <span className={`inline-block h-1.5 w-1.5 rounded-full ml-1.5 ${
                i.status === 'RUNNING' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
              }`} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Chromatogram on Left, Metadata on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="workstation-main-grid">
        
        {/* Left Column - Live Chromatogram Board */}
        <div className="lg:col-span-2 bg-slate-900 p-5 rounded-2xl text-white border border-slate-800 shadow-md flex flex-col justify-between" id="workstation-chart-panel">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                DETECTOR {inst.type === 'GC' ? 'FID (280°C)' : 'UV/VIS (254nm)'} - REAL-TIME PLOT
              </h3>
              <p className="text-[11px] text-slate-400">Resolution: 5Hz • System Suitability auto-integrated</p>
            </div>
            
            {/* Chart Control Actions */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => {
                  setZoomLevel(prev => Math.min(4, prev + 0.5));
                }}
                className="p-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => {
                  setZoomLevel(1);
                  setPanOffset(0);
                }}
                className="p-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-colors"
                title="Reset Zoom"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => {
                  if (zoomLevel > 1) {
                    setPanOffset(prev => Math.min(0, prev + 50));
                  }
                }}
                disabled={zoomLevel === 1}
                className="px-2 py-1 bg-slate-800 text-slate-400 disabled:opacity-30 text-[10px] font-mono rounded hover:bg-slate-700 transition-colors"
              >
                ◀ PAN
              </button>
              <button 
                onClick={() => {
                  if (zoomLevel > 1) {
                    setPanOffset(prev => Math.max(-400, prev - 50));
                  }
                }}
                disabled={zoomLevel === 1}
                className="px-2 py-1 bg-slate-800 text-slate-400 disabled:opacity-30 text-[10px] font-mono rounded hover:bg-slate-700 transition-colors"
              >
                PAN ▶
              </button>
              <button 
                onClick={handleExportCSV}
                className="p-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-colors ml-2"
                title="Export CSV Raw Data"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive SVG Canvas */}
          <div className="relative my-4 flex items-center justify-center bg-slate-950 p-2 rounded-xl border border-slate-800/80" id="workstation-svg-container">
            <svg 
              viewBox={`0 0 ${width} ${height}`} 
              className="w-full h-auto select-none overflow-hidden"
              id="chromatogram-svg"
            >
              {/* Grid Lines */}
              <line x1={padding.left} y1={padding.top} x2={width - padding.right} y2={padding.top} stroke="#1e293b" strokeDasharray="3,3" />
              <line x1={padding.left} y1={height / 2} x2={width - padding.right} y2={height / 2} stroke="#1e293b" strokeDasharray="3,3" />
              <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#334155" />
              <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#334155" />

              {/* Grid Y Ticks */}
              <text x={padding.left - 8} y={padding.top + 4} textAnchor="end" className="text-[9px] font-mono fill-slate-500">{maxSignal}</text>
              <text x={padding.left - 8} y={height / 2 + 4} textAnchor="end" className="text-[9px] font-mono fill-slate-500">{maxSignal / 2}</text>
              <text x={padding.left - 8} y={height - padding.bottom + 4} textAnchor="end" className="text-[9px] font-mono fill-slate-500">0</text>
              
              {/* Grid X Ticks */}
              {Array.from({ length: 6 }).map((_, idx) => {
                const tickTime = (maxTime / 5) * idx;
                const coords = getCoords(tickTime, 0);
                if (coords.x >= padding.left && coords.x <= width - padding.right) {
                  return (
                    <g key={idx}>
                      <line x1={coords.x} y1={height - padding.bottom} x2={coords.x} y2={height - padding.bottom + 4} stroke="#475569" />
                      <text x={coords.x} y={height - padding.bottom + 15} textAnchor="middle" className="text-[9px] font-mono fill-slate-500">
                        {tickTime.toFixed(1)}
                      </text>
                    </g>
                  );
                }
                return null;
              })}

              {/* Axis Labels */}
              <text x={width / 2} y={height - 5} textAnchor="middle" className="text-[10px] font-mono fill-slate-400">Time (minutes)</text>
              <text x={12} y={height / 2} textAnchor="middle" transform={`rotate(-90 12 ${height / 2})`} className="text-[10px] font-mono fill-slate-400">
                Signal ({inst.type === 'GC' ? 'Hz' : 'mAU'})
              </text>

              {/* Peaks shaded integration polygons (render only if complete or template matches) */}
              {inst.status !== 'RUNNING' && METHOD_PEAKS[inst.type]?.map((p, idx) => {
                // Peak bounding boxes for integrated areas
                const peakCoords = getCoords(p.retentionTime, p.height);
                const startCoords = getCoords(p.retentionTime - p.width * 2, 5);
                const endCoords = getCoords(p.retentionTime + p.width * 2, 5);

                if (peakCoords.x >= padding.left && peakCoords.x <= width - padding.right) {
                  return (
                    <g key={idx}>
                      <polygon 
                        points={`
                          ${startCoords.x},${height - padding.bottom} 
                          ${peakCoords.x},${peakCoords.y} 
                          ${endCoords.x},${height - padding.bottom}
                        `}
                        className="fill-indigo-500/15"
                      />
                      {/* Integrated peak marker line */}
                      <line x1={peakCoords.x} y1={peakCoords.y} x2={peakCoords.x} y2={height - padding.bottom} stroke="#a5b4fc" strokeWidth="1" strokeDasharray="2,2" />
                      {/* Retention Label flag */}
                      <circle cx={peakCoords.x} cy={peakCoords.y} r="3" className="fill-indigo-400" />
                      <rect x={peakCoords.x - 22} y={peakCoords.y - 18} width="44" height="12" rx="2" className="fill-indigo-950 stroke-indigo-500/50" strokeWidth="0.5" />
                      <text x={peakCoords.x} y={peakCoords.y - 9} textAnchor="middle" className="text-[8px] font-bold font-mono fill-indigo-200">
                        {p.retentionTime.toFixed(2)}m
                      </text>
                    </g>
                  );
                }
                return null;
              })}

              {/* Main Chromatogram Plot Path */}
              {mainPathD && (
                <path 
                  d={mainPathD} 
                  fill="none" 
                  stroke={inst.status === 'RUNNING' ? '#10b981' : '#6366f1'} 
                  strokeWidth="1.8" 
                  className="transition-all duration-200"
                />
              )}

              {/* Run Overlay Comparison Path (if enabled) */}
              {overlayPathD && (
                <path 
                  d={overlayPathD} 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="1.2" 
                  strokeDasharray="4,3" 
                  className="opacity-75"
                />
              )}
            </svg>

            {/* Run overlay legend tag */}
            {overlayRunId && (
              <div className="absolute top-3 left-3 bg-rose-950/60 border border-rose-900/60 px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                Overlay: {completedRuns.find(r => r.id === overlayRunId)?.sampleName}
                <button onClick={() => setOverlayRunId('')} className="ml-1 text-rose-300 hover:text-white font-bold font-sans">×</button>
              </div>
            )}
          </div>

          {/* Running Progress Ribbon (only shown when instrument is running) */}
          {inst.status === 'RUNNING' ? (
            <div className="bg-emerald-950/40 border border-emerald-900/40 p-3.5 rounded-xl flex items-center justify-between gap-4" id="workstation-running-status-bar">
              <div className="flex-1">
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                    ACTIVE RUN PROGRESS
                  </span>
                  <span className="text-slate-400">Elapsed: {elapsedTime.toFixed(2)} / {maxTime.toFixed(1)} mins ({runProgress}%)</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${runProgress}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs text-slate-400 font-mono" id="workstation-static-status-bar">
              <span>● WORKSTATION READY</span>
              <span>Method: {activeMethod?.name || 'Assigned'}</span>
            </div>
          )}
        </div>

        {/* Right Column - Workstation Telemetry & Active Run details */}
        <div className="space-y-6" id="workstation-telemetry-panel">
          {/* Active Workstation Metadata Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Workstation Metadata</h3>
            
            <div className="space-y-3" id="workstation-metadata">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono">Sample Name</p>
                <p className="text-sm font-bold text-slate-900">{activeSample?.name || 'System Baseline Check'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">LIMS Barcode</p>
                  <p className="text-xs font-semibold font-mono text-slate-800">{activeSample?.barcode || 'SYSTEM-BLANK-01'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Vial Position</p>
                  <p className="text-xs font-semibold font-mono text-slate-800">{activeSample?.vialPosition || 'Vial A-01 (Standard)'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Method Run Specs</p>
                  <p className="text-xs font-semibold text-slate-800">{activeMethod?.name || 'System Baseline'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">Oven Temp</p>
                  <p className="text-xs font-semibold text-slate-800">{activeMethod?.parameters.tempColumn}°C Column</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] uppercase font-mono text-slate-400">Flow Gradient Specs</span>
                <p className="text-xs text-slate-600 mt-1">Solvent A: {activeMethod?.parameters.solventA}</p>
                <p className="text-xs text-slate-600">Solvent B: {activeMethod?.parameters.solventB}</p>
              </div>
            </div>
          </div>

          {/* Compare Overlay selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-indigo-500" />
              Compare Chromatograms Overlay
            </h3>
            <p className="text-xs text-slate-500">Superimpose a historical chromatogram to analyze retention deviation.</p>
            
            <select
              value={overlayRunId}
              onChange={(e) => {
                setOverlayRunId(e.target.value);
                if (e.target.value) {
                  addAuditLog('SAMPLE', 'Overlay Superimposed', `Overlayed chromatogram ID: ${e.target.value} onto active workstation`);
                }
              }}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
            >
              <option value="">Select historical run to superimpose...</option>
              {selectableOverlayRuns.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.sampleName} ({r.date})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Integrated Peak Table - sticky header, comment edit */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200" id="workstation-peaks-table-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Columns className="h-5 w-5 text-indigo-500" />
              Integrated Peaks Summary (System Suitability)
            </h3>
            <p className="text-xs text-slate-400">GLP Area/Height Integration table. Double click or press edit to annotate peaks.</p>
          </div>
          <span className="text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full mt-2 sm:mt-0">
            USP-Tailing Limits Acceptable
          </span>
        </div>

        <div className="overflow-x-auto" id="workstation-peaks-grid">
          <table className="w-full text-xs text-left text-slate-500 border-collapse">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] font-mono sticky top-0 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Peak #</th>
                <th className="py-3 px-4 font-semibold">Analyte Name</th>
                <th className="py-3 px-4 font-semibold text-right">Retention Time (Rt, min)</th>
                <th className="py-3 px-4 font-semibold text-right">Area (mAU*sec)</th>
                <th className="py-3 px-4 font-semibold text-right">Height (mAU)</th>
                <th className="py-3 px-4 font-semibold text-right">Theo Plates (N)</th>
                <th className="py-3 px-4 font-semibold text-right">Tailing (USP T)</th>
                <th className="py-3 px-4 font-semibold pl-6">Integration Comment Annotation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {integratedPeaks.map((peak, idx) => {
                const isEditing = editingCommentPeakId === peak.id;
                const currentComment = peakComments[peak.id] || peak.comment || "Integrated normally";

                return (
                  <tr key={peak.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">#{idx + 1}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-950">{peak.name}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-indigo-600">{peak.retentionTime.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right font-mono">{peak.peakArea.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-mono">{peak.peakHeight}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">{peak.plates.toLocaleString()}</td>
                    <td className={`py-3.5 px-4 text-right font-mono font-semibold ${peak.tailing > 1.2 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {peak.tailing.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 pl-6 text-xs text-slate-600">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            defaultValue={currentComment}
                            id={`edit-comment-input-${peak.id}`}
                            className="flex-1 p-1 bg-slate-50 text-slate-800 rounded border border-slate-200 outline-none text-xs"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveComment(peak.id, e.currentTarget.value);
                              }
                            }}
                          />
                          <button 
                            onClick={(e) => {
                              const inputEl = document.getElementById(`edit-comment-input-${peak.id}`) as HTMLInputElement;
                              if (inputEl) saveComment(peak.id, inputEl.value);
                            }}
                            className="p-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/comment cursor-pointer" onClick={() => setEditingCommentPeakId(peak.id)}>
                          <span className="italic">{currentComment}</span>
                          <Edit2 className="h-3 w-3 text-slate-300 opacity-0 group-hover/comment:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
