/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLab } from '../contexts/LabContext';
import { Sample, SampleStatus, Instrument, Method } from '../types';
import { 
  Plus, Layers, Calendar, User, ArrowRight, CheckCircle, 
  AlertOctagon, Clock, RefreshCw, Barcode, Trash2, ShieldAlert
} from 'lucide-react';

export default function SampleQueue() {
  const { 
    samples, setSamples, instruments, methods, addSample, 
    updateSampleStatus, selectedRole, addAuditLog 
  } = useLab();

  // Registration form states
  const [sampleName, setSampleName] = useState('');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [methodId, setMethodId] = useState('');
  const [instId, setInstId] = useState('');
  const [injVol, setInjVol] = useState<number>(10.0);
  const [dilution, setDilution] = useState<number>(1);
  const [vialPos, setVialPos] = useState('');

  // Selected sample for barcode drawer preview
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  // Modal open
  const [isRegOpen, setIsRegOpen] = useState(false);

  // Group samples for Kanban Columns
  const kanbanColumns = useMemo(() => {
    return {
      PENDING: samples.filter(s => s.status === 'PENDING'),
      RUNNING: samples.filter(s => s.status === 'RUNNING'),
      COMPLETED: samples.filter(s => s.status === 'COMPLETED'),
      FAILED: samples.filter(s => s.status === 'FAILED'),
    };
  }, [samples]);

  // Handle registration submission
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sampleName || !methodId || !instId) return;

    addSample({
      name: sampleName,
      priority,
      assignedMethodId: methodId,
      assignedInstrumentId: instId,
      injectionVolume: injVol,
      dilutionFactor: dilution,
      vialPosition: vialPos || 'A-01'
    });

    // Reset Form
    setSampleName('');
    setVialPos('');
    setMethodId('');
    setInstId('');
    setIsRegOpen(false);
  };

  // Drag and Drop simulation buttons or direct column shifting!
  const shiftSampleState = (id: string, current: SampleStatus, direction: 'forward' | 'backward') => {
    const states: SampleStatus[] = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'];
    const index = states.indexOf(current);
    
    let newIndex = index;
    if (direction === 'forward' && index < 2) {
      newIndex = index + 1;
    } else if (direction === 'backward' && index > 0) {
      newIndex = index - 1;
    } else if (direction === 'forward' && index === 2) {
      // Completed, can push to Failed if needed, but normally static
    }

    if (newIndex !== index) {
      updateSampleStatus(id, states[newIndex]);
    }
  };

  const selectedSample = samples.find(s => s.id === selectedSampleId);

  return (
    <div className="space-y-6" id="sample-queue-module">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Chain of Custody & Sample Queue</h1>
          <p className="text-xs text-slate-500">LIMS custody ledger and active injection Kanban boards.</p>
        </div>
        <button
          onClick={() => {
            // Pick defaults
            if (methods.length > 0) setMethodId(methods[0].id);
            if (instruments.length > 0) setInstId(instruments[0].id);
            setIsRegOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-indigo-700 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Log New Sample
        </button>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="kanban-board">
        
        {/* Column 1: Pending */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col h-[520px]" id="column-pending">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" /> Pending (Ready)
            </span>
            <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full font-semibold font-mono text-slate-700">
              {kanbanColumns.PENDING.length}
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 pr-1" id="cards-pending">
            {kanbanColumns.PENDING.map(s => (
              <div 
                key={s.id} 
                onClick={() => setSelectedSampleId(s.id)}
                className={`bg-white p-3 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-indigo-400 hover:ring-1 hover:ring-indigo-400/50 transition-all ${
                  selectedSampleId === s.id ? 'border-indigo-500 ring-1 ring-indigo-500/50' : ''
                }`}
                id={`sample-card-${s.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold text-slate-400 uppercase">Vial: {s.vialPosition}</span>
                  <span className={`px-1.5 py-0.2 rounded-[3px] text-[8px] font-extrabold uppercase ${
                    s.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {s.priority}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">{s.name}</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">BC: {s.barcode}</p>
                
                {/* Arrow routing */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400">Assigned: {instruments.find(i => i.id === s.assignedInstrumentId)?.name.split(' (')[1]?.replace(')', '') || 'HPLC'}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); shiftSampleState(s.id, s.status, 'forward'); }}
                    className="p-1 rounded bg-slate-50 text-slate-600 hover:bg-slate-100"
                    title="Push to Running"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Running */}
        <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100 flex flex-col h-[520px]" id="column-running">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-100 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4 text-indigo-500 animate-spin" /> Running
            </span>
            <span className="text-xs bg-indigo-100 px-2 py-0.5 rounded-full font-semibold font-mono text-indigo-700">
              {kanbanColumns.RUNNING.length}
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 pr-1" id="cards-running">
            {kanbanColumns.RUNNING.map(s => (
              <div 
                key={s.id} 
                onClick={() => setSelectedSampleId(s.id)}
                className={`bg-white p-3 rounded-xl border border-indigo-200/60 shadow-xs cursor-pointer hover:border-indigo-400 transition-all ${
                  selectedSampleId === s.id ? 'border-indigo-500 ring-1 ring-indigo-500/50' : ''
                }`}
                id={`sample-card-${s.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold text-indigo-500 uppercase">Vial: {s.vialPosition}</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">{s.name}</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">BC: {s.barcode}</p>
                
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] text-slate-400">Node: {instruments.find(i => i.id === s.assignedInstrumentId)?.name.split(' (')[1]?.replace(')', '') || 'HPLC'}</span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); shiftSampleState(s.id, s.status, 'backward'); }}
                      className="p-1 rounded bg-slate-50 text-slate-600 hover:bg-slate-100"
                      title="Move back"
                    >
                      ◀
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); shiftSampleState(s.id, s.status, 'forward'); }}
                      className="p-1 rounded bg-slate-50 text-slate-600 hover:bg-slate-100"
                      title="Mark Completed"
                    >
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="bg-emerald-50/20 p-4 rounded-2xl border border-emerald-100/40 flex flex-col h-[520px]" id="column-completed">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100/40 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-500" /> Completed
            </span>
            <span className="text-xs bg-emerald-100 px-2 py-0.5 rounded-full font-semibold font-mono text-emerald-700">
              {kanbanColumns.COMPLETED.length}
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 pr-1" id="cards-completed">
            {kanbanColumns.COMPLETED.map(s => (
              <div 
                key={s.id} 
                onClick={() => setSelectedSampleId(s.id)}
                className={`bg-white p-3 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-emerald-400 transition-all ${
                  selectedSampleId === s.id ? 'border-emerald-500 ring-1 ring-emerald-500/30' : ''
                }`}
                id={`sample-card-${s.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold text-slate-400 uppercase">Vial: {s.vialPosition}</span>
                  <span className="text-[8px] font-bold text-emerald-600 px-1 py-0.2 bg-emerald-50 rounded">GLP Integrated</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">{s.name}</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">BC: {s.barcode}</p>
                
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
                  <span>Assayed on: {instruments.find(i => i.id === s.assignedInstrumentId)?.name.split(' (')[1]?.replace(')', '') || 'HPLC'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 4: Failed */}
        <div className="bg-rose-50/20 p-4 rounded-2xl border border-rose-100/40 flex flex-col h-[520px]" id="column-failed">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100/40 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <AlertOctagon className="h-4 w-4 text-rose-500" /> Aborted / Failed
            </span>
            <span className="text-xs bg-rose-100 px-2 py-0.5 rounded-full font-semibold font-mono text-rose-700">
              {kanbanColumns.FAILED.length}
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 pr-1" id="cards-failed">
            {kanbanColumns.FAILED.map(s => (
              <div 
                key={s.id} 
                onClick={() => setSelectedSampleId(s.id)}
                className={`bg-white p-3 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-rose-400 transition-all ${
                  selectedSampleId === s.id ? 'border-rose-500 ring-1 ring-rose-500/30' : ''
                }`}
                id={`sample-card-${s.id}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold text-slate-400 uppercase">Vial: {s.vialPosition}</span>
                  <span className="text-[8px] font-bold text-rose-600 px-1 py-0.2 bg-rose-50 rounded">Aborted</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">{s.name}</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">BC: {s.barcode}</p>
                
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-rose-500">
                  <span className="flex items-center gap-1 font-semibold">
                    <ShieldAlert className="h-3 w-3" /> Press details to review error
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Selected Sample custody timeline */}
      {selectedSample && (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6" id="sample-custody-timeline">
          {/* Barcode graphic card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between items-center text-center space-y-3">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Printed Barcode Tag</span>
            <div className="p-3 bg-slate-50 rounded border border-slate-100 flex flex-col items-center">
              {/* Barcode simulator */}
              <Barcode className="h-12 w-48 text-slate-800" />
              <span className="text-xs font-mono font-bold text-slate-800 mt-2">{selectedSample.barcode}</span>
            </div>
            <div className="text-xs">
              <p className="font-semibold text-slate-800">{selectedSample.name}</p>
              <p className="text-slate-400 text-[10px]">Registered: {selectedSample.registeredDate}</p>
            </div>
          </div>

          {/* Chain of Custody Timeline Ledger */}
          <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-4">GLP Chain of Custody History</h3>
            
            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-100">
              {selectedSample.chainOfCustody.map((record, idx) => (
                <div key={idx} className="flex gap-4 text-xs relative">
                  <div className="h-7 w-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-500 z-10">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{record.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{record.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Executed by Operator: <span className="font-semibold text-slate-600">{record.operator}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Log Sample Modal */}
      {isRegOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Log API Sample in LIMS</h3>
              <button 
                onClick={() => setIsRegOpen(false)} 
                className="p-1 rounded bg-slate-50 text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sample / Material Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol Raw Material Lot #88"
                  value={sampleName}
                  onChange={(e) => setSampleName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded bg-slate-50 outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50 outline-none"
                  >
                    <option value="LOW">Low (Blank check)</option>
                    <option value="MEDIUM">Medium (Stability run)</option>
                    <option value="HIGH">High (Immediate Assay)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vial Slot Position</label>
                  <input
                    type="text"
                    required
                    placeholder="A-03"
                    value={vialPos}
                    onChange={(e) => setVialPos(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Method Specs</label>
                  <select
                    value={methodId}
                    onChange={(e) => setMethodId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50 outline-none"
                  >
                    {methods.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Instrument</label>
                  <select
                    value={instId}
                    onChange={(e) => setInstId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50 outline-none"
                  >
                    {instruments.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Inj Volume (uL)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={injVol}
                    onChange={(e) => setInjVol(parseFloat(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dilution Factor</label>
                  <input
                    type="number"
                    required
                    value={dilution}
                    onChange={(e) => setDilution(parseInt(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-center hover:bg-indigo-700 transition-colors"
              >
                Accept and Queue In LIMS
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
