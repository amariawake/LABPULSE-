/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLab } from '../contexts/LabContext';
import { InventoryItem } from '../types';
import { Search, ShoppingCart, AlertCircle, CheckCircle, Package, ArrowUpRight } from 'lucide-react';

export default function Inventory() {
  const { inventory, setInventory, addAuditLog } = useLab();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.catalogNumber.toLowerCase().includes(search.toLowerCase());
    const matchesCat = catFilter === 'ALL' || item.category === catFilter;
    return matchesSearch && matchesCat;
  });

  // Reorder simulation
  const handleReorder = (id: string, name: string) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: item.quantity + 5, status: 'IN_STOCK' };
      }
      return item;
    }));
    addAuditLog('SYSTEM', 'Inventory Restock', `Dispatched automated reorder purchase request for item: ${name}`);
  };

  return (
    <div className="space-y-6" id="inventory-module">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Chemicals & Columns Inventory</h1>
        <p className="text-xs text-slate-500">Asset-tracking and automated purchase dispatching for laboratory consumables.</p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search catalog by name, model number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs outline-none bg-slate-50 focus:bg-white focus:border-indigo-500 transition-colors"
          />
        </div>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
        >
          <option value="ALL">All Categories</option>
          <option value="Columns">Columns</option>
          <option value="Solvents">Solvents</option>
          <option value="Reagents">Reagents</option>
          <option value="Standards">Reference Standards</option>
          <option value="Consumables">Consumables</option>
        </select>
      </div>

      {/* Inventory Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="inventory-grid">
        {filteredItems.map(item => {
          const isLow = item.status === 'LOW';
          const isOut = item.status === 'OUT_OF_STOCK';

          let statusClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
          let circleColor = "bg-emerald-500";
          if (isLow) {
            statusClass = "bg-amber-50 text-amber-700 border-amber-200";
            circleColor = "bg-amber-500";
          } else if (isOut) {
            statusClass = "bg-rose-50 text-rose-700 border-rose-200 animate-pulse";
            circleColor = "bg-rose-500";
          }

          return (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-4" id={`inv-${item.id}`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[9px] font-bold text-slate-600">
                    {item.category}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${statusClass}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${circleColor}`}></span>
                    {item.status.replace(/_/g, " ")}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mt-3 line-clamp-2">{item.name}</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Catalog S/N: {item.catalogNumber}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">In Stock:</span>
                  <p className="text-base font-bold font-mono text-slate-800">{item.quantity} {item.unit}</p>
                </div>
                {(isLow || isOut) && (
                  <button
                    onClick={() => handleReorder(item.id, item.name)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold rounded hover:bg-indigo-100 text-[10px] transition-colors"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Reorder +5
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
