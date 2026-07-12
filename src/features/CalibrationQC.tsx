/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  Activity, CheckCircle, AlertTriangle, HelpCircle, 
  Target, Sliders, Play, RefreshCw, BarChart2 
} from 'lucide-react';

export default function CalibrationQC() {
  const { calibrations, qcResults } = useLab();
  const [selectedCalId, setSelectedCalId] = useState<string>(calibrations[0]?.id || 'cal-01');

  const selectedCal = calibrations.find(c => c.id === selectedCalId) || calibrations[0];

  // SVG dimensions for Regression Plot
  const pad = { top: 20, right: 30, bottom: 45, left: 60 };
  const w = 450;
  const h = 250;

  const maxConc = Math.max(...selectedCal.points.map(p => p.concentration));
  const maxArea = Math.max(...selectedCal.points.map(p => p.peakArea));

  const getSvgCoords = (conc: number, area: number) => {
    const x = pad.left + (conc / (maxConc * 1.1)) * (w - pad.left - pad.right);
    const y = h - pad.bottom - (area / (maxArea * 1.1)) * (h - pad.top - pad.bottom);
    return { x, y };
  };

  // Trendline start and end coordinates
  const trendStart = getSvgCoords(0, selectedCal.intercept);
  const trendEnd = getSvgCoords(maxConc * 1.1, selectedCal.slope * (maxConc * 1.1) + selectedCal.intercept);

  // Levy-Jennings Chart Dimensions (for QC results)
  const ljPad = { top: 15, right: 20, bottom: 35, left: 45 };
  const ljW = 450;
  const ljH = 150;

  // Let's model Levy Jennings values. Mean is 10.0, SD is 0.1
  const mean = 10.0;
  const sd = 0.1;
  const qcPoints = [9.9, 10.05, 9.98, 10.12, 10.01, 9.94, 10.05, 9.92, 10.15]; // sample run results over 9 days

  const getLjCoords = (index: number, val: number) => {
    const x = ljPad.left + (index / (qcPoints.length - 1)) * (ljW - ljPad.left - ljPad.right);
    // range from Mean - 3SD to Mean + 3SD
    const minVal = mean - 3.5 * sd;
    const maxVal = mean + 3.5 * sd;
    const y = ljH - ljPad.bottom - ((val - minVal) / (maxVal - minVal)) * (ljH - ljPad.top - ljPad.bottom);
    return { x, y };
  };

  const ljLineD = useMemo(() => {
    let d = '';
    qcPoints.forEach((pt, idx) => {
      const { x, y } = getLjCoords(idx, pt);
      if (idx === 0) d += `M ${x} ${y}`;
      else d += ` L ${x} ${y}`;
    });
    return d;
  }, []);

  return (
    <div className="space-y-6" id="calib-qc-module">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <Target className="text-indigo-600 h-6 w-6" />
            Calibration Curves & System Suitability
          </h1>
          <p className="text-xs text-slate-500 font-medium">Standard chemical calibrations, linear regression models, and Levy-Jennings statistical monitoring.</p>
        </div>

        {/* Selected standard drop down */}
        <div className="flex items-center gap-1.5 mt-3 sm:mt-0 text-xs">
          <span className="text-slate-400 font-mono font-semibold">Analyte calibration:</span>
          <select
            value={selectedCalId}
            onChange={(e) => setSelectedCalId(e.target.value)}
            className="p-2 border border-slate-200 bg-white rounded-lg text-slate-700 font-bold outline-none"
          >
            {calibrations.map(c => (
              <option key={c.id} value={c.id}>{c.analyte}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid containing Calibration and Levy Jennings side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="calib-scada-row">
        
        {/* Regression Curve */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between" id="regression-panel">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Linear Regression curve (GLP Calibration)</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">Formula: y = {selectedCal.slope.toFixed(1)}x + ({selectedCal.intercept.toFixed(1)})</p>
          </div>

          <div className="my-4 flex items-center justify-center p-2 bg-slate-50 border border-slate-100 rounded-xl relative">
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto select-none overflow-hidden">
              {/* Plot axes */}
              <line x1={pad.left} y1={pad.top} x2={pad.left} y2={h - pad.bottom} stroke="#94a3b8" />
              <line x1={pad.left} y1={h - pad.bottom} x2={w - pad.right} y2={h - pad.bottom} stroke="#94a3b8" />

              {/* Grid Y labels */}
              <text x={pad.left - 8} y={pad.top + 4} textAnchor="end" className="text-[8px] font-mono fill-slate-400">{Math.round(maxArea * 1.1).toLocaleString()}</text>
              <text x={pad.left - 8} y={h - pad.bottom} textAnchor="end" className="text-[8px] font-mono fill-slate-400">0</text>

              {/* Grid X labels */}
              <text x={w - pad.right} y={h - pad.bottom + 12} textAnchor="end" className="text-[8px] font-mono fill-slate-400">{(maxConc * 1.1).toFixed(1)} ug/mL</text>
              <text x={pad.left} y={h - pad.bottom + 12} textAnchor="middle" className="text-[8px] font-mono fill-slate-400">0.0</text>

              {/* Axis titles */}
              <text x={w / 2 + 10} y={h - 5} textAnchor="middle" className="text-[9px] font-mono fill-slate-400">Concentration (ug/mL)</text>
              <text x={12} y={h / 2} textAnchor="middle" transform={`rotate(-90 12 ${h / 2})`} className="text-[9px] font-mono fill-slate-400">Integrated Peak Area</text>

              {/* Regression Trend Line */}
              <line x1={trendStart.x} y1={trendStart.y} x2={trendEnd.x} y2={trendEnd.y} stroke="#6366f1" strokeWidth="1.5" />

              {/* Standard Calibration Points */}
              {selectedCal.points.map((pt, idx) => {
                const coords = getSvgCoords(pt.concentration, pt.peakArea);
                return (
                  <g key={idx}>
                    <circle cx={coords.x} cy={coords.y} r="4" fill="#4338ca" className="hover:fill-indigo-400 transition-colors" />
                    <text x={coords.x + 6} y={coords.y + 3} className="text-[8px] font-mono fill-indigo-600 font-bold">{pt.concentration.toFixed(1)}</text>
                  </g>
                );
              })}
            </svg>

            {/* Float Accuracy Tag */}
            <div className="absolute top-4 right-4 bg-indigo-950/95 border border-indigo-500/30 p-2 rounded-lg text-white text-[11px] font-mono">
              <span className="text-slate-400">Correlation Coefficient</span>
              <p className="font-bold text-indigo-400">R² = {selectedCal.r2.toFixed(4)}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Calibrated Date: {selectedCal.date}</span>
            <span className="font-bold text-emerald-600">● Calibration Active & Signed</span>
          </div>
        </div>

        {/* Quality Control (Levy Jennings) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between" id="qc-chart-panel">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Levy-Jennings SPC chart</h3>
            <p className="text-xs text-slate-400 mt-0.5">Assay suitability standard variance (Target: {mean.toFixed(1)} ug/mL, SD: {sd.toFixed(2)})</p>
          </div>

          <div className="my-4 flex items-center justify-center p-2 bg-slate-50 border border-slate-100 rounded-xl relative">
            <svg viewBox={`0 0 ${ljW} ${ljH}`} className="w-full h-auto select-none overflow-hidden">
              {/* Horizontal Limit bands (Mean, +-1SD, +-2SD, +-3SD) */}
              {/* +3SD (Action fail threshold) */}
              <line x1={ljPad.left} y1={getLjCoords(0, mean + 3 * sd).y} x2={ljW - ljPad.right} y2={getLjCoords(0, mean + 3 * sd).y} stroke="#fecdd3" strokeWidth="1" strokeDasharray="2,2" />
              <text x={ljW - ljPad.right + 4} y={getLjCoords(0, mean + 3 * sd).y + 2} className="text-[7px] font-mono fill-rose-400 font-bold">+3SD</text>

              {/* +2SD */}
              <line x1={ljPad.left} y1={getLjCoords(0, mean + 2 * sd).y} x2={ljW - ljPad.right} y2={getLjCoords(0, mean + 2 * sd).y} stroke="#fef3c7" strokeWidth="1" strokeDasharray="2,2" />
              <text x={ljW - ljPad.right + 4} y={getLjCoords(0, mean + 2 * sd).y + 2} className="text-[7px] font-mono fill-amber-500 font-bold">+2SD</text>

              {/* Mean central target */}
              <line x1={ljPad.left} y1={getLjCoords(0, mean).y} x2={ljW - ljPad.right} y2={getLjCoords(0, mean).y} stroke="#10b981" strokeWidth="1.2" />
              <text x={ljW - ljPad.right + 4} y={getLjCoords(0, mean).y + 2} className="text-[7px] font-mono fill-emerald-600 font-bold">MEAN</text>

              {/* -2SD */}
              <line x1={ljPad.left} y1={getLjCoords(0, mean - 2 * sd).y} x2={ljW - ljPad.right} y2={getLjCoords(0, mean - 2 * sd).y} stroke="#fef3c7" strokeWidth="1" strokeDasharray="2,2" />
              <text x={ljW - ljPad.right + 4} y={getLjCoords(0, mean - 2 * sd).y + 2} className="text-[7px] font-mono fill-amber-500 font-bold">-2SD</text>

              {/* -3SD */}
              <line x1={ljPad.left} y1={getLjCoords(0, mean - 3 * sd).y} x2={ljW - ljPad.right} y2={getLjCoords(0, mean - 3 * sd).y} stroke="#fecdd3" strokeWidth="1" strokeDasharray="2,2" />
              <text x={ljW - ljPad.right + 4} y={getLjCoords(0, mean - 3 * sd).y + 2} className="text-[7px] font-mono fill-rose-400 font-bold">-3SD</text>

              {/* Left Y bounding axis */}
              <line x1={ljPad.left} y1={ljPad.top} x2={ljPad.left} y2={ljH - ljPad.bottom} stroke="#cbd5e1" />

              {/* Levy-Jennings Plot line path */}
              {ljLineD && (
                <path d={ljLineD} fill="none" stroke="#6366f1" strokeWidth="1.5" />
              )}

              {/* Plot dots */}
              {qcPoints.map((pt, idx) => {
                const coords = getLjCoords(idx, pt);
                const isViolating = Math.abs(pt - mean) > 3 * sd;
                const isWarning = Math.abs(pt - mean) > 2 * sd;
                return (
                  <circle 
                    key={idx} 
                    cx={coords.x} 
                    cy={coords.y} 
                    r="3.5" 
                    fill={isViolating ? '#ef4444' : isWarning ? '#f59e0b' : '#3b82f6'} 
                  />
                );
              })}
            </svg>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Westgard Multi-Rules checker</span>
            <span className="font-bold text-emerald-600">● 12s, 13s rules acceptable</span>
          </div>
        </div>
      </div>

      {/* QC suitabilities detail list */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200" id="qc-suitability-details">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-indigo-500" />
          GLP System Suitability results log
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-500 border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-mono uppercase text-[9px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Suitability Timestamp</th>
                <th className="py-3 px-4">Standard Analyte Check</th>
                <th className="py-3 px-4 text-right">Target (ug/mL)</th>
                <th className="py-3 px-4 text-right">Measured (ug/mL)</th>
                <th className="py-3 px-4 text-right">Deviation (%)</th>
                <th className="py-3 px-4 text-right">Theoretical Plates (N)</th>
                <th className="py-3 px-4 text-right">USP Tailing (T)</th>
                <th className="py-3 px-4">Conformity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {qcResults.map((qc) => {
                const deviation = ((qc.measuredValue - qc.expectedValue) / qc.expectedValue) * 100;
                return (
                  <tr key={qc.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono">{qc.timestamp}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{qc.analyte}</td>
                    <td className="py-3 px-4 text-right font-mono">{qc.expectedValue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{qc.measuredValue.toFixed(2)}</td>
                    <td className={`py-3 px-4 text-right font-mono font-semibold ${Math.abs(deviation) > 2.0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {deviation > 0 ? '+' : ''}{deviation.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{qc.suitabilityParams.plates.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono">{qc.suitabilityParams.tailing.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        qc.status === 'PASS' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {qc.status}
                      </span>
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
