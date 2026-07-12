/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  Calendar, Clock, Plus, Trash2, CalendarRange, 
  Wrench, ShieldAlert, CheckCircle2, UserCheck 
} from 'lucide-react';

export default function MaintenanceCalendar() {
  const { 
    reservations, setReservations, instruments, addReservation, 
    maintenance, addMaintenanceRecord, addAuditLog 
  } = useLab();

  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isMaintOpen, setIsMaintOpen] = useState(false);

  // Form states - Booking
  const [bookInstId, setBookInstId] = useState(instruments[0]?.id || '');
  const [bookTitle, setBookTitle] = useState('');
  const [bookStart, setBookStart] = useState('2026-07-12T09:00');
  const [bookEnd, setBookEnd] = useState('2026-07-12T12:00');

  // Form states - Maintenance
  const [maintInstId, setMaintInstId] = useState(instruments[0]?.id || '');
  const [maintType, setMaintType] = useState<'Preventative' | 'Calibration' | 'Repair'>('Preventative');
  const [maintNotes, setMaintNotes] = useState('');
  const [maintEngineer, setMaintEngineer] = useState('Sarah Jenkins');

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle) return;

    addReservation({
      instrumentId: bookInstId,
      title: bookTitle,
      startTime: bookStart,
      endTime: bookEnd,
      operator: 'amariawake0707@gmail.com'
    });

    setBookTitle('');
    setIsBookOpen(false);
  };

  const handleMaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintNotes) return;

    addMaintenanceRecord({
      instrumentId: maintInstId,
      type: maintType,
      notes: maintNotes,
      engineer: maintEngineer,
      date: new Date().toLocaleDateString(),
      nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString() // +6 months
    });

    setMaintNotes('');
    setIsMaintOpen(false);
  };

  return (
    <div className="space-y-6" id="maint-calendar-module">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Calibration Calendars & Reservations</h1>
          <p className="text-xs text-slate-500">Schedule column runs, register preventive cleanups, and request certified technician repair dispatches.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBookOpen(true)}
            className="px-3.5 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            Book Run Block
          </button>
          <button
            onClick={() => setIsMaintOpen(true)}
            className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-indigo-700 transition-all"
          >
            Log Maintenance Action
          </button>
        </div>
      </div>

      {/* Grid: Calendar on Left, Recent logs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="maint-main-grid">
        {/* Calendar visualizer list (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4" id="calendar-schedule-panel">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <CalendarRange className="h-5 w-5 text-indigo-500" />
            Active Instrument Bookings Ledger
          </h3>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {reservations.map(res => {
              const device = instruments.find(i => i.id === res.instrumentId);
              return (
                <div key={res.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-center justify-between" id={`res-${res.id}`}>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{res.title}</h4>
                    <p className="text-slate-400 text-[10px] mt-0.5 font-mono uppercase">Node: {device?.name || 'Assigned'}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-mono">
                      <span>Start: {res.startTime.replace('T', ' ')}</span>
                      <span>End: {res.endTime.replace('T', ' ')}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded">
                    Operator: {res.operator.split('@')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preventative Maintenance Schedules (1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between" id="maint-logs-panel">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Wrench className="h-5 w-5 text-indigo-500" />
              OEM Service Schedule
            </h3>
            <p className="text-xs text-slate-500">Technician certification cycles remaining for all active hardware nodes.</p>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {instruments.map(i => {
                const isOverdue = i.maintenanceCountdown < 0;
                return (
                  <div key={i.id} className="p-2.5 bg-slate-50 rounded-lg text-[11px] flex items-center justify-between border border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-800">{i.name.split(' (')[1]?.replace(')', '') || i.name}</p>
                      <p className="text-slate-400 text-[9px] font-mono">ID: {i.id}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isOverdue ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {isOverdue ? 'Overdue' : `${i.maintenanceCountdown} days`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1.5">
            <UserCheck className="h-4 w-4 text-emerald-500" /> Certified Engineers Logged: 3
          </div>
        </div>
      </div>

      {/* Booking Dialog Modal */}
      {isBookOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Book Run Reservation</h3>
              <button onClick={() => setIsBookOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reservation Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aspirin Impurities Block B"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded bg-slate-50 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hardware asset</label>
                <select
                  value={bookInstId}
                  onChange={(e) => setBookInstId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded bg-slate-50 outline-none"
                >
                  {instruments.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={bookStart}
                    onChange={(e) => setBookStart(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={bookEnd}
                    onChange={(e) => setBookEnd(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 text-white rounded font-bold text-center hover:bg-indigo-700"
              >
                Approve Reservation block
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Dialog Modal */}
      {isMaintOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Log Maintenance Record</h3>
              <button onClick={() => setIsMaintOpen(false)} className="text-slate-400">×</button>
            </div>

            <form onSubmit={handleMaintSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Hardware asset</label>
                <select
                  value={maintInstId}
                  onChange={(e) => setMaintInstId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded bg-slate-50 outline-none"
                >
                  {instruments.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Classification</label>
                  <select
                    value={maintType}
                    onChange={(e) => setMaintType(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50 outline-none"
                  >
                    <option value="Preventative">Preventative</option>
                    <option value="Calibration">Calibration</option>
                    <option value="Repair">Repair</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Signed technician</label>
                  <input
                    type="text"
                    required
                    value={maintEngineer}
                    onChange={(e) => setMaintEngineer(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded bg-slate-50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service & Resolution Notes</label>
                <textarea
                  required
                  placeholder="e.g. Replaced proportioning valve, verified pressure baseline noise..."
                  value={maintNotes}
                  onChange={(e) => setMaintNotes(e.target.value)}
                  className="w-full p-2 h-20 border border-slate-200 rounded bg-slate-50 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 text-white rounded font-bold text-center hover:bg-indigo-700"
              >
                Log Service Action
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
