/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLab } from '../contexts/LabContext';
import { Network, Server, Router, Laptop, HelpCircle, Radio, Activity, Terminal } from 'lucide-react';

interface NetworkNode {
  id: string;
  label: string;
  type: 'GATEWAY' | 'ROUTER' | 'INSTRUMENT' | 'CLIENT';
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR';
  ipAddress: string;
  mac: string;
  packetsPerSec: number;
  x: number;
  y: number;
}

export default function DigitalTwin() {
  const { instruments } = useLab();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-gw');

  // Hardcoded core network nodes
  const coreNodes: NetworkNode[] = [
    { id: 'node-gw', label: 'LabPulse Central Cloud Gateway', type: 'GATEWAY', status: 'ONLINE', ipAddress: '10.240.10.1', mac: '00:1A:2B:3C:4D:5E', packetsPerSec: 154, x: 400, y: 50 },
    { id: 'node-r1', label: 'Lab Alpha Router (Floor 2)', type: 'ROUTER', status: 'ONLINE', ipAddress: '10.240.11.1', mac: '00:1A:2B:3C:4D:6F', packetsPerSec: 84, x: 250, y: 150 },
    { id: 'node-r2', label: 'Lab Beta Router (Floor 4)', type: 'ROUTER', status: 'ONLINE', ipAddress: '10.240.12.1', mac: '00:1A:2B:3C:4D:7A', packetsPerSec: 42, x: 550, y: 150 }
  ];

  // Map active instruments to Network Nodes dynamically based on their status!
  const instrumentNodes: NetworkNode[] = instruments.map((inst, idx) => {
    // Distribute x positions based on lab allocation
    const isLab1 = inst.laboratoryId === 'lab-1';
    const xBase = isLab1 ? 120 : 480;
    const offsetIndex = idx % 3;
    
    let status: NetworkNode['status'] = 'ONLINE';
    if (inst.status === 'ERROR') status = 'ERROR';
    else if (inst.status === 'OFFLINE') status = 'OFFLINE';
    else if (inst.status === 'MAINTENANCE') status = 'WARNING';

    return {
      id: `node-${inst.id}`,
      label: inst.name,
      type: 'INSTRUMENT',
      status,
      ipAddress: `10.240.${isLab1 ? '11' : '12'}.${50 + idx}`,
      mac: `00:1A:2B:3C:${idx}F:${50 + idx}`,
      packetsPerSec: inst.status === 'RUNNING' ? 24 : inst.status === 'IDLE' ? 2 : 0,
      x: xBase + offsetIndex * 130,
      y: 280
    };
  });

  const allNodes = [...coreNodes, ...instrumentNodes];

  const selectedNode = allNodes.find(n => n.id === selectedNodeId);

  return (
    <div className="space-y-6" id="digital-twin-module">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <Network className="text-indigo-600 h-6 w-6" />
            LIMS Digital Twin Network Topology
          </h1>
          <p className="text-xs text-slate-500">Live hardware mapping, TCP packet diagnostics, and physical network nodes.</p>
        </div>
        <div className="text-xs text-slate-400 font-mono mt-2 md:mt-0">
          Modbus TCP/IP • Gateway active
        </div>
      </div>

      {/* Main Grid: Interactive Canvas and Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="twin-main-grid">
        {/* Network Canvas (3 cols) */}
        <div className="lg:col-span-3 bg-slate-950 p-5 rounded-2xl border border-slate-900 shadow-md relative min-h-[400px] flex flex-col justify-between overflow-hidden" id="twin-canvas-card">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="text-xs font-bold font-mono tracking-tight text-white flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                ACTIVE NETWORK MESH (60FPS DIAGNOSTICS)
              </h3>
              <p className="text-[10px] text-slate-400">Click any network node to display TCP packet rates and hardware specs</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Online</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Warn</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span> Fail</span>
            </div>
          </div>

          {/* SVG Map */}
          <div className="relative my-4 overflow-hidden rounded-xl border border-white/5 bg-black/40 flex justify-center items-center">
            <svg viewBox="0 0 800 380" className="w-full h-auto select-none" id="digital-twin-svg">
              {/* Draw Connections */}
              {/* Cloud Gateway to Lab Routers */}
              <path d="M 400 50 Q 325 100 250 150" fill="none" stroke="#1e293b" strokeWidth="2" strokeDasharray="5,5" />
              <path d="M 400 50 Q 475 100 550 150" fill="none" stroke="#1e293b" strokeWidth="2" strokeDasharray="5,5" />

              {/* Pulsing connection animation lines (Glow wires) */}
              <path d="M 400 50 Q 325 100 250 150" fill="none" stroke="#3b82f6" strokeWidth="1.5" className="opacity-40" strokeDasharray="15, 120" strokeDashoffset="15" />
              <path d="M 400 50 Q 475 100 550 150" fill="none" stroke="#3b82f6" strokeWidth="1.5" className="opacity-40" strokeDasharray="15, 120" strokeDashoffset="-35" />

              {/* Lab 1 Router to Instruments */}
              {instrumentNodes.filter(n => n.ipAddress.includes('.11.')).map(instNode => (
                <g key={instNode.id}>
                  <line x1="250" y1="150" x2={instNode.x} y2={instNode.y} stroke="#1e293b" strokeWidth="1.5" />
                  {instNode.status === 'ONLINE' && (
                    <line x1="250" y1="150" x2={instNode.x} y2={instNode.y} stroke="#3b82f6" strokeWidth="1" strokeDasharray="10, 40" strokeDashoffset="5" className="opacity-40" />
                  )}
                </g>
              ))}

              {/* Lab 2 Router to Instruments */}
              {instrumentNodes.filter(n => n.ipAddress.includes('.12.')).map(instNode => (
                <g key={instNode.id}>
                  <line x1="550" y1="150" x2={instNode.x} y2={instNode.y} stroke="#1e293b" strokeWidth="1.5" />
                  {instNode.status === 'ONLINE' && (
                    <line x1="550" y1="150" x2={instNode.x} y2={instNode.y} stroke="#3b82f6" strokeWidth="1" strokeDasharray="10, 40" strokeDashoffset="-15" className="opacity-40" />
                  )}
                </g>
              ))}

              {/* Draw Nodes */}
              {allNodes.map(node => {
                const isSelected = selectedNodeId === node.id;
                let colorClass = "#64748b"; // Offline grey
                if (node.status === 'ONLINE') colorClass = "#10b981"; // green
                else if (node.status === 'WARNING') colorClass = "#f59e0b"; // amber
                else if (node.status === 'ERROR') colorClass = "#ef4444"; // red

                let iconType = Server;
                if (node.type === 'ROUTER') iconType = Router;
                else if (node.type === 'INSTRUMENT') iconType = Radio;

                return (
                  <g 
                    key={node.id} 
                    className="cursor-pointer group"
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    {/* Ring glow if selected */}
                    {isSelected && (
                      <circle cx={node.x} cy={node.y} r="24" fill="none" stroke="#818cf8" strokeWidth="2" className="opacity-75" />
                    )}
                    
                    {/* Node anchor base */}
                    <circle 
                      cx={node.x} 
                      cy={node.y} 
                      r="16" 
                      fill="#0f172a" 
                      stroke={colorClass} 
                      strokeWidth="2" 
                      className="transition-colors group-hover:fill-slate-800"
                    />

                    {/* Small inner pulse */}
                    {node.status === 'ONLINE' && node.packetsPerSec > 0 && (
                      <circle cx={node.x} cy={node.y} r="20" fill="none" stroke="#10b981" strokeWidth="1" className="animate-ping opacity-30" />
                    )}

                    {/* Label */}
                    <rect x={node.x - 50} y={node.y + 22} width="100" height="15" rx="3" fill="#020617" className="opacity-90 stroke-white/5" strokeWidth="0.5" />
                    <text x={node.x} y={node.y + 32} textAnchor="middle" className="text-[8px] font-mono fill-slate-300 font-bold">
                      {node.label.length > 15 ? node.label.substring(0, 12) + '...' : node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Node Details sidecard */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between" id="twin-diagnostic-card">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Node Diagnostics</h3>
            
            {selectedNode ? (
              <div className="space-y-4 text-xs" id="twin-diagnostics">
                <div>
                  <p className="text-[10px] text-slate-400 font-mono uppercase">Node Name</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedNode.label}</p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-400 font-mono uppercase">Status</p>
                    <span className="inline-block mt-0.5 font-semibold text-emerald-600">{selectedNode.status}</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-mono uppercase">Class</p>
                    <span className="inline-block mt-0.5 font-semibold text-slate-700">{selectedNode.type}</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-mono uppercase">TCP/IP Network IP</p>
                  <p className="font-mono text-slate-700 mt-0.5 font-semibold">{selectedNode.ipAddress}</p>
                </div>

                <div className="pt-2.5 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-mono uppercase">Hardware MAC Address</p>
                  <p className="font-mono text-slate-700 mt-0.5">{selectedNode.mac}</p>
                </div>

                {/* Packet rate metrics */}
                <div className="pt-2.5 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 font-mono uppercase flex items-center gap-1">
                    <Activity className="h-3 w-3 text-emerald-500" />
                    Data Transfer Rate
                  </p>
                  <p className="font-mono text-slate-700 font-bold text-sm mt-0.5">
                    {selectedNode.packetsPerSec} <span className="text-[10px] font-normal text-slate-400">pkts / sec</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 italic">
                Select a network node from the topology diagram to load hardware LIMS credentials.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100" id="twin-modbus-log">
            <span className="text-[9px] uppercase font-mono font-bold text-slate-400 flex items-center gap-1">
              <Terminal className="h-3 w-3 text-indigo-500" /> System Modbus Logs
            </span>
            <div className="bg-slate-900 p-2 rounded-lg mt-1 text-[9px] font-mono text-emerald-400 overflow-hidden h-16 leading-tight">
              &gt; TCP handshake ok<br />
              &gt; Gateway socket bind 0.0.0.0:3000<br />
              &gt; Modbus query register...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
