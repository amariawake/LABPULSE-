/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  FileText, Printer, CheckCircle, Shield, 
  ArrowUpRight, Download, Upload, Clock, User, ClipboardList 
} from 'lucide-react';

export default function ReportsCOA() {
  const { samples, instruments, methods, completedRuns, selectedRole } = useLab();
  const [selectedRunId, setSelectedRunId] = useState<string>(completedRuns[0]?.id || 'run-samp-04');

  const activeRun = completedRuns.find(r => r.id === selectedRunId) || completedRuns[0];
  const activeSample = samples.find(s => s.id === activeRun?.sampleId);
  const activeMethod = methods.find(m => m.id === activeRun?.methodId);

  // Download printable Certificate of Analysis (simulate print drawer)
  const triggerPrintCOA = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="reports-coa-module">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Compliance COA Reports</h1>
          <p className="text-xs text-slate-500">Generate FDA / EMA GMP compliant Certificate of Analysis paperwork.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={triggerPrintCOA}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-indigo-700 transition-all"
          >
            <Printer className="h-4 w-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Select sample run selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-indigo-500" />
          <span className="text-xs font-bold text-slate-700">Compile Certificate for Run:</span>
        </div>
        <select
          value={selectedRunId}
          onChange={(e) => setSelectedRunId(e.target.value)}
          className="text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
        >
          {completedRuns.map(r => (
            <option key={r.id} value={r.id}>{r.sampleName} ({r.date})</option>
          ))}
        </select>
      </div>

      {/* Printable Certificate layout (Styled like real pharmaceutical paper COA) */}
      <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-300 shadow-lg max-w-4xl mx-auto space-y-8 text-xs text-slate-800" id="coa-print-stage">
        
        {/* Certificate Corporate Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">LabPulse Analytical</h2>
            <p className="text-[10px] text-slate-400 font-mono">LABPULSE LIMS COMPLIANT SYSTEM • EST. 2026</p>
            <p className="text-slate-500 mt-2 font-medium">GMP QC Department • Block A, Floor 2</p>
            <p className="text-slate-400">100 Biotech Parkway, San Diego, CA</p>
          </div>
          <div className="text-right border border-slate-300 p-3 rounded-lg bg-slate-50/50">
            <span className="block text-[10px] font-mono text-slate-400 uppercase">Certificate ID</span>
            <span className="text-sm font-bold font-mono text-slate-900">COA-2026-{activeRun?.id.substring(4, 9).toUpperCase() || 'X9827'}</span>
            <span className="block text-[9px] text-emerald-600 font-bold mt-1.5 uppercase font-mono">STATUS: RELEASED</span>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-bold tracking-wide uppercase text-slate-900">CERTIFICATE OF ANALYSIS</h3>
          <p className="text-slate-500 mt-0.5">Report compiled in accordance with standard GLP/GMP laboratory practices</p>
        </div>

        {/* Two-column Sample Metadata block */}
        <div className="grid grid-cols-2 gap-6 pt-2 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 text-[10px] tracking-wider">Sample Description</h4>
            <div className="grid grid-cols-2 gap-y-1">
              <span className="text-slate-400">Sample Name:</span>
              <span className="font-bold text-slate-900">{activeRun?.sampleName || 'Paracetamol Raw Stock'}</span>
              
              <span className="text-slate-400">LIMS Barcode:</span>
              <span className="font-mono">{activeSample?.barcode || 'LAB-2026-92837'}</span>

              <span className="text-slate-400">Priority level:</span>
              <span className="font-medium">{activeSample?.priority || 'MEDIUM'}</span>

              <span className="text-slate-400">Log Date:</span>
              <span>{activeSample?.registeredDate || '2026-07-11 11:30'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1 text-[10px] tracking-wider">Assay parameters</h4>
            <div className="grid grid-cols-2 gap-y-1">
              <span className="text-slate-400">Chromatograph:</span>
              <span>{activeRun?.instrumentName || 'Agilent HPLC-01'}</span>
              
              <span className="text-slate-400">Method Title:</span>
              <span>{activeMethod?.name || 'Analgesic Assay'}</span>

              <span className="text-slate-400">Oven / Column:</span>
              <span>{activeMethod?.parameters.tempColumn}°C Column</span>

              <span className="text-slate-400">Detector UV:</span>
              <span className="font-mono">{activeMethod?.parameters.detectorWavelength} nm</span>
            </div>
          </div>
        </div>

        {/* Chromatography Peaks Integration Grid */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider pb-1">Chromatographic integration summary</h4>
          
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-slate-50 text-slate-700 font-mono uppercase text-[9px] border-b border-slate-200">
                <tr>
                  <th className="p-2 font-semibold">Peak #</th>
                  <th className="p-2 font-semibold">Analyte Compound</th>
                  <th className="p-2 font-semibold text-right">Retention (min)</th>
                  <th className="p-2 font-semibold text-right">Integrated Area (mAU*s)</th>
                  <th className="p-2 font-semibold text-right">Peak Height (mAU)</th>
                  <th className="p-2 font-semibold text-right">USP Tailing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeRun?.peaks.map((p: any, idx: number) => (
                  <tr key={p.id}>
                    <td className="p-2 font-mono">#{idx + 1}</td>
                    <td className="p-2 font-bold text-slate-800">{p.name}</td>
                    <td className="p-2 text-right font-mono">{p.retentionTime.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono">{p.peakArea.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono">{p.peakHeight}</td>
                    <td className="p-2 text-right font-mono">{p.tailing.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conclusion notes */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
          <span className="text-[9px] uppercase font-mono font-bold text-slate-400">Quality Release Statement</span>
          <p className="leading-relaxed">
            The standard test mixture components Acetaminophen and Caffeine are resolved with adequate theoretical plates. Peak separation indices, tailing bounds, and calibration linear regression fits align completely with Pharmacopeia guidelines. This material batch is approved for release.
          </p>
        </div>

        {/* Signatures Panel */}
        <div className="grid grid-cols-2 gap-12 pt-8" id="coa-signatures">
          {/* Operator Signature */}
          <div className="border-t border-slate-400 pt-3 text-center space-y-1">
            <span className="block italic text-slate-500 font-serif">Alex Rivera</span>
            <span className="block text-[10px] font-bold text-slate-800 uppercase">Alex Rivera</span>
            <span className="block text-[9px] text-slate-400 uppercase">Lead Analyst • GMP Quality Control</span>
          </div>

          {/* Quality Director Signature */}
          <div className="border-t border-slate-400 pt-3 text-center space-y-1">
            <span className="block italic text-slate-500 font-serif">Helen Carter, Ph.D.</span>
            <span className="block text-[10px] font-bold text-slate-800 uppercase">Dr. Helen Carter</span>
            <span className="block text-[9px] text-slate-400 uppercase">Quality Release Director</span>
          </div>
        </div>

      </div>
    </div>
  );
}
