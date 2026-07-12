/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLab } from '../contexts/LabContext';
import { Search, Database, Calendar, ShieldCheck, Download, Printer } from 'lucide-react';

export default function AuditTrail() {
  const { auditLogs } = useLab();
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            log.operator.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = catFilter === 'ALL' || log.category === catFilter;
      return matchesSearch && matchesCat;
    });
  }, [auditLogs, searchQuery, catFilter]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="audit-trail-module">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <Database className="h-6 w-6 text-indigo-600" />
            21 CFR Part 11 Compliance Audit Trail
          </h1>
          <p className="text-xs text-slate-500">Unmodifiable, cryptographically-linked custody ledger for quality assurance inspectors.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" /> Export Audit Log PDF
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs by operator, action, Details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white focus:border-indigo-500 transition-colors"
          />
        </div>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
        >
          <option value="ALL">All Categories</option>
          <option value="INSTRUMENT">Instrument Actions</option>
          <option value="SAMPLE">Sample Actions</option>
          <option value="METHOD">Method Actions</option>
          <option value="SECURITY">Security / Login</option>
          <option value="CALIBRATION">Calibration</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      {/* Main Ledger List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs" id="audit-ledger-stage">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-500 border-collapse">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[10px] font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Verification Stamp</th>
                <th className="py-3 px-4 font-semibold">LIMS Category</th>
                <th className="py-3 px-4 font-semibold">Operator Account</th>
                <th className="py-3 px-4 font-semibold">Action Executed</th>
                <th className="py-3 px-4 font-semibold">Analytical Details / Modification Comment</th>
                <th className="py-3 px-4 font-semibold">LIMS Terminal IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[10px] flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[10px] font-mono text-indigo-600">{log.category}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{log.operator}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{log.action}</td>
                  <td className="py-3.5 px-4 text-slate-500 italic">{log.details}</td>
                  <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
