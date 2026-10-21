import { PresetCircuit } from './types';

export const PRESET_CIRCUITS: PresetCircuit[] = [
  {
    id: 'simple-led',
    name: 'Simple LED Circuit',
    category: 'Basics',
    description: 'A standard 9V battery powering a bright red LED through a 330Ω current-limiting resistor with an inline switch.',
    learningGoal: 'Observe how a resistor limits current to protect the LED from burning out.',
    circuit: {
      components: [
        { id: 'bat1', type: 'battery', x: 200, y: 280, rotation: 270, voltage: 9.0, label: '9V Battery' },
        { id: 'sw1', type: 'switch', x: 360, y: 180, rotation: 0, isOpen: false, label: 'Power Switch' },
        { id: 'res1', type: 'resistor', x: 520, y: 180, rotation: 0, resistance: 330, label: '330 Ω' },
        { id: 'led1', type: 'led', x: 680, y: 280, rotation: 90, ledColor: 'red', label: 'Red LED' },
      ],
      wires: [
        { id: 'w1', fromTerminalId: 'bat1:pos', toTerminalId: 'sw1:t1', color: '#ef4444' },
        { id: 'w2', fromTerminalId: 'sw1:t2', toTerminalId: 'res1:t1', color: '#f59e0b' },
        { id: 'w3', fromTerminalId: 'res1:t2', toTerminalId: 'led1:anode', color: '#f59e0b' },
        { id: 'w4', fromTerminalId: 'led1:cathode', toTerminalId: 'bat1:neg', color: '#0284c7' },
      ],
    },
  },
  {
    id: 'series-parallel',
    name: 'Series vs Parallel Resistors',
    category: 'Series & Parallel',
    description: 'Compare voltage division across two series resistors with branch current splitting across two parallel resistors.',
    learningGoal: 'Verify that series resistors divide voltage while parallel resistors divide current.',
    circuit: {
      components: [
        { id: 'bat1', type: 'battery', x: 180, y: 300, rotation: 270, voltage: 12.0, label: '12V DC' },
        // Series branch
        { id: 'r_s1', type: 'resistor', x: 360, y: 180, rotation: 0, resistance: 1000, label: 'R1 (1kΩ)' },
        { id: 'r_s2', type: 'resistor', x: 520, y: 180, rotation: 0, resistance: 1000, label: 'R2 (1kΩ)' },
        // Parallel branch
        { id: 'r_p1', type: 'resistor', x: 360, y: 380, rotation: 0, resistance: 1000, label: 'R3 (1kΩ)' },
        { id: 'r_p2', type: 'resistor', x: 360, y: 460, rotation: 0, resistance: 1000, label: 'R4 (1kΩ)' },
      ],
      wires: [
        // Power rail to branches
        { id: 'w1', fromTerminalId: 'bat1:pos', toTerminalId: 'r_s1:t1', color: '#ef4444' },
        { id: 'w2', fromTerminalId: 'r_s1:t1', toTerminalId: 'r_p1:t1', color: '#ef4444' },
        { id: 'w3', fromTerminalId: 'r_p1:t1', toTerminalId: 'r_p2:t1', color: '#ef4444' },
        // Series connection
        { id: 'w4', fromTerminalId: 'r_s1:t2', toTerminalId: 'r_s2:t1', color: '#f59e0b' },
        // Return ground connections
        { id: 'w5', fromTerminalId: 'r_s2:t2', toTerminalId: 'bat1:neg', color: '#0284c7' },
        { id: 'w6', fromTerminalId: 'r_p1:t2', toTerminalId: 'bat1:neg', color: '#0284c7' },
        { id: 'w7', fromTerminalId: 'r_p2:t2', toTerminalId: 'r_p1:t2', color: '#0284c7' },
      ],
    },
  },
  {
    id: 'potentiometer-dimmer',
    name: 'Potentiometer LED Dimmer',
    category: 'Control & Timing',
    description: 'Use a 10kΩ potentiometer as a variable voltage divider to smoothly adjust the brightness of an LED indicator.',
    learningGoal: 'Learn how rotary potentiometers adjust potential to dim lights or control signals.',
    circuit: {
      components: [
        { id: 'bat1', type: 'battery', x: 180, y: 320, rotation: 270, voltage: 9.0, label: '9V Battery' },
        { id: 'pot1', type: 'potentiometer', x: 380, y: 200, rotation: 0, totalResistance: 10000, wiperPosition: 0.65, label: '10kΩ Pot' },
        { id: 'res1', type: 'resistor', x: 540, y: 200, rotation: 0, resistance: 220, label: '220Ω Limiter' },
        { id: 'led1', type: 'led', x: 680, y: 280, rotation: 90, ledColor: 'amber', label: 'Amber LED' },
      ],
      wires: [
        { id: 'w1', fromTerminalId: 'bat1:pos', toTerminalId: 'pot1:a', color: '#ef4444' },
        { id: 'w2', fromTerminalId: 'pot1:b', toTerminalId: 'bat1:neg', color: '#0284c7' },
        { id: 'w3', fromTerminalId: 'pot1:wiper', toTerminalId: 'res1:t1', color: '#f59e0b' },
        { id: 'w4', fromTerminalId: 'res1:t2', toTerminalId: 'led1:anode', color: '#f59e0b' },
        { id: 'w5', fromTerminalId: 'led1:cathode', toTerminalId: 'bat1:neg', color: '#0284c7' },
      ],
    },
  },
  {
    id: 'rc-charging',
    name: 'RC Timing & Capacitor Charging',
    category: 'Control & Timing',
    description: 'Observe the exponential voltage buildup as current flows through a 10kΩ resistor into a 220µF electrolytic capacitor.',
    learningGoal: 'Visualize the time constant τ = R × C and observe capacitor voltage asymptotic ramp.',
    circuit: {
      components: [
        { id: 'bat1', type: 'battery', x: 180, y: 320, rotation: 270, voltage: 9.0, label: '9V Battery' },
        { id: 'sw1', type: 'switch', x: 320, y: 180, rotation: 0, isOpen: false, label: 'Charge Switch' },
        { id: 'res1', type: 'resistor', x: 480, y: 180, rotation: 0, resistance: 10000, label: '10 kΩ' },
        { id: 'cap1', type: 'capacitor', x: 640, y: 280, rotation: 90, capacitance: 220e-6, label: '220 µF' },
        { id: 'led1', type: 'led', x: 480, y: 320, rotation: 0, ledColor: 'blue', label: 'Indicator LED' },
      ],
      wires: [
        { id: 'w1', fromTerminalId: 'bat1:pos', toTerminalId: 'sw1:t1', color: '#ef4444' },
        { id: 'w2', fromTerminalId: 'sw1:t2', toTerminalId: 'res1:t1', color: '#f59e0b' },
        { id: 'w3', fromTerminalId: 'res1:t2', toTerminalId: 'cap1:pos', color: '#f59e0b' },
        { id: 'w4', fromTerminalId: 'cap1:pos', toTerminalId: 'led1:anode', color: '#f59e0b' },
        { id: 'w5', fromTerminalId: 'led1:cathode', toTerminalId: 'cap1:neg', color: '#0284c7' },
        { id: 'w6', fromTerminalId: 'cap1:neg', toTerminalId: 'bat1:neg', color: '#0284c7' },
      ],
    },
  },
  {
    id: 'logic-and-or',
    name: 'Dual Switch Logic (AND / OR Gates)',
    category: 'Basics',
    description: 'Two independent circuits: series switches implementing an AND condition, and parallel switches implementing an OR condition.',
    learningGoal: 'Discover how computer logic gates are physically constructed with mechanical or solid-state switches.',
    circuit: {
      components: [
        { id: 'bat1', type: 'battery', x: 160, y: 320, rotation: 270, voltage: 5.0, label: '5V Supply' },
        // AND gate branch (Series switches)
        { id: 'sw_a1', type: 'switch', x: 320, y: 180, rotation: 0, isOpen: true, label: 'Switch A1' },
        { id: 'sw_a2', type: 'switch', x: 460, y: 180, rotation: 0, isOpen: true, label: 'Switch A2' },
        { id: 'res_and', type: 'resistor', x: 580, y: 180, rotation: 0, resistance: 150, label: '150 Ω' },
        { id: 'led_and', type: 'led', x: 700, y: 180, rotation: 0, ledColor: 'green', label: 'AND LED' },
        // OR gate branch (Parallel switches)
        { id: 'sw_o1', type: 'switch', x: 320, y: 380, rotation: 0, isOpen: true, label: 'Switch O1' },
        { id: 'sw_o2', type: 'switch', x: 320, y: 460, rotation: 0, isOpen: false, label: 'Switch O2' },
        { id: 'res_or', type: 'resistor', x: 520, y: 420, rotation: 0, resistance: 150, label: '150 Ω' },
        { id: 'led_or', type: 'led', x: 680, y: 420, rotation: 0, ledColor: 'blue', label: 'OR LED' },
      ],
      wires: [
        // AND branch
        { id: 'wa1', fromTerminalId: 'bat1:pos', toTerminalId: 'sw_a1:t1', color: '#ef4444' },
        { id: 'wa2', fromTerminalId: 'sw_a1:t2', toTerminalId: 'sw_a2:t1', color: '#f59e0b' },
        { id: 'wa3', fromTerminalId: 'sw_a2:t2', toTerminalId: 'res_and:t1', color: '#f59e0b' },
        { id: 'wa4', fromTerminalId: 'res_and:t2', toTerminalId: 'led_and:anode', color: '#f59e0b' },
        { id: 'wa5', fromTerminalId: 'led_and:cathode', toTerminalId: 'bat1:neg', color: '#0284c7' },
        // OR branch
        { id: 'wo1', fromTerminalId: 'bat1:pos', toTerminalId: 'sw_o1:t1', color: '#ef4444' },
        { id: 'wo2', fromTerminalId: 'bat1:pos', toTerminalId: 'sw_o2:t1', color: '#ef4444' },
        { id: 'wo3', fromTerminalId: 'sw_o1:t2', toTerminalId: 'res_or:t1', color: '#f59e0b' },
        { id: 'wo4', fromTerminalId: 'sw_o2:t2', toTerminalId: 'res_or:t1', color: '#f59e0b' },
        { id: 'wo5', fromTerminalId: 'res_or:t2', toTerminalId: 'led_or:anode', color: '#f59e0b' },
        { id: 'wo6', fromTerminalId: 'led_or:cathode', toTerminalId: 'bat1:neg', color: '#0284c7' },
      ],
    },
  },
];

export interface LabChallenge {
  id: string;
  title: string;
  badge: string;
  instructions: string;
  hint: string;
  check: (circuit: import('./types').CircuitModel, sim: import('./types').SimulationResult) => { completed: boolean; feedback: string };
}

export const LAB_CHALLENGES: LabChallenge[] = [
  {
    id: 'ch-safe-led',
    title: 'Challenge 1: Safe LED Illumination',
    badge: 'Ohm’s Law',
    instructions: 'Build a circuit with a battery, resistor, and LED such that the LED illuminates with a safe forward current between 10 mA and 25 mA.',
    hint: 'Use a 9V battery, a resistor between 300Ω and 680Ω, and ensure the LED anode connects toward the positive terminal.',
    check: (model, sim) => {
      const leds = model.components.filter(c => c.type === 'led');
      if (leds.length === 0) return { completed: false, feedback: 'Place at least one LED on the canvas.' };
      for (const led of leds) {
        const state = sim.componentStates[led.id];
        if (state && !state.isBlown && state.current >= 0.010 && state.current <= 0.025) {
          return { completed: true, feedback: `Great job! LED current is ${(state.current * 1000).toFixed(1)} mA — right in the sweet spot!` };
        }
        if (state?.isBlown) {
          return { completed: false, feedback: 'The LED burned out! Add a higher value resistor to limit current.' };
        }
      }
      return { completed: false, feedback: 'LED is not currently conducting between 10mA and 25mA.' };
    },
  },
  {
    id: 'ch-voltage-divider',
    title: 'Challenge 2: Precision Voltage Divider',
    badge: 'Kirchoff’s Laws',
    instructions: 'Create a circuit with two resistors in series across a battery so that the junction voltage between them is between 4.4V and 4.6V (half of 9V).',
    hint: 'Connect two resistors with identical values (e.g. two 1kΩ or two 10kΩ resistors) in series across a 9V battery.',
    check: (model, sim) => {
      const resistors = model.components.filter(c => c.type === 'resistor');
      if (resistors.length < 2) return { completed: false, feedback: 'Place at least two resistors in series.' };
      for (const r of resistors) {
        const state = sim.componentStates[r.id];
        if (state && Math.abs(state.voltageDrop - 4.5) < 0.25 && state.current > 1e-5) {
          return { completed: true, feedback: `Success! Voltage drop across resistor is ${state.voltageDrop.toFixed(2)} V (50% of 9V supply).` };
        }
      }
      return { completed: false, feedback: 'Junction voltage drop is not yet 4.5V ± 0.25V with current flowing.' };
    },
  },
  {
    id: 'ch-switch-controlled',
    title: 'Challenge 3: Switch Control',
    badge: 'Circuit Control',
    instructions: 'Add an operable switch into a circuit with a lamp or LED so the light turns completely ON and OFF when toggling the switch.',
    hint: 'Put the switch in series with the power wire. Verify that open switch = 0 mA and closed switch = active current.',
    check: (model, sim) => {
      const switches = model.components.filter(c => c.type === 'switch');
      const lights = model.components.filter(c => c.type === 'led' || c.type === 'bulb');
      if (switches.length === 0 || lights.length === 0) {
        return { completed: false, feedback: 'Place a switch and an LED or bulb.' };
      }
      const sw = switches[0];
      const light = lights[0];
      const lightState = sim.componentStates[light.id];
      if (!sw.isOpen && lightState && lightState.current > 0.005) {
        return { completed: true, feedback: 'Nice! The switch actively controls current delivery to your load.' };
      }
      return { completed: false, feedback: 'Close the switch to test power delivery to the light.' };
    },
  },
];
