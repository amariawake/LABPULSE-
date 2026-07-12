/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LabProvider } from './contexts/LabContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Import Modular Feature Components
import Dashboard from './features/Dashboard';
import Workstation from './features/Workstation';
import Instruments from './features/Instruments';
import Health from './features/Health';
import DigitalTwin from './features/DigitalTwin';
import SampleQueue from './features/SampleQueue';
import Methods from './features/Methods';
import CalibrationQC from './features/CalibrationQC';
import ReportsCOA from './features/ReportsCOA';
import Inventory from './features/Inventory';
import MaintenanceCalendar from './features/MaintenanceCalendar';
import AuditTrail from './features/AuditTrail';
import AIInsights from './features/AIInsights';
import Settings from './features/Settings';
import Login from './features/Login';
import AdminPanel from './features/AdminPanel';
import { useLab } from './contexts/LabContext';

function MainAppShell() {
  const { isAuthenticated, setActiveInstrumentId } = useLab();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleViewWorkstation = (id: string) => {
    setActiveInstrumentId(id);
    setActiveTab('workstation');
  };

  // Render correct panel based on active selection
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onViewWorkstation={handleViewWorkstation} />;
      case 'workstation':
        return <Workstation />;
      case 'instruments':
        return <Instruments onViewWorkstation={handleViewWorkstation} />;
      case 'health':
        return <Health />;
      case 'twin':
        return <DigitalTwin />;
      case 'samples':
        return <SampleQueue />;
      case 'methods':
        return <Methods />;
      case 'calibration':
        return <CalibrationQC />;
      case 'reports':
        return <ReportsCOA />;
      case 'inventory':
        return <Inventory />;
      case 'calendar':
        return <MaintenanceCalendar />;
      case 'audit':
        return <AuditTrail />;
      case 'insights':
        return <AIInsights />;
      case 'settings':
        return <Settings />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard onViewWorkstation={handleViewWorkstation} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800" id="labpulse-app-frame">
      {/* Sidebar (Navigation) */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" id="workspace-container">
        {/* Topbar */}
        <Topbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Scrollable Stage View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6" id="workspace-stage">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LabProvider>
      <MainAppShell />
    </LabProvider>
  );
}
