/**
 * Helper to compute EIA 4-band resistor color codes
 */

export interface ResistorBandColors {
  band1: string;
  band2: string;
  multiplier: string;
  tolerance: string;
}

const DIGIT_COLORS: Record<number, { name: string; hex: string }> = {
  0: { name: 'Black', hex: '#18181b' },
  1: { name: 'Brown', hex: '#78350f' },
  2: { name: 'Red', hex: '#dc2626' },
  3: { name: 'Orange', hex: '#ea580c' },
  4: { name: 'Yellow', hex: '#eab308' },
  5: { name: 'Green', hex: '#16a34a' },
  6: { name: 'Blue', hex: '#2563eb' },
  7: { name: 'Violet', hex: '#9333ea' },
  8: { name: 'Gray', hex: '#64748b' },
  9: { name: 'White', hex: '#f8fafc' },
};

const MULTIPLIER_COLORS: Record<number, { name: string; hex: string }> = {
  [-2]: { name: 'Silver', hex: '#cbd5e1' }, // 0.01
  [-1]: { name: 'Gold', hex: '#eab308' },   // 0.1
  0: { name: 'Black', hex: '#18181b' },     // 1
  1: { name: 'Brown', hex: '#78350f' },     // 10
  2: { name: 'Red', hex: '#dc2626' },       // 100
  3: { name: 'Orange', hex: '#ea580c' },     // 1k
  4: { name: 'Yellow', hex: '#eab308' },     // 10k
  5: { name: 'Green', hex: '#16a34a' },     // 100k
  6: { name: 'Blue', hex: '#2563eb' },       // 1M
};

export function getResistorBands(resistanceOhms: number): ResistorBandColors {
  const r = Math.max(0.1, resistanceOhms);
  const logVal = Math.floor(Math.log10(r));
  const multPower = logVal - 1;
  const sigFigs = Math.round(r / Math.pow(10, multPower));

  const digit1 = Math.floor(sigFigs / 10) % 10;
  const digit2 = sigFigs % 10;

  const b1 = DIGIT_COLORS[digit1]?.hex ?? '#78350f';
  const b2 = DIGIT_COLORS[digit2]?.hex ?? '#18181b';
  const b3 = MULTIPLIER_COLORS[multPower]?.hex ?? '#ea580c';
  const b4 = '#eab308'; // 5% gold tolerance

  return {
    band1: b1,
    band2: b2,
    multiplier: b3,
    tolerance: b4,
  };
}

export function formatEngineeringUnits(val: number, unit: string): string {
  if (Math.abs(val) < 1e-9) return `0.00 ${unit}`;
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';

  if (abs >= 1e6) {
    return `${sign}${(abs / 1e6).toFixed(2)} M${unit}`;
  }
  if (abs >= 1e3) {
    return `${sign}${(abs / 1e3).toFixed(2)} k${unit}`;
  }
  if (abs >= 1) {
    return `${sign}${abs.toFixed(2)} ${unit}`;
  }
  if (abs >= 1e-3) {
    return `${sign}${(abs * 1e3).toFixed(2)} m${unit}`;
  }
  if (abs >= 1e-6) {
    return `${sign}${(abs * 1e6).toFixed(2)} µ${unit}`;
  }
  return `${sign}${(abs * 1e9).toFixed(2)} n${unit}`;
}
