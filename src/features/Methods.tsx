/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLab } from '../contexts/LabContext';
import { Method, InstrumentType } from '../types';
import { 
  BookOpen, Plus, FileText, CheckCircle, Shield, 
  ArrowUpRight, Download, Upload, Clock, User 
} from 'lucide-react';

export default function Methods() {
  const { methods, addMethod, approveMethod, selectedRole } = useLab();
  
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(methods[0]?.id || null);
  const [isNewMethodOpen, setIsNewMethodOpen] = useState(false);

  // New Method state
  const [mName, setMName] = useState('');
  const [mType, setMType] = useState<InstrumentType>('HPLC');
  const [flow, setFlow] = useState(1.0);
  const [temp, setTemp] = useState(30.0);
  const [solvA, setSolvA] = useState('0.1% TFA in H2O');
  const [solvB, setSolvB] = useState('Acetonitrile');
  const [wave, setWave] = useState(254);
  const [runtime, setRuntime] = useState(5.0);

  const selectedMethod = methods.find(m => m.id === selectedMethodId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName) return;

    addMethod({
      name: mName,
      type: mType,
      version: '1.0',
      parameters: {
        flowRate: flow,
        tempColumn: temp,
        solventA: solvA,
        solventB: solvB,
        detectorWavelength: wave,
        runTime: runtime
      }
    });

    setMName('');
    setIsNewMethodOpen(false);
  };

  return (
    <div className="space-y-6" id="methods-module">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Assay Method Library</h1>
          <p className="text-xs text-slate-500">Validated chromatography method specifications compliant with international pharmacopoeias.</p>
        </div>
        <button
          onClick={() => setIsNewMethodOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-indigo-700 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Define New Method
        </button>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="methods-main-grid">
        {/* Left Column: Method Cards list */}
        <div className="lg:col-span-1 space-y-3" id="methods-cards-list">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Chemical Procedures</span>
          {methods.map(m => {
            const isApproved = m.status === 'APPROVED';
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMethodId(m.id)}
                className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
                  selectedMethodId === m.id
                    ? 'border-indigo-500 ring-1 ring-indigo-500/50 shadow-xs'
                    : 'border-slate-200 hover:border-indigo-400'
                }`}
                id={`method-card-${m.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-black/5 font-mono text-[9px] font-bold text-slate-600">
                    {m.type}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                    isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    v{m.version} • {m.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-2.5 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                  {m.name}
                </h4>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed parameters inspection and approval signature */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200" id="method-details-card">
          {selectedMethod ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedMethod.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Method ID: {selectedMethod.id} • Target Hardware: {selectedMethod.type}</p>
                </div>
                {selectedMethod.status !== 'APPROVED' && (
                  <button
                    onClick={() => approveMethod(selectedMethod.id)}
                    className="mt-3 sm:mt-0 inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Sign Approval Signature
                  </button>
                )}
              </div>

              {/* Physical Parameters List */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Chromatographic Solute Matrix Parameters</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" id="params-grid">
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase font-mono text-slate-400">Mobile Flow Rate</span>
                    <p className="text-sm font-bold font-mono text-slate-800">{selectedMethod.parameters.flowRate.toFixed(2)} mL/min</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase font-mono text-slate-400">Column Temp Limit</span>
                    <p className="text-sm font-bold font-mono text-slate-800">{selectedMethod.parameters.tempColumn.toFixed(1)} °C</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase font-mono text-slate-400">Detector Wavelength</span>
                    <p className="text-sm font-bold font-mono text-slate-800">{selectedMethod.parameters.detectorWavelength} nm</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase font-mono text-slate-400">In-Silico Run Time</span>
                    <p className="text-sm font-bold font-mono text-slate-800">{selectedMethod.parameters.runTime.toFixed(1)} minutes</p>
                  </div>
                  <div className="col-span-2 p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase font-mono text-slate-400">Mobile Phase Composition</span>
                    <p className="text-xs font-medium text-slate-800">A: {selectedMethod.parameters.solventA}</p>
                    <p className="text-xs font-medium text-slate-800">B: {selectedMethod.parameters.solventB}</p>
                  </div>
                </div>
              </div>

              {/* Version History Table */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">FDA Part 11 Audit Trail History</h4>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-[11px] text-left text-slate-500 border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-mono uppercase text-[9px] border-b border-slate-100">
                      <tr>
                        <th className="p-2.5">Ver</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Audited By</th>
                        <th className="p-2.5">Verification Comments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-600">
                      {selectedMethod.history.map((hist, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-800">v{hist.version}</td>
                          <td className="p-2.5 font-mono">{hist.date}</td>
                          <td className="p-2.5">{hist.changedBy}</td>
                          <td className="p-2.5 italic">{hist.comment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 italic">
              Select an assay procedure from the catalog to load validated parameters.
            </div>
          )}
        </div>
      </div>

      {/* New Method Dialog */}
      {isNewMethodOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Define Assay Protocol</h3>
              <button onClick={() => setIsNewMethodOpen(false)} className="p-1 rounded bg-slate-50 text-slate-500">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Method Assay Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol Raw Assay v4.0"
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hardware Classification</label>
                  <select
                    value={mType}
                    onChange={(e) => setMType(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                  >
                    <option value="HPLC">HPLC (Liquid)</option>
                    <option value="UHPLC">UHPLC (High-Pressure)</option>
                    <option value="GC">GC (Gas Oven)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Oven/Column Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(parseFloat(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Solvent A (Carrier Gas if GC)</label>
                  <input
                    type="text"
                    value={solvA}
                    onChange={(e) => setSolvA(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Solvent B (FID Gas if GC)</label>
                  <input
                    type="text"
                    value={solvB}
                    onChange={(e) => setSolvB(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Flow Rate</label>
                  <input
                    type="number"
                    step="0.05"
                    value={flow}
                    onChange={(e) => setFlow(parseFloat(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UV/FID Peak</label>
                  <input
                    type="number"
                    value={wave}
                    onChange={(e) => setWave(parseInt(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Run Time (min)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={runtime}
                    onChange={(e) => setRuntime(parseFloat(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-center hover:bg-indigo-700 transition-colors"
              >
                Accept and Write to Procedure Catalog
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
