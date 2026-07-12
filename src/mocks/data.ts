/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Instrument, Sample, Method, InventoryItem, MaintenanceRecord, Reservation, AuditLog, Notification, CalibrationCurve, QCResult } from '../types';
import { generateChromatogramPoints, calculateIntegratedPeaks } from './chromatogramGenerator';

export const LABS = [
  { id: 'lab-1', name: 'GMP Quality Control - Block A', code: 'QC-A', location: 'Floor 2' },
  { id: 'lab-2', name: 'Analytical R&D - Block D', code: 'ARD-D', location: 'Floor 4' },
  { id: 'lab-3', name: 'Environmental Compliance Lab', code: 'ENV-C', location: 'Floor 1' }
];

export const INITIAL_METHODS: Method[] = [
  {
    id: 'met-01',
    name: 'Analgesic Assay (HPLC)',
    type: 'HPLC',
    version: '3.2',
    status: 'APPROVED',
    parameters: {
      flowRate: 1.2,
      tempColumn: 35.0,
      solventA: '0.1% Phosphoric Acid in Water',
      solventB: 'Acetonitrile',
      detectorWavelength: 254,
      runTime: 5.0
    },
    approvedBy: 'Dr. Helen Carter',
    approvalDate: '2026-04-12',
    history: [
      { version: '3.2', date: '2026-04-12', changedBy: 'Dr. Helen Carter', comment: 'Optimized gradient hold for Caffeine peak resolution' },
      { version: '3.1', date: '2025-11-02', changedBy: 'Marcus Chen', comment: 'Updated solvent brand specs' },
      { version: '3.0', date: '2025-05-18', changedBy: 'Dr. Helen Carter', comment: 'Initial version of analgesic assay' }
    ]
  },
  {
    id: 'met-02',
    name: 'Rapid API Impurities (UHPLC)',
    type: 'UHPLC',
    version: '1.4',
    status: 'APPROVED',
    parameters: {
      flowRate: 0.5,
      tempColumn: 45.0,
      solventA: '0.05% TFA in Water',
      solventB: '0.05% TFA in Methanol/Acetonitrile (50:50)',
      detectorWavelength: 220,
      runTime: 3.0
    },
    approvedBy: 'Dr. Helen Carter',
    approvalDate: '2026-01-20',
    history: [
      { version: '1.4', date: '2026-01-20', changedBy: 'Marcus Chen', comment: 'Increased backpressure limits for UHPLC column' },
      { version: '1.0', date: '2025-09-15', changedBy: 'Dr. Helen Carter', comment: 'Validated method draft transfered' }
    ]
  },
  {
    id: 'met-03',
    name: 'Residual Solvents USP <467> (GC)',
    type: 'GC',
    version: '2.1',
    status: 'APPROVED',
    parameters: {
      flowRate: 2.5,
      tempColumn: 120.0,
      solventA: 'Helium Carrier Gas',
      solventB: 'FID Detector Gas (H2 / Air)',
      detectorWavelength: 280, // Using index for GC oven ramp or detector Hz equivalent
      runTime: 7.0
    },
    approvedBy: 'Sarah Jenkins',
    approvalDate: '2026-03-08',
    history: [
      { version: '2.1', date: '2026-03-08', changedBy: 'Sarah Jenkins', comment: 'Adjusted split ratio to 10:1' },
      { version: '2.0', date: '2025-10-10', changedBy: 'Sarah Jenkins', comment: 'Transition to DB-624 capillary column' }
    ]
  },
  {
    id: 'met-04',
    name: 'Aspirin Hydrolysis Assay',
    type: 'HPLC',
    version: '1.0',
    status: 'PENDING_APPROVAL',
    parameters: {
      flowRate: 1.0,
      tempColumn: 30.0,
      solventA: '0.1% Formic Acid in Water',
      solventB: 'Acetonitrile',
      detectorWavelength: 280,
      runTime: 6.0
    },
    history: [
      { version: '1.0', date: '2026-07-02', changedBy: 'Alex Rivera', comment: 'Initial method definition for validation' }
    ]
  }
];

export const INITIAL_INSTRUMENTS: Instrument[] = [
  {
    id: 'inst-01',
    name: 'Agilent 1260 Infinity II (HPLC-01)',
    type: 'HPLC',
    vendor: 'Agilent Technologies',
    serialNumber: 'DEAE239102',
    department: 'Quality Control',
    status: 'RUNNING',
    healthScore: 94,
    firmware: 'A.02.26',
    connectionType: 'Ethernet',
    sensorData: { pressure: 245.3, flowRate: 1.20, temperature: 35.0, detectorSignal: 154.2 },
    lampHours: 1420,
    maintenanceCountdown: 18,
    methodId: 'met-01',
    currentSampleId: 'samp-01',
    laboratoryId: 'lab-1'
  },
  {
    id: 'inst-02',
    name: 'Waters ACQUITY Premier (UHPLC-01)',
    type: 'UHPLC',
    vendor: 'Waters Corporation',
    serialNumber: 'WTS8390124',
    department: 'Analytical R&D',
    status: 'IDLE',
    healthScore: 98,
    firmware: 'W.1.88',
    connectionType: 'Ethernet',
    sensorData: { pressure: 5.2, flowRate: 0.00, temperature: 22.1, detectorSignal: 0.1 },
    lampHours: 410,
    maintenanceCountdown: 142,
    methodId: 'met-02',
    laboratoryId: 'lab-2'
  },
  {
    id: 'inst-03',
    name: 'Shimadzu GC-2030 (GC-01)',
    type: 'GC',
    vendor: 'Shimadzu',
    serialNumber: 'SH2030-9281',
    department: 'Quality Control',
    status: 'RUNNING',
    healthScore: 89,
    firmware: 'S.3.12',
    connectionType: 'Ethernet',
    sensorData: { pressure: 85.1, flowRate: 2.50, temperature: 120.0, detectorSignal: 242.8 },
    lampHours: 3200, // columns hours or injection septum count
    maintenanceCountdown: 4,
    methodId: 'met-03',
    currentSampleId: 'samp-03',
    laboratoryId: 'lab-1'
  },
  {
    id: 'inst-04',
    name: 'Waters Alliance HPLC (HPLC-02)',
    type: 'HPLC',
    vendor: 'Waters Corporation',
    serialNumber: 'WTS742910',
    department: 'Environmental Compliance',
    status: 'MAINTENANCE',
    healthScore: 78,
    firmware: 'W.2.40',
    connectionType: 'RS-232',
    sensorData: { pressure: 0.0, flowRate: 0.00, temperature: 21.4, detectorSignal: 0.0 },
    lampHours: 2980,
    maintenanceCountdown: -1, // Overdue
    methodId: 'met-01',
    laboratoryId: 'lab-3'
  },
  {
    id: 'inst-05',
    name: 'Agilent 7890B GC (GC-02)',
    type: 'GC',
    vendor: 'Agilent Technologies',
    serialNumber: 'US1283921A',
    department: 'Analytical R&D',
    status: 'OFFLINE',
    healthScore: 85,
    firmware: 'B.02.05',
    connectionType: 'USB',
    sensorData: { pressure: 0.0, flowRate: 0.00, temperature: 20.8, detectorSignal: 0.0 },
    lampHours: 1950,
    maintenanceCountdown: 64,
    methodId: 'met-03',
    laboratoryId: 'lab-2'
  },
  {
    id: 'inst-06',
    name: 'Thermo Vanquish (UHPLC-02)',
    type: 'UHPLC',
    vendor: 'Thermo Scientific',
    serialNumber: 'TH6392019',
    department: 'Quality Control',
    status: 'ERROR',
    healthScore: 61,
    firmware: 'T.4.11',
    connectionType: 'Ethernet',
    sensorData: { pressure: 1042.8, flowRate: 0.45, temperature: 45.1, detectorSignal: 12.4 },
    lampHours: 1100,
    maintenanceCountdown: 35,
    methodId: 'met-02',
    laboratoryId: 'lab-1'
  }
];

export const INITIAL_SAMPLES: Sample[] = [
  {
    id: 'samp-01',
    name: 'Paracetamol API Lot #92837',
    barcode: 'LAB-2026-092837',
    priority: 'HIGH',
    assignedMethodId: 'met-01',
    assignedInstrumentId: 'inst-01',
    status: 'RUNNING',
    injectionVolume: 10.0,
    dilutionFactor: 100,
    vialPosition: 'A-01',
    registeredDate: '2026-07-11 14:20',
    chainOfCustody: [
      { timestamp: '2026-07-11 14:20', action: 'Sample Logged & Barcode Printed', operator: 'Alex Rivera' },
      { timestamp: '2026-07-11 15:45', action: 'Preparation & Dilution Completed', operator: 'Alex Rivera' },
      { timestamp: '2026-07-12 09:30', action: 'Mounted on Autosampler Carousel', operator: 'Alex Rivera' },
      { timestamp: '2026-07-12 10:05', action: 'Injection Sequence Started', operator: 'Alex Rivera' }
    ]
  },
  {
    id: 'samp-02',
    name: 'Ibuprofen Tablet Stability T=12M',
    barcode: 'LAB-2026-038291',
    priority: 'MEDIUM',
    assignedMethodId: 'met-01',
    assignedInstrumentId: 'inst-01',
    status: 'PENDING',
    injectionVolume: 20.0,
    dilutionFactor: 50,
    vialPosition: 'A-02',
    registeredDate: '2026-07-12 08:15',
    chainOfCustody: [
      { timestamp: '2026-07-12 08:15', action: 'Sample Logged from Stability Chambers', operator: 'Marcus Chen' },
      { timestamp: '2026-07-12 08:45', action: 'Standards and QC Prepared', operator: 'Marcus Chen' }
    ]
  },
  {
    id: 'samp-03',
    name: 'Methanol Residual Solvent Blank',
    barcode: 'LAB-2026-000281',
    priority: 'LOW',
    assignedMethodId: 'met-03',
    assignedInstrumentId: 'inst-03',
    status: 'RUNNING',
    injectionVolume: 1.0,
    dilutionFactor: 1,
    vialPosition: 'G-12',
    registeredDate: '2026-07-11 16:30',
    chainOfCustody: [
      { timestamp: '2026-07-11 16:30', action: 'Logged for compliance blank check', operator: 'Sarah Jenkins' },
      { timestamp: '2026-07-12 09:15', action: 'Injected into Shimadzu GC', operator: 'Sarah Jenkins' }
    ]
  },
  {
    id: 'samp-04',
    name: 'Aspirin Hydrolysis Assay QC-1',
    barcode: 'LAB-2026-094831',
    priority: 'MEDIUM',
    assignedMethodId: 'met-01',
    assignedInstrumentId: 'inst-01',
    status: 'COMPLETED',
    injectionVolume: 10.0,
    dilutionFactor: 10,
    vialPosition: 'A-05',
    registeredDate: '2026-07-11 10:00',
    chainOfCustody: [
      { timestamp: '2026-07-11 10:00', action: 'Sample Logged', operator: 'Alex Rivera' },
      { timestamp: '2026-07-11 11:30', action: 'Completed Running', operator: 'Agilent 1260' }
    ]
  },
  {
    id: 'samp-05',
    name: 'EPA Volatile Organics Calibration Standard',
    barcode: 'LAB-2026-078234',
    priority: 'HIGH',
    assignedMethodId: 'met-03',
    assignedInstrumentId: 'inst-03',
    status: 'PENDING',
    injectionVolume: 1.0,
    dilutionFactor: 1,
    vialPosition: 'G-01',
    registeredDate: '2026-07-12 07:00',
    chainOfCustody: [
      { timestamp: '2026-07-12 07:00', action: 'Calibration Stock Logged', operator: 'Sarah Jenkins' }
    ]
  },
  {
    id: 'samp-06',
    name: 'Unknown API Degradation Check B-12',
    barcode: 'LAB-2026-083921',
    priority: 'MEDIUM',
    assignedMethodId: 'met-02',
    assignedInstrumentId: 'inst-02',
    status: 'FAILED',
    injectionVolume: 5.0,
    dilutionFactor: 1000,
    vialPosition: 'B-04',
    registeredDate: '2026-07-10 11:00',
    chainOfCustody: [
      { timestamp: '2026-07-10 11:00', action: 'Logged for research study', operator: 'Marcus Chen' },
      { timestamp: '2026-07-10 13:40', action: 'Run Aborted: High backpressure limit exceeded (1050 bar)', operator: 'Waters ACQUITY' }
    ]
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-01', name: 'Agilent Zorbax C18 Column (4.6x150mm, 5um)', category: 'Columns', quantity: 3, unit: 'pcs', minQuantity: 1, supplier: 'Agilent Technologies', catalogNumber: '883952-702', status: 'IN_STOCK' },
  { id: 'inv-02', name: 'Waters ACQUITY C18 Column (2.1x50mm, 1.7um)', category: 'Columns', quantity: 1, unit: 'pcs', minQuantity: 2, supplier: 'Waters Corp', catalogNumber: '186002350', status: 'LOW' },
  { id: 'inv-03', name: 'HPLC Grade Acetonitrile (4L)', category: 'Solvents', quantity: 12, unit: 'bottles', minQuantity: 4, supplier: 'Fisher Scientific', catalogNumber: 'A998-4', status: 'IN_STOCK' },
  { id: 'inv-04', name: 'HPLC Grade Methanol (4L)', category: 'Solvents', quantity: 2, unit: 'bottles', minQuantity: 4, supplier: 'Sigma-Aldrich', catalogNumber: '34860', status: 'LOW' },
  { id: 'inv-05', name: 'Trifluoroacetic Acid (TFA) 99% (100ml)', category: 'Reagents', quantity: 5, unit: 'vials', minQuantity: 2, supplier: 'Sigma-Aldrich', catalogNumber: 'T6508', status: 'IN_STOCK' },
  { id: 'inv-06', name: 'USP Paracetamol Standard Reference Material', category: 'Standards', quantity: 0, unit: 'vials', minQuantity: 1, supplier: 'USP Reference Standards', catalogNumber: '1503009', status: 'OUT_OF_STOCK' },
  { id: 'inv-07', name: 'Autosampler Vials 2ml Clear with Cap (Pack 100)', category: 'Consumables', quantity: 15, unit: 'packs', minQuantity: 5, supplier: 'Restek', catalogNumber: '21140', status: 'IN_STOCK' }
];

export const INITIAL_MAINTENANCE: MaintenanceRecord[] = [
  { id: 'maint-01', instrumentId: 'inst-01', date: '2026-05-10', type: 'Preventative', engineer: 'Robert Vance (Agilent Certified)', notes: 'Replaced pump seals, outlet ball valves, and deuterated lamp. Calibrated wavelength accuracy (verified at 254nm and 656nm). System suitability passed.', nextDueDate: '2026-11-10' },
  { id: 'maint-02', instrumentId: 'inst-03', date: '2026-07-01', type: 'Calibration', engineer: 'Sarah Jenkins', notes: 'Replaced GC injector septum and liner. Baked out column overnight at 280°C to clear baseline bleed. Detector calibrated with VOC mix.', nextDueDate: '2026-08-01' },
  { id: 'maint-03', instrumentId: 'inst-04', date: '2026-01-15', type: 'Repair', engineer: 'Alex Rivera', notes: 'Addressed pump proportioning valve leak. System still shows high pressure fluctuation. Needs formal certified engineer visit.', nextDueDate: '2026-07-15' }
];

export const INITIAL_RESERVATIONS: Reservation[] = [
  { id: 'res-01', instrumentId: 'inst-01', operator: 'Alex Rivera', startTime: '2026-07-12T09:00:00', endTime: '2026-07-12T13:00:00', title: 'Analgesic Assay Batch #4' },
  { id: 'res-02', instrumentId: 'inst-02', operator: 'Marcus Chen', startTime: '2026-07-12T14:00:00', endTime: '2026-07-12T17:00:00', title: 'Active Principal Impurity Profiling' },
  { id: 'res-03', instrumentId: 'inst-03', operator: 'Sarah Jenkins', startTime: '2026-07-12T08:00:00', endTime: '2026-07-12T18:00:00', title: 'GC Compliance Residual Solvent Checks' }
];

export const INITIAL_CALIBRATIONS: CalibrationCurve[] = [
  {
    id: 'cal-01',
    analyte: 'Caffeine Reference Standard',
    methodId: 'met-01',
    points: [
      { concentration: 2.0, peakArea: 11200 },
      { concentration: 5.0, peakArea: 28400 },
      { concentration: 10.0, peakArea: 55900 },
      { concentration: 25.0, peakArea: 141200 },
      { concentration: 50.0, peakArea: 281800 }
    ],
    slope: 5634.2,
    intercept: -210.5,
    r2: 0.9998,
    date: '2026-07-11'
  },
  {
    id: 'cal-02',
    analyte: 'Acetaminophen Reference Standard',
    methodId: 'met-01',
    points: [
      { concentration: 5.0, peakArea: 18400 },
      { concentration: 10.0, peakArea: 37100 },
      { concentration: 20.0, peakArea: 73500 },
      { concentration: 50.0, peakArea: 186000 },
      { concentration: 100.0, peakArea: 370400 }
    ],
    slope: 3712.8,
    intercept: 140.2,
    r2: 0.9997,
    date: '2026-07-11'
  }
];

export const INITIAL_QC_RESULTS: QCResult[] = [
  { id: 'qc-01', timestamp: '2026-07-12 09:10', instrumentId: 'inst-01', analyte: 'Caffeine Control (10.0 ug/mL)', expectedValue: 10.0, measuredValue: 9.92, status: 'PASS', suitabilityParams: { plates: 14200, tailing: 1.04, resolution: 4.8 } },
  { id: 'qc-02', timestamp: '2026-07-12 09:12', instrumentId: 'inst-01', analyte: 'Paracetamol Control (20.0 ug/mL)', expectedValue: 20.0, measuredValue: 20.15, status: 'PASS', suitabilityParams: { plates: 8200, tailing: 1.11, resolution: 0.0 } },
  { id: 'qc-03', timestamp: '2026-07-11 15:40', instrumentId: 'inst-03', analyte: 'Ethanol GC System Suitability Check', expectedValue: 500, measuredValue: 512, status: 'PASS', suitabilityParams: { plates: 22000, tailing: 0.98, resolution: 8.2 } },
  { id: 'qc-04', timestamp: '2026-07-10 08:30', instrumentId: 'inst-06', analyte: 'UHPLC Peak Resolution Verification', expectedValue: 1.5, measuredValue: 1.35, status: 'WARN', suitabilityParams: { plates: 45000, tailing: 1.25, resolution: 1.35 } }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'not-01', timestamp: '2026-07-12 10:05', type: 'SUCCESS', title: 'Sequence Started', message: 'Analgesic Assay Batch #4 has been queued and successfully started on Agilent 1260 HPLC-01.', instrumentId: 'inst-01', read: false },
  { id: 'not-02', timestamp: '2026-07-12 09:42', type: 'ALERT', title: 'High Pressure Alarm', message: 'Thermo Vanquish UHPLC-02 encountered backpressure critical limit at 1042.8 bar. Safety system triggered shutdown.', instrumentId: 'inst-06', read: false },
  { id: 'not-03', timestamp: '2026-07-12 08:10', type: 'WARNING', title: 'Maintenance Countdown Overdue', message: 'Waters Alliance HPLC-02 has reached 0 days remaining on column preventative maintenance. Please schedule calibration immediately.', instrumentId: 'inst-04', read: true },
  { id: 'not-04', timestamp: '2026-07-11 17:00', type: 'INFO', title: 'Inventory Reorder Alert', message: 'USP Paracetamol Standard Reference Material has reached 0 vials. Autogenerated inventory reorder request submitted to Supplier.', read: true }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'aud-01', timestamp: '2026-07-12 10:05', operator: 'Alex Rivera', action: 'Sequence Launch', category: 'INSTRUMENT', details: 'Fired sample HPLC-01 injection sequence Analgesic Assay Batch #4', ipAddress: '10.240.11.82' },
  { id: 'aud-02', timestamp: '2026-07-12 09:30', operator: 'Alex Rivera', action: 'Sample Position Assumed', category: 'SAMPLE', details: 'Assigned vial position A-01 to sample Paracetamol API Lot #92837', ipAddress: '10.240.11.82' },
  { id: 'aud-03', timestamp: '2026-07-12 08:15', operator: 'Sarah Jenkins', action: 'Instrument Calibration Update', category: 'CALIBRATION', details: 'Completed custom septum bake-out calibration record on GC-01', ipAddress: '10.240.11.104' },
  { id: 'aud-04', timestamp: '2026-07-11 14:10', operator: 'Dr. Helen Carter', action: 'Method Approved', category: 'METHOD', details: 'Approved Analgesic Assay (HPLC) Method to version 3.2', ipAddress: '10.240.10.15' },
  { id: 'aud-05', timestamp: '2026-07-11 09:12', operator: 'System Security', action: 'User Logged In', category: 'SECURITY', details: 'User amariawake0707@gmail.com authenticated securely with level Administrator', ipAddress: '10.240.11.5' }
];

/**
 * Helper to generate pre-made completed runs
 */
export function generateCompletedRun(sampleId: string, instrumentId: string, methodId: string): any {
  const sample = INITIAL_SAMPLES.find(s => s.id === sampleId);
  const inst = INITIAL_INSTRUMENTS.find(i => i.id === instrumentId);
  const met = INITIAL_METHODS.find(m => m.id === methodId);

  const type = inst ? inst.type : 'HPLC';
  const points = generateChromatogramPoints(type, met?.parameters.runTime || 5.0, undefined, 0.4);
  const peaks = calculateIntegratedPeaks(type);

  return {
    id: `run-${sampleId}`,
    sampleId,
    sampleName: sample?.name || 'Standard Run',
    instrumentId,
    instrumentName: inst?.name || 'LC Workstation',
    methodId,
    methodName: met?.name || 'Default Method',
    date: '2026-07-11 11:30',
    peaks,
    points
  };
}
