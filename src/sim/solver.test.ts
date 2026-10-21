import test from 'node:test';
import assert from 'node:assert/strict';
import { solveCircuit } from './solver';
import { CircuitModel } from './types';

test('Ohm\'s Law: 9V battery connected across a 1000-ohm resistor yields 9mA', () => {
  const model: CircuitModel = {
    components: [
      { id: 'bat1', type: 'battery', x: 100, y: 100, rotation: 0, voltage: 9.0, internalResistance: 0.05 },
      { id: 'res1', type: 'resistor', x: 200, y: 100, rotation: 0, resistance: 1000 },
    ],
    wires: [
      { id: 'w1', fromTerminalId: 'bat1:pos', toTerminalId: 'res1:t1' },
      { id: 'w2', fromTerminalId: 'res1:t2', toTerminalId: 'bat1:neg' },
    ],
  };

  const result = solveCircuit(model);
  const resState = result.componentStates['res1'];
  assert.ok(resState, 'Resistor state should exist');

  // I = V / R = 9 / (1000 + 0.05) ≈ 0.009 A (9 mA)
  assert.ok(Math.abs(resState.current - 0.009) < 0.0002, `Expected ~0.009A, got ${resState.current}`);
  assert.ok(Math.abs(resState.voltageDrop - 9.0) < 0.01, `Expected ~9V drop, got ${resState.voltageDrop}`);
  assert.equal(result.hasShortCircuit, false);
});

test('Series Resistors: 9V across two 1000-ohm resistors divides voltage equally to 4.5V', () => {
  const model: CircuitModel = {
    components: [
      { id: 'bat1', type: 'battery', x: 100, y: 100, rotation: 0, voltage: 9.0 },
      { id: 'res1', type: 'resistor', x: 200, y: 100, rotation: 0, resistance: 1000 },
      { id: 'res2', type: 'resistor', x: 300, y: 100, rotation: 0, resistance: 1000 },
    ],
    wires: [
      { id: 'w1', fromTerminalId: 'bat1:pos', toTerminalId: 'res1:t1' },
      { id: 'w2', fromTerminalId: 'res1:t2', toTerminalId: 'res2:t1' },
      { id: 'w3', fromTerminalId: 'res2:t2', toTerminalId: 'bat1:neg' },
    ],
  };

  const result = solveCircuit(model);
  const r1State = result.componentStates['res1'];
  const r2State = result.componentStates['res2'];

  assert.ok(Math.abs(r1State.voltageDrop - 4.5) < 0.05, `Expected 4.5V drop on R1, got ${r1State.voltageDrop}`);
  assert.ok(Math.abs(r2State.voltageDrop - 4.5) < 0.05, `Expected 4.5V drop on R2, got ${r2State.voltageDrop}`);
  assert.ok(Math.abs(r1State.current - 0.0045) < 0.0002, `Expected 4.5mA current, got ${r1State.current}`);
});

test('Parallel Resistors: Two 1000-ohm resistors in parallel draw double current (18mA total)', () => {
  const model: CircuitModel = {
    components: [
      { id: 'bat1', type: 'battery', x: 100, y: 100, rotation: 0, voltage: 9.0 },
      { id: 'res1', type: 'resistor', x: 200, y: 100, rotation: 0, resistance: 1000 },
      { id: 'res2', type: 'resistor', x: 200, y: 200, rotation: 0, resistance: 1000 },
    ],
    wires: [
      { id: 'w1', fromTerminalId: 'bat1:pos', toTerminalId: 'res1:t1' },
      { id: 'w2', fromTerminalId: 'bat1:pos', toTerminalId: 'res2:t1' },
      { id: 'w3', fromTerminalId: 'res1:t2', toTerminalId: 'bat1:neg' },
      { id: 'w4', fromTerminalId: 'res2:t2', toTerminalId: 'bat1:neg' },
    ],
  };

  const result = solveCircuit(model);
  const batState = result.componentStates['bat1'];
  assert.ok(Math.abs(batState.current - 0.018) < 0.0005, `Expected ~0.018A total, got ${batState.current}`);
});

test('Switch control: Open switch blocks current, closed switch allows current', () => {
  const openModel: CircuitModel = {
    components: [
      { id: 'bat1', type: 'battery', x: 100, y: 100, rotation: 0, voltage: 9.0 },
      { id: 'sw1', type: 'switch', x: 200, y: 100, rotation: 0, isOpen: true },
      { id: 'res1', type: 'resistor', x: 300, y: 100, rotation: 0, resistance: 1000 },
    ],
    wires: [
      { id: 'w1', fromTerminalId: 'bat1:pos', toTerminalId: 'sw1:t1' },
      { id: 'w2', fromTerminalId: 'sw1:t2', toTerminalId: 'res1:t1' },
      { id: 'w3', fromTerminalId: 'res1:t2', toTerminalId: 'bat1:neg' },
    ],
  };

  const openRes = solveCircuit(openModel);
  assert.ok(Math.abs(openRes.componentStates['res1'].current) < 1e-6, 'Current should be 0 when switch is open');

  const closedModel: CircuitModel = {
    ...openModel,
    components: openModel.components.map(c => c.id === 'sw1' ? { ...c, isOpen: false } : c),
  };

  const closedRes = solveCircuit(closedModel);
  assert.ok(Math.abs(closedRes.componentStates['res1'].current - 0.009) < 0.0002, 'Current should flow when switch closed');
});

test('LED Circuit: 9V battery with 330-ohm resistor illuminates Red LED safely', () => {
  const model: CircuitModel = {
    components: [
      { id: 'bat1', type: 'battery', x: 100, y: 100, rotation: 0, voltage: 9.0 },
      { id: 'res1', type: 'resistor', x: 200, y: 100, rotation: 0, resistance: 330 },
      { id: 'led1', type: 'led', x: 300, y: 100, rotation: 0, ledColor: 'red' },
    ],
    wires: [
      { id: 'w1', fromTerminalId: 'bat1:pos', toTerminalId: 'res1:t1' },
      { id: 'w2', fromTerminalId: 'res1:t2', toTerminalId: 'led1:anode' },
      { id: 'w3', fromTerminalId: 'led1:cathode', toTerminalId: 'bat1:neg' },
    ],
  };

  const result = solveCircuit(model);
  const ledState = result.componentStates['led1'];

  assert.equal(ledState.isConducting, true, 'LED should be conducting');
  // Vf ≈ 1.9V -> Drop across 330-ohm ≈ 7.1V -> I ≈ 21.5mA
  assert.ok(ledState.current > 0.015 && ledState.current < 0.025, `Expected ~21mA, got ${(ledState.current * 1000).toFixed(1)}mA`);
  assert.ok(ledState.brightness && ledState.brightness > 0.5, 'LED should be glowing bright');
  assert.equal(ledState.isBlown, false, 'LED should not be blown with 330-ohm resistor');
});

test('Short circuit detection: Direct connection across battery terminals flags short circuit', () => {
  const model: CircuitModel = {
    components: [
      { id: 'bat1', type: 'battery', x: 100, y: 100, rotation: 0, voltage: 9.0, internalResistance: 0.05 },
    ],
    wires: [
      { id: 'w1', fromTerminalId: 'bat1:pos', toTerminalId: 'bat1:neg' },
    ],
  };

  const result = solveCircuit(model);
  assert.equal(result.hasShortCircuit, true, 'Should detect short circuit across battery');
  assert.ok(result.shortCircuitMessage?.includes('Short Circuit Alert'), 'Should have descriptive alert message');
});

test('Potentiometer: 50% wiper position on 10k potentiometer outputs 4.5V', () => {
  const model: CircuitModel = {
    components: [
      { id: 'bat1', type: 'battery', x: 100, y: 100, rotation: 0, voltage: 9.0 },
      { id: 'pot1', type: 'potentiometer', x: 200, y: 100, rotation: 0, totalResistance: 10000, wiperPosition: 0.5 },
    ],
    wires: [
      { id: 'w1', fromTerminalId: 'bat1:pos', toTerminalId: 'pot1:a' },
      { id: 'w2', fromTerminalId: 'pot1:b', toTerminalId: 'bat1:neg' },
    ],
  };

  const result = solveCircuit(model);
  const vWiper = result.componentStates['pot1'].terminalVoltages['pot1:wiper'];
  // Battery delivers 9V to pot1:a, pot1:b is 0V -> wiper should be 4.5V
  assert.ok(Math.abs(vWiper - 4.5) < 0.05, `Expected 4.5V on wiper, got ${vWiper}`);
});

