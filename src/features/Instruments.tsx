/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLab } from '../contexts/LabContext';
import { Instrument, InstrumentType, InstrumentStatus } from '../types';
import { 
  Search, Filter, Plus, Edit2, Check, X, Shield, 
  Settings, PenTool as Tool, Signal, Activity 
} from 'lucide-react';

export default function Instruments() {
  const { 
    instruments, setInstruments, registerInstrument, editInstrument, 
    maintenance, selectedLabId, labs, addAuditLog 
  } = useLab();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Dialog state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedInstId, setSelectedInstId] = useState<string | null>(null);

  // Register Form states
  const [newInstName, setNewInstName] = useState('');
  const [newInstType, setNewInstType] = useState<InstrumentType>('HPLC');
  const [newInstVendor, setNewInstVendor] = useState('Agilent Technologies');
  const [newInstSNo, setNewInstSNo] = useState('');
  const [newInstDept, setNewInstDept] = useState('Quality Control');
  const [newInstConn, setNewInstConn] = useState<'Ethernet' | 'USB' | 'RS-232'>('Ethernet');
  const [newInstFirmware, setNewInstFirmware] = useState('A.01.01');

  // Filtered instruments
  const filteredInstruments = useMemo(() => {
    return instruments.filter(i => {
      // Filter by lab
      if (i.laboratoryId !== selectedLabId) return false;
      
      // Filter by query
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            i.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            i.vendor.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by type
      const matchesType = typeFilter === 'ALL' || i.type === typeFilter;

      // Filter by status
      const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [instruments, selectedLabId, searchQuery, typeFilter, statusFilter]);

  // Handle register submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstName || !newInstSNo) return;

    registerInstrument({
      name: newInstName,
      type: newInstType,
      vendor: newInstVendor,
      serialNumber: newInstSNo,
      department: newInstDept,
      connectionType: newInstConn,
      firmware: newInstFirmware,
      lampHours: 0,
      maintenanceCountdown: 180, // 6 months standard
      methodId: 'met-01',
      laboratoryId: selectedLabId
    });

    // Reset Form
    setNewInstName('');
    setNewInstSNo('');
    setIsRegisterOpen(false);
  };

  return (
    <div className="space-y-6" id="instruments-module">
      {/* Upper command row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Instrument Asset Registry</h1>
          <p className="text-xs text-slate-500">Inventory control and LIMS metadata management for chromatography hardware.</p>
        </div>
        <button
          onClick={() => setIsRegisterOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-indigo-700 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Register Instrument
        </button>
      </div>

      {/* Filter and Search controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, serial number, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-mono text-slate-400">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="HPLC">HPLC</option>
              <option value="UHPLC">UHPLC</option>
              <option value="GC">GC</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-mono text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="RUNNING">Running</option>
              <option value="IDLE">Idle</option>
              <option value="ERROR">Error</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs" id="instruments-grid">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-500 border-collapse">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Instrument Name</th>
                <th className="py-3 px-4 font-semibold">LIMS ID</th>
                <th className="py-3 px-4 font-semibold">Classification</th>
                <th className="py-3 px-4 font-semibold">Vendor & OEM S/N</th>
                <th className="py-3 px-4 font-semibold">Connection Port</th>
                <th className="py-3 px-4 font-semibold">Firmware</th>
                <th className="py-3 px-4 font-semibold text-center">Health Score</th>
                <th className="py-3 px-4 font-semibold">Status Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInstruments.map(i => {
                const isRunning = i.status === 'RUNNING';
                const isError = i.status === 'ERROR';
                const isMaint = i.status === 'MAINTENANCE';
                const isOffline = i.status === 'OFFLINE';

                let badgeClass = "bg-slate-100 text-slate-800";
                if (isRunning) badgeClass = "bg-indigo-50 text-indigo-700 border border-indigo-200";
                else if (isError) badgeClass = "bg-rose-50 text-rose-700 border border-rose-200";
                else if (isMaint) badgeClass = "bg-amber-50 text-amber-700 border border-amber-200";
                else if (isOffline) badgeClass = "bg-zinc-100 text-zinc-600 border border-zinc-200";

                return (
                  <tr 
                    key={i.id} 
                    onClick={() => setSelectedInstId(selectedInstId === i.id ? null : i.id)}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                      selectedInstId === i.id ? 'bg-indigo-50/20' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900">{i.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{i.department} Dept</div>
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold text-slate-600">{i.id}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded bg-black/5 font-mono text-[10px] font-bold text-slate-700">
                        {i.type}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-800">{i.vendor}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">S/N: {i.serialNumber}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                        <Signal className="h-3 w-3 text-emerald-500" /> {i.connectionType}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-400">{i.firmware}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`font-semibold font-mono text-xs ${
                        i.healthScore >= 90 ? 'text-emerald-600' : i.healthScore >= 75 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {i.healthScore}%
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-semibold tracking-wide uppercase ${badgeClass}`}>
                        {i.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Instrument Expandable Panel (Maintenance History) */}
      {selectedInstId && (
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200" id="maint-panel-expand">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            GLP Calibration & Maintenance Records for {instruments.find(i => i.id === selectedInstId)?.name}
          </h3>
          <div className="space-y-3">
            {maintenance.filter(m => m.instrumentId === selectedInstId).length > 0 ? (
              maintenance.filter(m => m.instrumentId === selectedInstId).map(record => (
                <div key={record.id} className="bg-white p-4 rounded-xl border border-slate-200 text-xs shadow-xs flex items-start gap-3">
                  <div className="p-2 rounded bg-indigo-50 text-indigo-600">
                    <Tool className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span>{record.type} Service Completed</span>
                      <span className="text-slate-400">{record.date}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{record.notes}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                      <span>Serviced by: {record.engineer}</span>
                      <span>Next Due Date: {record.nextDueDate}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-6 text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-200 text-xs">
                No active service history records found for this instrument. Preventative Maintenance scheduled at next 6-month interval.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Register Instrument Modal Overlay */}
      {isRegisterOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Register LIMS Hardware Node</h3>
              <button 
                onClick={() => setIsRegisterOpen(false)} 
                className="p-1 rounded bg-slate-50 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instrument Custom Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Agilent HPLC-05 (Block B)"
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Instrument Classification</label>
                  <select
                    value={newInstType}
                    onChange={(e) => setNewInstType(e.target.value as InstrumentType)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                  >
                    <option value="HPLC">HPLC</option>
                    <option value="UHPLC">UHPLC</option>
                    <option value="GC">GC</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">OEM Vendor</label>
                  <select
                    value={newInstVendor}
                    onChange={(e) => setNewInstVendor(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                  >
                    <option value="Agilent Technologies">Agilent Technologies</option>
                    <option value="Waters Corporation">Waters Corporation</option>
                    <option value="Shimadzu">Shimadzu</option>
                    <option value="Thermo Scientific">Thermo Scientific</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Serial Number (S/N)</label>
                  <input
                    type="text"
                    required
                    placeholder="DEAE82931"
                    value={newInstSNo}
                    onChange={(e) => setNewInstSNo(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newInstDept}
                    onChange={(e) => setNewInstDept(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interface Port</label>
                  <select
                    value={newInstConn}
                    onChange={(e) => setNewInstConn(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                  >
                    <option value="Ethernet">Ethernet (LIMS Node)</option>
                    <option value="USB">USB</option>
                    <option value="RS-232">RS-232 Serial</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Firmware version</label>
                  <input
                    type="text"
                    required
                    value={newInstFirmware}
                    onChange={(e) => setNewInstFirmware(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-center hover:bg-indigo-700 transition-colors"
              >
                Accept and Register Asset
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
