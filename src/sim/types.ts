/**
 * CircuitCraft - Circuit Simulator Types
 */

export type ComponentType =
  | 'battery'
  | 'resistor'
  | 'potentiometer'
  | 'switch'
  | 'pushbutton'
  | 'led'
  | 'bulb'
  | 'capacitor'
  | 'ground'
  | 'voltmeter'
  | 'ammeter';

export type LEDColor = 'red' | 'green' | 'blue' | 'amber' | 'white';

export interface Terminal {
  id: string; // e.g. "comp1:pos", "comp1:neg", "comp2:t1"
  componentId: string;
  name: string; // e.g. "+", "-", "1", "2", "wiper"
  label?: string;
  x: number; // canvas coordinates
  y: number;
}

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  label?: string;

  // Electrical properties
  voltage?: number; // for battery (Volts)
  internalResistance?: number; // battery internal resistance (Ohms)
  resistance?: number; // for resistor (Ohms)
  maxPowerRating?: number; // Watts (default 0.25W)
  
  // Potentiometer
  totalResistance?: number; // e.g. 10000 Ohms
  wiperPosition?: number; // 0.0 to 1.0 (slider / knob)

  // Switch / Pushbutton
  isOpen?: boolean; // true = open circuit, false = closed circuit
  isMomentary?: boolean; // for pushbutton

  // LED
  ledColor?: LEDColor;
  forwardVoltage?: number; // Vf in Volts (e.g. 1.9V for red, 3.0V for blue)
  forwardResistance?: number; // dynamic resistance when conducting (Ohms)
  maxCurrent?: number; // safe current limit in Amperes (default 0.030 A = 30mA)
  isBlown?: boolean; // burned out due to overcurrent

  // Bulb
  ratedVoltage?: number; // e.g. 6V
  ratedPower?: number; // e.g. 1.5W
  coldResistance?: number; // Ohms

  // Capacitor
  capacitance?: number; // Farads (e.g. 100uF = 100e-6)
  chargeVoltage?: number; // current stored voltage across capacitor
}

export interface Wire {
  id: string;
  fromTerminalId: string;
  toTerminalId: string;
  color?: string;
}

export interface CircuitModel {
  components: CircuitComponent[];
  wires: Wire[];
}

export interface ComponentSimState {
  componentId: string;
  voltageDrop: number; // V_terminal1 - V_terminal2 (Volts)
  current: number; // Amperes flowing from terminal 1 to 2
  power: number; // Watts (V * I)
  isConducting?: boolean;
  brightness?: number; // 0 to 1+ for LED / bulb
  isOverloaded?: boolean;
  isBlown?: boolean;
  terminalVoltages: Record<string, number>; // terminalId -> potential (V)
}

export interface SimulationResult {
  nodeVoltages: Record<number, number>; // netId -> voltage
  terminalToNetMap: Record<string, number>; // terminalId -> netId
  componentStates: Record<string, ComponentSimState>;
  wireCurrents: Record<string, number>; // wireId -> current (A)
  wireDirections: Record<string, 1 | -1 | 0>; // 1: from -> to, -1: to -> from
  totalPowerWatts: number;
  totalCurrentAmps: number;
  hasShortCircuit: boolean;
  shortCircuitMessage?: string;
  timeSeconds: number;
}

export interface PresetCircuit {
  id: string;
  name: string;
  category: 'Basics' | 'Series & Parallel' | 'LEDs & Diodes' | 'Control & Timing';
  description: string;
  circuit: CircuitModel;
  learningGoal: string;
}
