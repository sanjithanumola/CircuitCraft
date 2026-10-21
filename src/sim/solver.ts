/**
 * CircuitCraft - Modified Nodal Analysis (MNA) Circuit Solver
 * Solves DC and transient circuits with batteries, resistors, switches,
 * potentiometers, LEDs, bulbs, capacitors, and ground nodes.
 */

import {
  CircuitComponent,
  CircuitModel,
  ComponentSimState,
  LEDColor,
  SimulationResult,
  Terminal,
  Wire,
} from './types';

// Default LED properties by color
export const LED_SPECS: Record<LEDColor, { forwardVoltage: number; forwardResistance: number; maxCurrent: number; hex: string }> = {
  red: { forwardVoltage: 1.9, forwardResistance: 10, maxCurrent: 0.030, hex: '#ef4444' },
  green: { forwardVoltage: 2.2, forwardResistance: 12, maxCurrent: 0.030, hex: '#10b981' },
  blue: { forwardVoltage: 3.1, forwardResistance: 15, maxCurrent: 0.030, hex: '#3b82f6' },
  amber: { forwardVoltage: 2.0, forwardResistance: 10, maxCurrent: 0.030, hex: '#f59e0b' },
  white: { forwardVoltage: 3.0, forwardResistance: 14, maxCurrent: 0.030, hex: '#f8fafc' },
};

/**
 * Returns terminal positions and identifiers for any component given its x, y, rotation.
 */
export function getComponentTerminals(comp: CircuitComponent): Terminal[] {
  const rad = (comp.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const rotate = (dx: number, dy: number) => ({
    x: Math.round(comp.x + dx * cos - dy * sin),
    y: Math.round(comp.y + dx * sin + dy * cos),
  });

  switch (comp.type) {
    case 'battery': {
      const p1 = rotate(-40, 0); // Negative (-)
      const p2 = rotate(40, 0);  // Positive (+)
      return [
        { id: `${comp.id}:neg`, componentId: comp.id, name: '-', label: '−', x: p1.x, y: p1.y },
        { id: `${comp.id}:pos`, componentId: comp.id, name: '+', label: '+', x: p2.x, y: p2.y },
      ];
    }
    case 'resistor':
    case 'switch':
    case 'pushbutton':
    case 'bulb':
    case 'ammeter': {
      const p1 = rotate(-40, 0);
      const p2 = rotate(40, 0);
      return [
        { id: `${comp.id}:t1`, componentId: comp.id, name: '1', label: '1', x: p1.x, y: p1.y },
        { id: `${comp.id}:t2`, componentId: comp.id, name: '2', label: '2', x: p2.x, y: p2.y },
      ];
    }
    case 'led': {
      const pAnode = rotate(-40, 0);   // Anode (+)
      const pCathode = rotate(40, 0);  // Cathode (-) flat side
      return [
        { id: `${comp.id}:anode`, componentId: comp.id, name: 'anode', label: 'A (+)', x: pAnode.x, y: pAnode.y },
        { id: `${comp.id}:cathode`, componentId: comp.id, name: 'cathode', label: 'K (−)', x: pCathode.x, y: pCathode.y },
      ];
    }
    case 'capacitor': {
      const p1 = rotate(-40, 0);
      const p2 = rotate(40, 0);
      return [
        { id: `${comp.id}:pos`, componentId: comp.id, name: '+', label: '+', x: p1.x, y: p1.y },
        { id: `${comp.id}:neg`, componentId: comp.id, name: '-', label: '−', x: p2.x, y: p2.y },
      ];
    }
    case 'potentiometer': {
      const pA = rotate(-40, -20);
      const pW = rotate(0, 30);
      const pB = rotate(40, -20);
      return [
        { id: `${comp.id}:a`, componentId: comp.id, name: 'A', label: 'A', x: pA.x, y: pA.y },
        { id: `${comp.id}:wiper`, componentId: comp.id, name: 'wiper', label: 'W', x: pW.x, y: pW.y },
        { id: `${comp.id}:b`, componentId: comp.id, name: 'B', label: 'B', x: pB.x, y: pB.y },
      ];
    }
    case 'voltmeter': {
      const pPos = rotate(-35, 0);
      const pNeg = rotate(35, 0);
      return [
        { id: `${comp.id}:pos`, componentId: comp.id, name: '+', label: '+', x: pPos.x, y: pPos.y },
        { id: `${comp.id}:neg`, componentId: comp.id, name: '-', label: '−', x: pNeg.x, y: pNeg.y },
      ];
    }
    case 'ground': {
      const p = rotate(0, -20);
      return [
        { id: `${comp.id}:gnd`, componentId: comp.id, name: 'gnd', label: 'GND', x: p.x, y: p.y },
      ];
    }
    default:
      return [];
  }
}

/**
 * Disjoint Set Union (Union-Find) for grouping connected terminals into electrical nets.
 */
class UnionFind {
  parent: Record<string, string> = {};

  find(i: string): string {
    if (!this.parent[i]) {
      this.parent[i] = i;
      return i;
    }
    if (this.parent[i] === i) return i;
    this.parent[i] = this.find(this.parent[i]);
    return this.parent[i];
  }

  union(i: string, j: string) {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent[rootI] = rootJ;
    }
  }
}

/**
 * Solves dense linear system A * x = b via Gaussian elimination with partial pivoting.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  // Deep clone to avoid mutating input
  const M: number[][] = A.map(row => [...row]);
  const x: number[] = [...b];

  for (let k = 0; k < n; k++) {
    // Find pivot
    let maxRow = k;
    let maxVal = Math.abs(M[k][k]);
    for (let r = k + 1; r < n; r++) {
      const val = Math.abs(M[r][k]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = r;
      }
    }

    if (maxVal < 1e-12) {
      // Singular or near-singular matrix
      return null;
    }

    // Swap row k and maxRow
    if (maxRow !== k) {
      const tempRow = M[k];
      M[k] = M[maxRow];
      M[maxRow] = tempRow;

      const tempVal = x[k];
      x[k] = x[maxRow];
      x[maxRow] = tempVal;
    }

    // Eliminate below
    for (let r = k + 1; r < n; r++) {
      const factor = M[r][k] / M[k][k];
      M[r][k] = 0;
      for (let c = k + 1; c < n; c++) {
        M[r][c] -= factor * M[k][c];
      }
      x[r] -= factor * x[k];
    }
  }

  // Back-substitution
  const sol = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let sum = x[r];
    for (let c = r + 1; c < n; c++) {
      sum -= M[r][c] * sol[c];
    }
    sol[r] = sum / M[r][r];
  }

  return sol;
}

export interface SolveOptions {
  dt?: number; // transient time step (seconds), default 0.016 (60Hz)
  prevCapacitorVoltages?: Record<string, number>;
}

/**
 * Main circuit solver function.
 */
export function solveCircuit(model: CircuitModel, options: SolveOptions = {}): SimulationResult {
  const dt = options.dt ?? 0.016;
  const prevCapVoltages = options.prevCapacitorVoltages ?? {};

  // 1. Gather all terminals
  const allTerminals: Terminal[] = [];
  const terminalMap: Record<string, Terminal> = {};

  for (const comp of model.components) {
    const terms = getComponentTerminals(comp);
    for (const t of terms) {
      allTerminals.push(t);
      terminalMap[t.id] = t;
    }
  }

  // 2. Build nets with Union-Find
  const uf = new UnionFind();
  for (const t of allTerminals) {
    uf.find(t.id);
  }

  // Wires connect terminals
  for (const wire of model.wires) {
    if (terminalMap[wire.fromTerminalId] && terminalMap[wire.toTerminalId]) {
      uf.union(wire.fromTerminalId, wire.toTerminalId);
    }
  }

  // Group terminals by root
  const rootGroups: Record<string, string[]> = {};
  for (const t of allTerminals) {
    const root = uf.find(t.id);
    if (!rootGroups[root]) rootGroups[root] = [];
    rootGroups[root].push(t.id);
  }

  // Identify Ground
  // Priority 1: Ground component terminal
  // Priority 2: Negative terminal of first battery
  // Priority 3: First available net
  let groundRoot: string | null = null;
  for (const comp of model.components) {
    if (comp.type === 'ground') {
      groundRoot = uf.find(`${comp.id}:gnd`);
      break;
    }
  }

  if (!groundRoot) {
    for (const comp of model.components) {
      if (comp.type === 'battery') {
        groundRoot = uf.find(`${comp.id}:neg`);
        break;
      }
    }
  }

  const distinctRoots = Object.keys(rootGroups);
  if (!groundRoot && distinctRoots.length > 0) {
    groundRoot = distinctRoots[0];
  }

  // Map each root to an integer net ID. Ground is 0.
  const rootToNetId: Record<string, number> = {};
  let nextNetId = 1;

  if (groundRoot) {
    rootToNetId[groundRoot] = 0;
  }

  for (const r of distinctRoots) {
    if (r !== groundRoot) {
      rootToNetId[r] = nextNetId++;
    }
  }

  const terminalToNetMap: Record<string, number> = {};
  for (const t of allTerminals) {
    const root = uf.find(t.id);
    terminalToNetMap[t.id] = rootToNetId[root] ?? 0;
  }

  const numNonGroundNets = nextNetId - 1; // Nets 1 .. numNonGroundNets

  // Iterative Diode / LED solving (up to 8 iterations)
  // Initially guess all LEDs conducting or non-conducting based on voltage
  const ledStates: Record<string, boolean> = {};
  for (const comp of model.components) {
    if (comp.type === 'led') {
      ledStates[comp.id] = false; // start with diode off
    }
  }

  let finalSol: number[] | null = null;
  let finalVoltageSourceIndices: Array<{ comp: CircuitComponent; posNet: number; negNet: number; vValue: number; rSeries: number }> = [];

  for (let iter = 0; iter < 10; iter++) {
    // Define Voltage Sources
    // 1. Batteries
    // 2. Conducting LEDs (piecewise linear: Vf source + forward resistance)
    // 3. Capacitors (transient companion model: Thevenin eq: V_prev with R_eq = dt/C)
    const vSources: Array<{ comp: CircuitComponent; posNet: number; negNet: number; vValue: number; rSeries: number; isLED?: boolean; isCap?: boolean }> = [];

    for (const comp of model.components) {
      if (comp.type === 'battery') {
        const posNet = terminalToNetMap[`${comp.id}:pos`] ?? 0;
        const negNet = terminalToNetMap[`${comp.id}:neg`] ?? 0;
        const v = comp.voltage ?? 9.0;
        const rInt = Math.max(comp.internalResistance ?? 0.05, 0.02);
        vSources.push({ comp, posNet, negNet, vValue: v, rSeries: rInt });
      } else if (comp.type === 'led' && !comp.isBlown && ledStates[comp.id]) {
        // Conducting LED
        const anodeNet = terminalToNetMap[`${comp.id}:anode`] ?? 0;
        const cathodeNet = terminalToNetMap[`${comp.id}:cathode`] ?? 0;
        const color = comp.ledColor ?? 'red';
        const spec = LED_SPECS[color] ?? LED_SPECS.red;
        const vf = comp.forwardVoltage ?? spec.forwardVoltage;
        const rf = comp.forwardResistance ?? spec.forwardResistance;
        vSources.push({ comp, posNet: anodeNet, negNet: cathodeNet, vValue: vf, rSeries: rf, isLED: true });
      } else if (comp.type === 'capacitor') {
        const posNet = terminalToNetMap[`${comp.id}:pos`] ?? 0;
        const negNet = terminalToNetMap[`${comp.id}:neg`] ?? 0;
        const c = comp.capacitance ?? 100e-6; // 100 uF
        const rEq = Math.max(dt / c, 0.1);
        const prevV = prevCapVoltages[comp.id] ?? comp.chargeVoltage ?? 0;
        vSources.push({ comp, posNet, negNet, vValue: prevV, rSeries: rEq, isCap: true });
      }
    }

    finalVoltageSourceIndices = vSources;

    const matrixSize = numNonGroundNets + vSources.length;
    if (matrixSize === 0) {
      finalSol = [];
      break;
    }

    // Allocate A and b
    const A: number[][] = Array.from({ length: matrixSize }, () => new Array<number>(matrixSize).fill(0));
    const b: number[] = new Array<number>(matrixSize).fill(0);

    // High impedance shunt from all nodes to ground to prevent singular matrices on floating nodes
    for (let i = 0; i < numNonGroundNets; i++) {
      A[i][i] += 1e-9; // 1 G-ohm shunt
    }

    // Helper to add conductance G between net1 and net2
    const addResistor = (net1: number, net2: number, resistance: number) => {
      const r = Math.max(resistance, 1e-4);
      const g = 1 / r;
      if (net1 !== 0) A[net1 - 1][net1 - 1] += g;
      if (net2 !== 0) A[net2 - 1][net2 - 1] += g;
      if (net1 !== 0 && net2 !== 0) {
        A[net1 - 1][net2 - 1] -= g;
        A[net2 - 1][net1 - 1] -= g;
      }
    };

    // Populate passive components (Resistors, Bulbs, Potentiometers, Switches, Ammeters, Voltmeters, Off-state LEDs)
    for (const comp of model.components) {
      switch (comp.type) {
        case 'resistor': {
          const n1 = terminalToNetMap[`${comp.id}:t1`] ?? 0;
          const n2 = terminalToNetMap[`${comp.id}:t2`] ?? 0;
          const r = comp.resistance ?? 1000;
          addResistor(n1, n2, r);
          break;
        }
        case 'bulb': {
          const n1 = terminalToNetMap[`${comp.id}:t1`] ?? 0;
          const n2 = terminalToNetMap[`${comp.id}:t2`] ?? 0;
          const r = comp.coldResistance ?? 24; // typical small incandescent lamp
          addResistor(n1, n2, r);
          break;
        }
        case 'switch':
        case 'pushbutton': {
          const n1 = terminalToNetMap[`${comp.id}:t1`] ?? 0;
          const n2 = terminalToNetMap[`${comp.id}:t2`] ?? 0;
          const isOpen = comp.isOpen ?? false;
          // When open: 100 M-Ohm, when closed: 0.0001 Ohm
          const r = isOpen ? 1e8 : 1e-4;
          addResistor(n1, n2, r);
          break;
        }
        case 'ammeter': {
          // Low resistance shunt
          const n1 = terminalToNetMap[`${comp.id}:t1`] ?? 0;
          const n2 = terminalToNetMap[`${comp.id}:t2`] ?? 0;
          addResistor(n1, n2, 0.001);
          break;
        }
        case 'voltmeter': {
          // High impedance voltmeter
          const n1 = terminalToNetMap[`${comp.id}:pos`] ?? 0;
          const n2 = terminalToNetMap[`${comp.id}:neg`] ?? 0;
          addResistor(n1, n2, 1e7); // 10 MOhm
          break;
        }
        case 'potentiometer': {
          const nA = terminalToNetMap[`${comp.id}:a`] ?? 0;
          const nW = terminalToNetMap[`${comp.id}:wiper`] ?? 0;
          const nB = terminalToNetMap[`${comp.id}:b`] ?? 0;
          const rTotal = comp.totalResistance ?? 10000;
          const pos = Math.max(0.001, Math.min(0.999, comp.wiperPosition ?? 0.5));
          const rAW = rTotal * pos;
          const rWB = rTotal * (1 - pos);
          addResistor(nA, nW, rAW);
          addResistor(nW, nB, rWB);
          break;
        }
        case 'led': {
          // If LED is off or blown, it has very high reverse resistance
          if (comp.isBlown || !ledStates[comp.id]) {
            const nA = terminalToNetMap[`${comp.id}:anode`] ?? 0;
            const nK = terminalToNetMap[`${comp.id}:cathode`] ?? 0;
            addResistor(nA, nK, 1e7); // 10 MOhm off-state
          }
          break;
        }
      }
    }

    // Insert Voltage Sources into MNA matrix
    for (let k = 0; k < vSources.length; k++) {
      const src = vSources[k];
      const rowIdx = numNonGroundNets + k;

      // Positive net connection
      if (src.posNet !== 0) {
        A[src.posNet - 1][rowIdx] += 1;
        A[rowIdx][src.posNet - 1] += 1;
      }

      // Negative net connection
      if (src.negNet !== 0) {
        A[src.negNet - 1][rowIdx] -= 1;
        A[rowIdx][src.negNet - 1] -= 1;
      }

      // Series / internal resistance
      A[rowIdx][rowIdx] -= src.rSeries;

      // b vector value: V_pos - V_neg = vValue
      b[rowIdx] = src.vValue;
    }

    // Solve system
    const sol = solveLinearSystem(A, b);
    if (!sol) {
      finalSol = new Array<number>(matrixSize).fill(0);
      break;
    }

    finalSol = sol;

    // Check LED status consistency
    let changed = false;
    for (const comp of model.components) {
      if (comp.type === 'led' && !comp.isBlown) {
        const nA = terminalToNetMap[`${comp.id}:anode`] ?? 0;
        const nK = terminalToNetMap[`${comp.id}:cathode`] ?? 0;
        const vA = nA === 0 ? 0 : sol[nA - 1];
        const vK = nK === 0 ? 0 : sol[nK - 1];
        const drop = vA - vK;

        const color = comp.ledColor ?? 'red';
        const spec = LED_SPECS[color] ?? LED_SPECS.red;
        const vf = comp.forwardVoltage ?? spec.forwardVoltage;

        const shouldConduct = drop >= vf;
        if (shouldConduct !== ledStates[comp.id]) {
          ledStates[comp.id] = shouldConduct;
          changed = true;
        }
      }
    }

    if (!changed) {
      break; // Converged!
    }
  }

  // 3. Extract Node Voltages
  const nodeVoltages: Record<number, number> = { 0: 0 };
  if (finalSol) {
    for (let i = 1; i <= numNonGroundNets; i++) {
      nodeVoltages[i] = finalSol[i - 1];
    }
  }

  // Helper to get voltage of terminal
  const getTermV = (termId: string) => {
    const net = terminalToNetMap[termId] ?? 0;
    return nodeVoltages[net] ?? 0;
  };

  // 4. Compute Component States (Voltage Drop, Current, Power, Brightness, Overload)
  const componentStates: Record<string, ComponentSimState> = {};
  let totalPowerWatts = 0;
  let totalBatteryCurrent = 0;
  let hasShortCircuit = false;
  let shortCircuitMsg = '';

  // Extract branch currents for voltage sources
  const vSourceCurrents: Record<string, number> = {};
  if (finalSol) {
    for (let k = 0; k < finalVoltageSourceIndices.length; k++) {
      const src = finalVoltageSourceIndices[k];
      const iVal = finalSol[numNonGroundNets + k];
      vSourceCurrents[src.comp.id] = iVal;
    }
  }

  for (const comp of model.components) {
    const termVoltages: Record<string, number> = {};
    const terms = getComponentTerminals(comp);
    for (const t of terms) {
      termVoltages[t.id] = getTermV(t.id);
    }

    let vDrop = 0;
    let current = 0;
    let power = 0;
    let brightness = 0;
    let isConducting = false;
    let isOverloaded = false;
    let isBlown = comp.isBlown ?? false;

    switch (comp.type) {
      case 'battery': {
        const vPos = termVoltages[`${comp.id}:pos`] ?? 0;
        const vNeg = termVoltages[`${comp.id}:neg`] ?? 0;
        vDrop = vPos - vNeg;
        // current leaving positive terminal (delivered current is positive):
        current = -(vSourceCurrents[comp.id] ?? 0);
        power = Math.abs(vDrop * current);
        totalBatteryCurrent += Math.abs(current);
        totalPowerWatts += power;

        // Short circuit check on battery: current > 20A or vDrop significantly collapsed
        if (Math.abs(current) > 20) {
          hasShortCircuit = true;
          shortCircuitMsg = `Short Circuit Alert! Battery delivering ${Math.abs(current).toFixed(1)} A. High risk of thermal runaway!`;
        }
        break;
      }
      case 'resistor': {
        const v1 = termVoltages[`${comp.id}:t1`] ?? 0;
        const v2 = termVoltages[`${comp.id}:t2`] ?? 0;
        vDrop = v1 - v2;
        const r = comp.resistance ?? 1000;
        current = vDrop / r;
        power = Math.abs(vDrop * current);
        totalPowerWatts += power;
        const maxP = comp.maxPowerRating ?? 0.25;
        if (power > maxP * 2) {
          isOverloaded = true;
        }
        break;
      }
      case 'switch':
      case 'pushbutton': {
        const v1 = termVoltages[`${comp.id}:t1`] ?? 0;
        const v2 = termVoltages[`${comp.id}:t2`] ?? 0;
        vDrop = v1 - v2;
        const isOpen = comp.isOpen ?? false;
        current = isOpen ? 0 : vDrop / 1e-4;
        power = Math.abs(vDrop * current);
        isConducting = !isOpen && Math.abs(current) > 1e-6;
        break;
      }
      case 'led': {
        const vA = termVoltages[`${comp.id}:anode`] ?? 0;
        const vK = termVoltages[`${comp.id}:cathode`] ?? 0;
        vDrop = vA - vK;
        const color = comp.ledColor ?? 'red';
        const spec = LED_SPECS[color] ?? LED_SPECS.red;
        const vf = comp.forwardVoltage ?? spec.forwardVoltage;
        const maxI = comp.maxCurrent ?? spec.maxCurrent;

        if (isBlown) {
          current = 0;
          brightness = 0;
        } else if (vDrop > vf * 0.8) {
          // Conducting LED branch current
          current = vSourceCurrents[comp.id] ?? Math.max(0, (vDrop - vf) / (comp.forwardResistance ?? spec.forwardResistance));
          if (current > 0) {
            isConducting = true;
            // Brightness scales with forward current (20mA nominal full brightness)
            brightness = Math.min(1.5, current / 0.020);
            power = Math.abs(vDrop * current);

            if (current > maxI) {
              isOverloaded = true;
              // If current severely exceeds limit (>50mA), flag blown
              if (current > 0.050) {
                isBlown = true;
              }
            }
          }
        }
        break;
      }
      case 'bulb': {
        const v1 = termVoltages[`${comp.id}:t1`] ?? 0;
        const v2 = termVoltages[`${comp.id}:t2`] ?? 0;
        vDrop = v1 - v2;
        const r = comp.coldResistance ?? 24;
        current = vDrop / r;
        power = Math.abs(vDrop * current);
        totalPowerWatts += power;
        const ratedP = comp.ratedPower ?? 1.5;
        brightness = Math.min(1.4, power / ratedP);
        isConducting = brightness > 0.05;
        break;
      }
      case 'potentiometer': {
        const vA = termVoltages[`${comp.id}:a`] ?? 0;
        const vW = termVoltages[`${comp.id}:wiper`] ?? 0;
        const vB = termVoltages[`${comp.id}:b`] ?? 0;
        vDrop = vA - vB;
        const pos = Math.max(0.001, Math.min(0.999, comp.wiperPosition ?? 0.5));
        const rTotal = comp.totalResistance ?? 10000;
        const iAW = (vA - vW) / (rTotal * pos);
        const iWB = (vW - vB) / (rTotal * (1 - pos));
        current = Math.max(Math.abs(iAW), Math.abs(iWB));
        power = (vA - vW) * iAW + (vW - vB) * iWB;
        break;
      }
      case 'capacitor': {
        const vPos = termVoltages[`${comp.id}:pos`] ?? 0;
        const vNeg = termVoltages[`${comp.id}:neg`] ?? 0;
        vDrop = vPos - vNeg;
        // Companion current
        current = vSourceCurrents[comp.id] ?? 0;
        power = Math.abs(vDrop * current);
        break;
      }
      case 'ammeter': {
        const v1 = termVoltages[`${comp.id}:t1`] ?? 0;
        const v2 = termVoltages[`${comp.id}:t2`] ?? 0;
        vDrop = v1 - v2;
        current = vDrop / 0.001;
        break;
      }
      case 'voltmeter': {
        const vPos = termVoltages[`${comp.id}:pos`] ?? 0;
        const vNeg = termVoltages[`${comp.id}:neg`] ?? 0;
        vDrop = vPos - vNeg;
        current = vDrop / 1e7;
        break;
      }
      case 'ground': {
        vDrop = 0;
        current = 0;
        break;
      }
    }

    componentStates[comp.id] = {
      componentId: comp.id,
      voltageDrop: vDrop,
      current,
      power,
      brightness,
      isConducting,
      isOverloaded,
      isBlown,
      terminalVoltages: termVoltages,
    };
  }

  // 5. Wire currents and particle directions
  const wireCurrents: Record<string, number> = {};
  const wireDirections: Record<string, 1 | -1 | 0> = {};

  for (const wire of model.wires) {
    const tFrom = wire.fromTerminalId;
    const tTo = wire.toTerminalId;
    const compFromId = tFrom.split(':')[0];
    const compToId = tTo.split(':')[0];

    // Estimate current in wire from connected component
    const stateFrom = componentStates[compFromId];
    const stateTo = componentStates[compToId];

    let currentMag = 0;
    if (stateFrom && Math.abs(stateFrom.current) > 1e-6) {
      currentMag = Math.abs(stateFrom.current);
    } else if (stateTo && Math.abs(stateTo.current) > 1e-6) {
      currentMag = Math.abs(stateTo.current);
    }

    wireCurrents[wire.id] = currentMag;

    // Direction based on potential difference
    const vFrom = getTermV(tFrom);
    const vTo = getTermV(tTo);
    if (Math.abs(vFrom - vTo) > 1e-5) {
      // Current flows from high potential to low potential (conventional current)
      wireDirections[wire.id] = vFrom > vTo ? 1 : -1;
    } else {
      // Trace from battery or active source
      wireDirections[wire.id] = 1;
    }
  }

  return {
    nodeVoltages,
    terminalToNetMap,
    componentStates,
    wireCurrents,
    wireDirections,
    totalPowerWatts,
    totalCurrentAmps: totalBatteryCurrent,
    hasShortCircuit,
    shortCircuitMessage: shortCircuitMsg,
    timeSeconds: 0,
  };
}

/**
 * Updates dynamic states (capacitors charging, LED burnouts) for the next time step.
 */
export function stepSimulationModel(
  model: CircuitModel,
  simResult: SimulationResult,
  dt: number = 0.05
): { updatedModel: CircuitModel; newCapVoltages: Record<string, number> } {
  const newCapVoltages: Record<string, number> = {};
  let modelChanged = false;

  const updatedComponents = model.components.map(comp => {
    const state = simResult.componentStates[comp.id];

    // Capacitor charging: V_new = V_old + (I * dt / C)
    if (comp.type === 'capacitor') {
      const c = comp.capacitance ?? 100e-6;
      const vDrop = state?.voltageDrop ?? 0;
      const prevV = comp.chargeVoltage ?? 0;
      // Exponential smoothing towards equilibrium vDrop
      const tau = Math.max(0.001, (state?.power ? Math.abs(vDrop / (state.current || 1e-3)) : 100) * c);
      const alpha = 1 - Math.exp(-dt / tau);
      const newV = prevV + alpha * (vDrop - prevV);
      newCapVoltages[comp.id] = newV;
      if (Math.abs(newV - prevV) > 1e-4) {
        modelChanged = true;
        return { ...comp, chargeVoltage: newV };
      }
    }

    // LED burn out check
    if (comp.type === 'led' && !comp.isBlown && state?.isBlown) {
      modelChanged = true;
      return { ...comp, isBlown: true };
    }

    return comp;
  });

  return {
    updatedModel: modelChanged ? { ...model, components: updatedComponents } : model,
    newCapVoltages,
  };
}
