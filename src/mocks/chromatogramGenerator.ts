/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InstrumentType, ChromatogramPoint } from '../types';

export interface MockPeakConfig {
  id: string;
  name: string;
  retentionTime: number; // minutes
  height: number; // mAU or Hz
  width: number; // peak standard deviation
}

export const METHOD_PEAKS: Record<InstrumentType, MockPeakConfig[]> = {
  HPLC: [
    { id: 'h1', name: 'Acetaminophen', retentionTime: 1.25, height: 180, width: 0.08 },
    { id: 'h2', name: 'Caffeine', retentionTime: 2.45, height: 290, width: 0.12 },
    { id: 'h3', name: 'Aspirin', retentionTime: 4.10, height: 120, width: 0.15 },
  ],
  UHPLC: [
    { id: 'u1', name: 'Impurity A', retentionTime: 0.45, height: 35, width: 0.03 },
    { id: 'u2', name: 'Active API Principal', retentionTime: 1.10, height: 550, width: 0.05 },
    { id: 'u3', name: 'Impurity B', retentionTime: 1.65, height: 15, width: 0.04 },
    { id: 'u4', name: 'Degradant C', retentionTime: 2.30, height: 42, width: 0.06 },
  ],
  GC: [
    { id: 'g1', name: 'Methanol', retentionTime: 1.55, height: 310, width: 0.06 },
    { id: 'g2', name: 'Ethanol', retentionTime: 2.75, height: 450, width: 0.08 },
    { id: 'g3', name: 'Isopropanol', retentionTime: 4.35, height: 190, width: 0.10 },
    { id: 'g4', name: 'Acetonitrile', retentionTime: 5.80, height: 260, width: 0.12 },
  ]
};

/**
 * Generates chromatogram points mathematically
 */
export function generateChromatogramPoints(
  type: InstrumentType,
  runTimeMinutes: number,
  customPeaks?: MockPeakConfig[],
  noiseLevel: number = 0.5
): ChromatogramPoint[] {
  const points: ChromatogramPoint[] = [];
  const samplingIntervalSeconds = 0.2; // 5Hz sampling rate
  const totalPoints = Math.ceil((runTimeMinutes * 60) / samplingIntervalSeconds);
  const peaks = customPeaks || METHOD_PEAKS[type];

  for (let i = 0; i <= totalPoints; i++) {
    const time = (i * samplingIntervalSeconds) / 60; // time in minutes
    
    // 1. Baseline drift (sine + linear slope)
    const drift = Math.sin(time * 0.5) * 2 + time * 0.2;
    
    // 2. Background noise
    const noise = (Math.random() - 0.5) * noiseLevel;
    
    // 3. Peak sums
    let peakSignal = 0;
    for (const peak of peaks) {
      // Gaussian distribution: H * e^(-(t-t0)^2 / (2*w^2))
      const diff = time - peak.retentionTime;
      const gaussian = peak.height * Math.exp(-(diff * diff) / (2 * peak.width * peak.width));
      peakSignal += gaussian;
    }

    const signal = Math.max(0, parseFloat((5 + drift + noise + peakSignal).toFixed(3)));
    points.push({ time: parseFloat(time.toFixed(3)), signal });
  }

  return points;
}

/**
 * Generates an integrated peak calculation table for a given chromatogram
 */
export function calculateIntegratedPeaks(type: InstrumentType, customPeaks?: MockPeakConfig[]) {
  const peaks = customPeaks || METHOD_PEAKS[type];
  
  return peaks.map((p, idx) => {
    // Area of Gaussian is H * w * sqrt(2 * PI)
    const area = Math.round(p.height * p.width * Math.sqrt(2 * Math.PI) * 60); // in mAU*sec
    const plates = Math.round(5.54 * Math.pow(p.retentionTime / (p.width * 2.355), 2));
    const tailing = parseFloat((1.0 + (idx % 2 === 0 ? 0.05 : -0.02) + (Math.random() * 0.06)).toFixed(2));
    
    return {
      id: p.id,
      name: p.name,
      retentionTime: p.retentionTime,
      peakArea: area,
      peakHeight: Math.round(p.height),
      plates: plates,
      tailing: tailing,
      comment: idx === 1 && Math.random() > 0.5 ? 'Broad tailing, normal for injection volume' : undefined,
    };
  });
}
