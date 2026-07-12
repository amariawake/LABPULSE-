/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InstrumentType = 'HPLC' | 'UHPLC' | 'GC';

export type InstrumentStatus = 'RUNNING' | 'IDLE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';

export interface SensorData {
  pressure: number; // bar or psi
  flowRate: number; // mL/min
  temperature: number; // °C
  detectorSignal: number; // mAU or Hz
}

export interface Instrument {
  id: string;
  name: string;
  type: InstrumentType;
  vendor: string;
  serialNumber: string;
  department: string;
  status: InstrumentStatus;
  healthScore: number;
  firmware: string;
  connectionType: 'Ethernet' | 'USB' | 'RS-232';
  sensorData: SensorData;
  lampHours: number;
  maintenanceCountdown: number; // days remaining
  methodId: string;
  currentSampleId?: string;
  laboratoryId: string;
}

export type SampleStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface CustodyRecord {
  timestamp: string;
  action: string;
  operator: string;
}

export interface Sample {
  id: string;
  name: string;
  barcode: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  assignedMethodId: string;
  assignedInstrumentId: string;
  status: SampleStatus;
  chainOfCustody: CustodyRecord[];
  injectionVolume: number; // uL
  dilutionFactor: number;
  vialPosition: string;
  registeredDate: string;
}

export type MethodStatus = 'APPROVED' | 'DRAFT' | 'PENDING_APPROVAL';

export interface MethodParams {
  flowRate: number;
  tempColumn: number;
  solventA: string;
  solventB: string;
  detectorWavelength: number; // nm
  runTime: number; // minutes
}

export interface MethodHistory {
  version: string;
  date: string;
  changedBy: string;
  comment: string;
}

export interface Method {
  id: string;
  name: string;
  type: InstrumentType;
  version: string;
  status: MethodStatus;
  parameters: MethodParams;
  approvedBy?: string;
  approvalDate?: string;
  history: MethodHistory[];
}

export interface SequenceItem {
  id: string;
  sampleId: string;
  vialPosition: string;
  injectionOrder: number;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export interface Notification {
  id: string;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  title: string;
  message: string;
  instrumentId?: string;
  read: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  category: 'INSTRUMENT' | 'SAMPLE' | 'METHOD' | 'SECURITY' | 'CALIBRATION' | 'SYSTEM' | 'MAINTENANCE';
  details: string;
  ipAddress: string;
}

export interface CalibrationCurve {
  id: string;
  analyte: string;
  points: { concentration: number; peakArea: number }[];
  slope: number;
  intercept: number;
  r2: number;
  date: string;
  methodId: string;
}

export interface QCResult {
  id: string;
  timestamp: string;
  instrumentId: string;
  analyte: string;
  expectedValue: number;
  measuredValue: number;
  status: 'PASS' | 'WARN' | 'FAIL';
  suitabilityParams: {
    plates: number; // Theoretical plates
    tailing: number; // Tailing factor (USP)
    resolution: number; // Resolution from preceding peak
  };
}

export interface ChromatogramPoint {
  time: number; // minutes
  signal: number; // mAU or Hz
}

export interface ChromatogramRun {
  id: string;
  sampleId: string;
  instrumentId: string;
  methodId: string;
  date: string;
  peaks: {
    id: string;
    name: string;
    retentionTime: number; // min
    peakArea: number; // mAU*sec
    peakHeight: number; // mAU
    plates: number;
    tailing: number;
    comment?: string;
  }[];
  points: ChromatogramPoint[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Columns' | 'Solvents' | 'Reagents' | 'Standards' | 'Consumables';
  quantity: number;
  unit: string;
  minQuantity: number;
  supplier: string;
  catalogNumber: string;
  status: 'IN_STOCK' | 'LOW' | 'OUT_OF_STOCK';
}

export interface MaintenanceRecord {
  id: string;
  instrumentId: string;
  date: string;
  type: 'Preventative' | 'Calibration' | 'Repair' | 'Emergency';
  engineer: string;
  notes: string;
  nextDueDate: string;
}

export interface Reservation {
  id: string;
  instrumentId: string;
  operator: string;
  startTime: string;
  endTime: string;
  title: string;
}
