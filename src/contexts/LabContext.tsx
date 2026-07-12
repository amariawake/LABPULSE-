/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { 
  Instrument, Sample, Method, InventoryItem, MaintenanceRecord, 
  Reservation, AuditLog, Notification, CalibrationCurve, QCResult, 
  ChromatogramPoint, SampleStatus, InstrumentStatus, InstrumentType
} from '../types';
import { 
  LABS, INITIAL_INSTRUMENTS, INITIAL_SAMPLES, INITIAL_METHODS, 
  INITIAL_INVENTORY, INITIAL_MAINTENANCE, INITIAL_RESERVATIONS, 
  INITIAL_CALIBRATIONS, INITIAL_QC_RESULTS, INITIAL_NOTIFICATIONS, 
  INITIAL_AUDIT_LOGS, generateCompletedRun
} from '../mocks/data';
import { METHOD_PEAKS } from '../mocks/chromatogramGenerator';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tfaEnabled: boolean;
  tfaSecret: string;
  lastSignIn: string;
  status: 'ACTIVE' | 'REVOKED';
}

interface LabContextType {
  labs: typeof LABS;
  selectedLabId: string;
  setSelectedLabId: (id: string) => void;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  
  // Authentication & 2FA State
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  is2faEnabled: boolean;
  setIs2faEnabled: (val: boolean) => void;
  is2faVerified: boolean;
  set2faVerified: (val: boolean) => void;
  adminUnlocked: boolean;
  setAdminUnlocked: (val: boolean) => void;
  userEmail: string;
  setUserEmail: (val: string) => void;
  usersList: MockUser[];
  setUsersList: React.Dispatch<React.SetStateAction<MockUser[]>>;
  
  // Auth Actions
  logout: () => void;
  resetUser2fa: (id: string) => void;
  revokeUserSession: (id: string) => void;

  instruments: Instrument[];
  setInstruments: React.Dispatch<React.SetStateAction<Instrument[]>>;
  samples: Sample[];
  setSamples: React.Dispatch<React.SetStateAction<Sample[]>>;
  methods: Method[];
  setMethods: React.Dispatch<React.SetStateAction<Method[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  maintenance: MaintenanceRecord[];
  setMaintenance: React.Dispatch<React.SetStateAction<MaintenanceRecord[]>>;
  reservations: Reservation[];
  setReservations: React.Dispatch<React.SetStateAction<Reservation[]>>;
  calibrations: CalibrationCurve[];
  setCalibrations: React.Dispatch<React.SetStateAction<CalibrationCurve[]>>;
  qcResults: QCResult[];
  setQcResults: React.Dispatch<React.SetStateAction<QCResult[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  
  // Workstation Simulation State
  activeInstrumentId: string;
  setActiveInstrumentId: (id: string) => void;
  activeLiveSignalPoints: ChromatogramPoint[];
  elapsedTime: number; // in minutes
  currentSampleId: string | null;
  runProgress: number; // percentage
  
  // Workstation Actions
  registerInstrument: (inst: Omit<Instrument, 'id' | 'sensorData' | 'status' | 'healthScore'>) => void;
  editInstrument: (id: string, updated: Partial<Instrument>) => void;
  addSample: (sample: Omit<Sample, 'id' | 'registeredDate' | 'chainOfCustody' | 'status'>) => void;
  updateSampleStatus: (id: string, status: SampleStatus) => void;
  addMethod: (method: Omit<Method, 'id' | 'status' | 'history'>) => void;
  approveMethod: (id: string) => void;
  addMaintenanceRecord: (maint: Omit<MaintenanceRecord, 'id'>) => void;
  addReservation: (res: Omit<Reservation, 'id'>) => void;
  markNotificationsAsRead: () => void;
  addAuditLog: (category: AuditLog['category'], action: string, details: string) => void;
  
  // Custom runs history for viewing
  completedRuns: any[];
  addCompletedRun: (run: any) => void;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

const generateUniqueId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000000)}`;

function getSignalAtTime(type: InstrumentType, time: number): number {
  const peaks = METHOD_PEAKS[type] || [];
  const drift = Math.sin(time * 0.4) * 1.5 + time * 0.15;
  const noise = (Math.random() - 0.5) * 0.5;
  let peakSignal = 0;
  for (const peak of peaks) {
    const diff = time - peak.retentionTime;
    // Gaussian distribution: H * e^(-(t-tc)^2 / (2*w^2))
    const gaussian = peak.height * Math.exp(-(diff * diff) / (2 * peak.width * peak.width));
    peakSignal += gaussian;
  }
  return Math.max(0, parseFloat((4 + drift + noise + peakSignal).toFixed(2)));
}

export function LabProvider({ children }: { children: ReactNode }) {
  const [selectedLabId, setSelectedLabId] = useState<string>('lab-1');
  const [selectedRole, setSelectedRole] = useState<string>('Administrator');
  
  // Authentication, session tracking, and Two-Factor details
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [is2faEnabled, setIs2faEnabled] = useState<boolean>(true);
  const [is2faVerified, set2faVerified] = useState<boolean>(false);
  const [adminUnlocked, setAdminUnlocked] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('amariawake0707@gmail.com');
  const [usersList, setUsersList] = useState<MockUser[]>([
    {
      id: 'usr-1',
      name: 'Alex Rivera (amariawake)',
      email: 'amariawake0707@gmail.com',
      role: 'Administrator',
      tfaEnabled: true,
      tfaSecret: 'K7J2G9B3H5X8Y4W1',
      lastSignIn: '2026-07-12 02:15',
      status: 'ACTIVE'
    },
    {
      id: 'usr-2',
      name: 'Dr. Helen Carter',
      email: 'helen.carter@lims.com',
      role: 'Senior Analyst',
      tfaEnabled: true,
      tfaSecret: 'H9G3K4X5P1L2V8M7',
      lastSignIn: '2026-07-11 18:42',
      status: 'ACTIVE'
    },
    {
      id: 'usr-3',
      name: 'Marcus Chen',
      email: 'marcus.chen@lims.com',
      role: 'Operator',
      tfaEnabled: false,
      tfaSecret: '',
      lastSignIn: '2026-07-12 01:05',
      status: 'ACTIVE'
    },
    {
      id: 'usr-4',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@lims.com',
      role: 'Quality Auditor',
      tfaEnabled: true,
      tfaSecret: 'L1M2K3N4J5P6Q7R8',
      lastSignIn: '2026-07-10 11:24',
      status: 'ACTIVE'
    }
  ]);
  
  const [instruments, setInstruments] = useState<Instrument[]>(INITIAL_INSTRUMENTS);
  const [samples, setSamples] = useState<Sample[]>(INITIAL_SAMPLES);
  const [methods, setMethods] = useState<Method[]>(INITIAL_METHODS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(INITIAL_MAINTENANCE);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [calibrations, setCalibrations] = useState<CalibrationCurve[]>(INITIAL_CALIBRATIONS);
  const [qcResults, setQcResults] = useState<QCResult[]>(INITIAL_QC_RESULTS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  
  const [activeInstrumentId, setActiveInstrumentId] = useState<string>('inst-01');
  const [activeLiveSignalPoints, setActiveLiveSignalPoints] = useState<ChromatogramPoint[]>([]);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [completedRuns, setCompletedRuns] = useState<any[]>([]);

  // Keep track of active run simulation
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeInstrument = instruments.find(i => i.id === activeInstrumentId);
  const currentSampleId = activeInstrument?.currentSampleId || null;
  const activeMethod = methods.find(m => m.id === activeInstrument?.methodId);
  const methodRunTime = activeMethod?.parameters.runTime || 5.0;
  const runProgress = Math.min(100, parseFloat(((elapsedTime / methodRunTime) * 100).toFixed(1)));

  // Generate some initially completed runs
  useEffect(() => {
    const run1 = generateCompletedRun('samp-04', 'inst-01', 'met-01');
    const run2 = generateCompletedRun('samp-02', 'inst-01', 'met-01');
    const run3 = generateCompletedRun('samp-05', 'inst-03', 'met-03');
    setCompletedRuns([run1, run2, run3]);
  }, []);

  // 1. Core WebSocket Simulation Loop (Updates every second)
  useEffect(() => {
    simulationTimerRef.current = setInterval(() => {
      // A. Fluctuating live sensor metrics (pressure, flow rate, signal) for all active running instruments
      setInstruments(prev => prev.map(inst => {
        if (inst.status === 'RUNNING') {
          const method = INITIAL_METHODS.find(m => m.id === inst.methodId);
          const targetFlow = method?.parameters.flowRate || 1.0;
          const targetTemp = method?.parameters.tempColumn || 30.0;
          
          // Slight pressure oscillation
          const pressureDelta = (Math.random() - 0.5) * 1.5;
          const newPressure = Math.max(10, parseFloat((inst.sensorData.pressure + pressureDelta).toFixed(1)));
          
          // Slight flow rate fluctuation
          const flowDelta = (Math.random() - 0.5) * 0.01;
          const newFlow = Math.max(0.01, parseFloat((targetFlow + flowDelta).toFixed(2)));

          // Wavelength/signal fluctuations
          const sigDelta = (Math.random() - 0.5) * 0.2;
          const newSignal = Math.max(0.1, parseFloat((inst.sensorData.detectorSignal + sigDelta).toFixed(1)));

          return {
            ...inst,
            sensorData: {
              pressure: newPressure,
              flowRate: newFlow,
              temperature: parseFloat((targetTemp + (Math.random() - 0.5) * 0.1).toFixed(1)),
              detectorSignal: newSignal
            }
          };
        } else if (inst.status === 'IDLE') {
          // Slow decay back to environmental baseline
          return {
            ...inst,
            sensorData: {
              pressure: Math.max(0, parseFloat((inst.sensorData.pressure * 0.8).toFixed(1))),
              flowRate: Math.max(0, parseFloat((inst.sensorData.flowRate * 0.5).toFixed(2))),
              temperature: Math.max(21.0, parseFloat((inst.sensorData.temperature - 0.2).toFixed(1))),
              detectorSignal: Math.max(0, parseFloat((inst.sensorData.detectorSignal * 0.5).toFixed(1)))
            }
          };
        }
        return inst;
      }));

      // B. Manage Chromatogram Build for the focused Active Instrument if it is RUNNING
      setInstruments(prev => {
        const focusedInst = prev.find(i => i.id === activeInstrumentId);
        if (focusedInst && focusedInst.status === 'RUNNING') {
          setElapsedTime(prevTime => {
            // Accelerate run: 1 real-life second adds 0.05 minutes of run time (so a 5 min run takes 100 seconds)
            const timeStep = 0.05; 
            const nextTime = parseFloat((prevTime + timeStep).toFixed(3));
            const method = methods.find(m => m.id === focusedInst.methodId);
            const maxRunTime = method?.parameters.runTime || 5.0;

            if (nextTime >= maxRunTime) {
              // Run completed! Handle termination
              const sampleId = focusedInst.currentSampleId;
              
              if (sampleId) {
                // Mark sample as COMPLETED
                setSamples(sPrev => sPrev.map(s => {
                  if (s.id === sampleId) {
                    return {
                      ...s,
                      status: 'COMPLETED',
                      chainOfCustody: [
                        ...s.chainOfCustody,
                        { timestamp: new Date().toLocaleTimeString(), action: 'Run completed, peaks integrated', operator: 'System WebSockets' }
                      ]
                    };
                  }
                  return s;
                }));

                // Add to completed runs history
                const completeRunObj = generateCompletedRun(sampleId, focusedInst.id, focusedInst.methodId);
                setCompletedRuns(crPrev => [completeRunObj, ...crPrev]);

                // Create SUCCESS notification
                const targetSample = samples.find(s => s.id === sampleId);
                const notificationTitle = 'Run Completed Successfully';
                const notificationMessage = `Sample "${targetSample?.name || 'Unknown'}" completed assay validation on ${focusedInst.name}. All USP peaks integrated successfully.`;
                
                setNotifications(nPrev => [
                  {
                    id: generateUniqueId('not'),
                    timestamp: new Date().toLocaleTimeString(),
                    type: 'SUCCESS',
                    title: notificationTitle,
                    message: notificationMessage,
                    instrumentId: focusedInst.id,
                    read: false
                  },
                  ...nPrev
                ]);

                // Add compliance audit log
                setAuditLogs(alPrev => [
                  {
                    id: generateUniqueId('aud'),
                    timestamp: new Date().toLocaleTimeString(),
                    operator: 'System Automaton',
                    action: 'In-Silico Run Completed',
                    category: 'INSTRUMENT',
                    details: `Instrument ${focusedInst.name} finalized run for sample ${targetSample?.name}`,
                    ipAddress: '127.0.0.1'
                  },
                  ...alPrev
                ]);
              }

              // Update instrument status to IDLE and clear current sample
              setTimeout(() => {
                setInstruments(iPrev => iPrev.map(i => {
                  if (i.id === focusedInst.id) {
                    return {
                      ...i,
                      status: 'IDLE',
                      currentSampleId: undefined,
                      sensorData: { pressure: 5.0, flowRate: 0.0, temperature: 22.0, detectorSignal: 0.1 }
                    };
                  }
                  return i;
                }));
              }, 100);

              return 0; // reset elapsed
            }

            // Stream live detector value for current elapsed time
            const nextSignalValue = getSignalAtTime(focusedInst.type, nextTime);
            setActiveLiveSignalPoints(ptsPrev => [
              ...ptsPrev, 
              { time: nextTime, signal: nextSignalValue }
            ]);

            return nextTime;
          });
        }
        return prev;
      });

    }, 1000);

    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, [activeInstrumentId, methods, samples]);

  // Reset elapsed time and chromatogram points when switching instrument or if instrument is not running
  useEffect(() => {
    const focused = instruments.find(i => i.id === activeInstrumentId);
    if (!focused || focused.status !== 'RUNNING') {
      setElapsedTime(0);
      setActiveLiveSignalPoints([]);
    } else {
      // Pre-populate some historical points up to current random elapsed time to look active!
      const initialElapsed = 1.5; // Start partway through
      setElapsedTime(initialElapsed);
      const points: ChromatogramPoint[] = [];
      for (let t = 0; t <= initialElapsed; t += 0.05) {
        points.push({ time: parseFloat(t.toFixed(3)), signal: getSignalAtTime(focused.type, t) });
      }
      setActiveLiveSignalPoints(points);
    }
  }, [activeInstrumentId]);

  // 2. Action Implementations
  const registerInstrument = (inst: Omit<Instrument, 'id' | 'sensorData' | 'status' | 'healthScore'>) => {
    const newId = generateUniqueId('inst');
    const newInstrument: Instrument = {
      ...inst,
      id: newId,
      status: 'IDLE',
      healthScore: 100,
      sensorData: { pressure: 0.0, flowRate: 0.00, temperature: 21.0, detectorSignal: 0.0 }
    };
    setInstruments(prev => [newInstrument, ...prev]);
    addAuditLog('INSTRUMENT', 'Instrument Registration', `Registered new device: ${inst.name} [S/N: ${inst.serialNumber}]`);
  };

  const editInstrument = (id: string, updated: Partial<Instrument>) => {
    setInstruments(prev => prev.map(inst => inst.id === id ? { ...inst, ...updated } as Instrument : inst));
    addAuditLog('INSTRUMENT', 'Instrument Calibration / Modify', `Updated instrument settings for ID ${id}`);
  };

  const addSample = (sample: Omit<Sample, 'id' | 'registeredDate' | 'chainOfCustody' | 'status'>) => {
    const newId = generateUniqueId('samp');
    const barcode = `LAB-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newSample: Sample = {
      ...sample,
      id: newId,
      barcode,
      status: 'PENDING',
      registeredDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      chainOfCustody: [
        { timestamp: new Date().toLocaleTimeString(), action: 'Logged in LIMS Registry', operator: 'Alex Rivera' }
      ]
    };
    setSamples(prev => [newSample, ...prev]);
    addAuditLog('SAMPLE', 'Sample Registered', `Registered sample: ${sample.name} assigned barcode ${barcode}`);
    
    // Automatically trigger run if assigned instrument is IDLE!
    setInstruments(prev => {
      const assigned = prev.find(i => i.id === sample.assignedInstrumentId);
      if (assigned && assigned.status === 'IDLE') {
        // Start run!
        setTimeout(() => {
          setInstruments(iPrev => iPrev.map(i => {
            if (i.id === assigned.id) {
              return {
                ...i,
                status: 'RUNNING',
                currentSampleId: newId
              };
            }
            return i;
          }));
          
          setSamples(sPrev => sPrev.map(s => {
            if (s.id === newId) {
              return {
                ...s,
                status: 'RUNNING',
                chainOfCustody: [
                  ...s.chainOfCustody,
                  { timestamp: new Date().toLocaleTimeString(), action: 'Assumed Running position on carousel', operator: 'System Router' }
                ]
              };
            }
            return s;
          }));

          setNotifications(nPrev => [
            {
              id: generateUniqueId('not'),
              timestamp: new Date().toLocaleTimeString(),
              type: 'INFO',
              title: 'Workstation Injecting',
              message: `Instrument "${assigned.name}" automatically loaded sample "${sample.name}". Run initiated.`,
              instrumentId: assigned.id,
              read: false
            },
            ...nPrev
          ]);
        }, 800);
      }
      return prev;
    });
  };

  const updateSampleStatus = (id: string, status: SampleStatus) => {
    setSamples(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status,
          chainOfCustody: [
            ...s.chainOfCustody,
            { timestamp: new Date().toLocaleTimeString(), action: `Status shifted to ${status}`, operator: 'System Drag-Drop Controller' }
          ]
        };
      }
      return s;
    }));
    addAuditLog('SAMPLE', 'Sample Flow Move', `Shifted sample status of ID ${id} to ${status}`);
  };

  const addMethod = (method: Omit<Method, 'id' | 'status' | 'history'>) => {
    const newId = generateUniqueId('met');
    const newMethod: Method = {
      ...method,
      id: newId,
      status: 'DRAFT',
      history: [
        { version: '1.0', date: new Date().toLocaleDateString(), changedBy: selectedRole, comment: 'Initial method template draft created' }
      ]
    };
    setMethods(prev => [...prev, newMethod]);
    addAuditLog('METHOD', 'Method Created', `Created draft of chromatography method: ${method.name}`);
  };

  const approveMethod = (id: string) => {
    setMethods(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          status: 'APPROVED',
          approvedBy: 'Dr. Helen Carter',
          approvalDate: new Date().toLocaleDateString(),
          history: [
            { version: m.version, date: new Date().toLocaleDateString(), changedBy: 'Dr. Helen Carter', comment: 'Method validation audit signature accepted' },
            ...m.history
          ]
        };
      }
      return m;
    }));
    addAuditLog('METHOD', 'Method Approval Signature', `Digitally signed approval for method ID ${id}`);
  };

  const addMaintenanceRecord = (maint: Omit<MaintenanceRecord, 'id'>) => {
    const newId = generateUniqueId('maint');
    const newRecord: MaintenanceRecord = { ...maint, id: newId };
    setMaintenance(prev => [newRecord, ...prev]);
    
    // Reset instrument health and maintenance overdue counter
    setInstruments(prev => prev.map(inst => {
      if (inst.id === maint.instrumentId) {
        return {
          ...inst,
          healthScore: 100,
          maintenanceCountdown: 180, // reset to 6 months
          status: 'IDLE' // Bring back online from maintenance
        };
      }
      return inst;
    }));

    addAuditLog('MAINTENANCE', 'Maintenance Finalized', `Completed service for instrument ID ${maint.instrumentId} with notes: ${maint.notes}`);
  };

  const addReservation = (res: Omit<Reservation, 'id'>) => {
    const newId = generateUniqueId('res');
    setReservations(prev => [...prev, { ...res, id: newId }]);
    addAuditLog('SYSTEM', 'Calendar Reservation', `Reserved instrument ID ${res.instrumentId} for ${res.title}`);
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const logout = () => {
    setIsAuthenticated(false);
    set2faVerified(false);
    setAdminUnlocked(false);
    addAuditLog('SECURITY', 'User Signed Out', `Operator ${userEmail} signed out successfully.`);
  };

  const resetUser2fa = (id: string) => {
    setUsersList(prev => prev.map(u => u.id === id ? { ...u, tfaEnabled: false, tfaSecret: '' } : u));
    addAuditLog('SECURITY', 'MFA Status Reset', `Administrator reset 2FA parameters for user ID ${id}`);
  };

  const revokeUserSession = (id: string) => {
    setUsersList(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE' } : u));
    const targetUser = usersList.find(u => u.id === id);
    const newStatus = targetUser?.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    addAuditLog('SECURITY', 'User Status Changed', `Administrator toggled status of user ${targetUser?.email || id} to ${newStatus}`);
  };

  const addAuditLog = (category: AuditLog['category'], action: string, details: string) => {
    const newLog: AuditLog = {
      id: generateUniqueId('aud'),
      timestamp: new Date().toLocaleTimeString(),
      operator: userEmail,
      action,
      category,
      details,
      ipAddress: '10.240.11.5'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addCompletedRun = (run: any) => {
    setCompletedRuns(prev => [run, ...prev]);
  };

  return (
    <LabContext.Provider value={{
      labs: LABS,
      selectedLabId,
      setSelectedLabId,
      selectedRole,
      setSelectedRole,
      
      // Auth & 2FA state variables
      isAuthenticated,
      setIsAuthenticated,
      is2faEnabled,
      setIs2faEnabled,
      is2faVerified,
      set2faVerified,
      adminUnlocked,
      setAdminUnlocked,
      userEmail,
      setUserEmail,
      usersList,
      setUsersList,
      
      // Auth actions
      logout,
      resetUser2fa,
      revokeUserSession,

      instruments,
      setInstruments,
      samples,
      setSamples,
      methods,
      setMethods,
      inventory,
      setInventory,
      maintenance,
      setMaintenance,
      reservations,
      setReservations,
      calibrations,
      setCalibrations,
      qcResults,
      setQcResults,
      notifications,
      setNotifications,
      auditLogs,
      setAuditLogs,
      
      activeInstrumentId,
      setActiveInstrumentId,
      activeLiveSignalPoints,
      elapsedTime,
      currentSampleId,
      runProgress,
      
      registerInstrument,
      editInstrument,
      addSample,
      updateSampleStatus,
      addMethod,
      approveMethod,
      addMaintenanceRecord,
      addReservation,
      markNotificationsAsRead,
      addAuditLog,
      completedRuns,
      addCompletedRun
    }}>
      {children}
    </LabContext.Provider>
  );
}

export function useLab() {
  const context = useContext(LabContext);
  if (context === undefined) {
    throw new Error('useLab must be used within a LabProvider');
  }
  return context;
}
