import React from 'react';
import { CircuitComponent, ComponentSimState } from '../sim/types';
import { getResistorBands, formatEngineeringUnits } from '../sim/resistorColors';
import { LED_SPECS } from '../sim/solver';

interface VisualProps {
  component: CircuitComponent;
  simState?: ComponentSimState;
  isSchematic: boolean;
  isSelected?: boolean;
}

export const ComponentVisual: React.FC<VisualProps> = ({
  component,
  simState,
  isSchematic,
  isSelected,
}) => {
  const current = simState?.current ?? 0;
  const vDrop = simState?.voltageDrop ?? 0;
  const isConducting = simState?.isConducting ?? false;
  const isBlown = component.isBlown || simState?.isBlown;

  // Render by type
  switch (component.type) {
    case 'battery':
      return isSchematic ? (
        <SchematicBattery comp={component} />
      ) : (
        <RealisticBattery comp={component} simState={simState} />
      );

    case 'resistor':
      return isSchematic ? (
        <SchematicResistor comp={component} />
      ) : (
        <RealisticResistor comp={component} />
      );

    case 'potentiometer':
      return isSchematic ? (
        <SchematicPotentiometer comp={component} />
      ) : (
        <RealisticPotentiometer comp={component} />
      );

    case 'switch':
    case 'pushbutton':
      return isSchematic ? (
        <SchematicSwitch comp={component} isConducting={isConducting} />
      ) : (
        <RealisticSwitch comp={component} isConducting={isConducting} />
      );

    case 'led':
      return isSchematic ? (
        <SchematicLED comp={component} simState={simState} />
      ) : (
        <RealisticLED comp={component} simState={simState} isBlown={!!isBlown} />
      );

    case 'bulb':
      return isSchematic ? (
        <SchematicBulb comp={component} simState={simState} />
      ) : (
        <RealisticBulb comp={component} simState={simState} />
      );

    case 'capacitor':
      return isSchematic ? (
        <SchematicCapacitor comp={component} />
      ) : (
        <RealisticCapacitor comp={component} />
      );

    case 'ground':
      return <GroundSymbol comp={component} />;

    case 'ammeter':
      return <MeterSymbol comp={component} label="A" value={formatEngineeringUnits(current, 'A')} />;

    case 'voltmeter':
      return <MeterSymbol comp={component} label="V" value={formatEngineeringUnits(vDrop, 'V')} />;

    default:
      return null;
  }
};

/* -------------------------------------------------------------
 * BATTERY
 * ------------------------------------------------------------- */
function RealisticBattery({ comp, simState }: { comp: CircuitComponent; simState?: ComponentSimState }) {
  const v = comp.voltage ?? 9.0;
  return (
    <g>
      {/* Battery body */}
      <rect x="-35" y="-22" width="70" height="44" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
      {/* Top copper accent bar */}
      <rect x="-35" y="-22" width="16" height="44" rx="3" fill="#b45309" />
      {/* Label */}
      <text x="2" y="-4" fill="#f8fafc" fontSize="11" fontWeight="700" fontFamily="sans-serif" textAnchor="middle">
        {v}V
      </text>
      <text x="2" y="10" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">
        DC POWER
      </text>
      {/* Terminals */}
      {/* Negative (-) terminal left: circular stud */}
      <circle cx="-40" cy="0" r="4.5" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
      <text x="-26" y="4" fill="#94a3b8" fontSize="12" fontWeight="700" textAnchor="middle">
        −
      </text>
      {/* Positive (+) terminal right: octagonal snap */}
      <rect x="35" y="-5" width="10" height="10" rx="2" fill="#e2e8f0" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="26" y="4" fill="#ef4444" fontSize="12" fontWeight="700" textAnchor="middle">
        +
      </text>
    </g>
  );
}

function SchematicBattery({ comp }: { comp: CircuitComponent }) {
  const v = comp.voltage ?? 9.0;
  return (
    <g stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
      {/* Connecting leads */}
      <line x1="-40" y1="0" x2="-8" y2="0" />
      <line x1="8" y1="0" x2="40" y2="0" />
      {/* Negative plate: short thick */}
      <line x1="-8" y1="-12" x2="-8" y2="12" stroke="#64748b" strokeWidth="3.5" />
      {/* Positive plate: long thin */}
      <line x1="8" y1="-20" x2="8" y2="20" stroke="#ef4444" strokeWidth="2.5" />
      {/* Labels */}
      <text x="16" y="-12" fill="#ef4444" fontSize="11" fontWeight="700" stroke="none">
        +
      </text>
      <text x="-20" y="-12" fill="#94a3b8" fontSize="11" fontWeight="700" stroke="none">
        −
      </text>
      <text x="0" y="30" fill="#cbd5e1" fontSize="10" fontFamily="monospace" textAnchor="middle" stroke="none">
        {v}V
      </text>
    </g>
  );
}

/* -------------------------------------------------------------
 * RESISTOR
 * ------------------------------------------------------------- */
function RealisticResistor({ comp }: { comp: CircuitComponent }) {
  const r = comp.resistance ?? 1000;
  const bands = getResistorBands(r);

  return (
    <g>
      {/* Metal wire leads */}
      <line x1="-40" y1="0" x2="-24" y2="0" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      {/* Ceramic beige body with rounded bumps */}
      <rect x="-24" y="-11" width="48" height="22" rx="6" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
      {/* 4 EIA Color Bands */}
      <rect x="-16" y="-11" width="4" height="22" fill={bands.band1} />
      <rect x="-8" y="-11" width="4" height="22" fill={bands.band2} />
      <rect x="0" y="-11" width="4" height="22" fill={bands.multiplier} />
      <rect x="10" y="-11" width="4" height="22" fill={bands.tolerance} />
      {/* Label */}
      <text x="0" y="24" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace" fontWeight="600" textAnchor="middle">
        {formatEngineeringUnits(r, 'Ω')}
      </text>
    </g>
  );
}

function SchematicResistor({ comp }: { comp: CircuitComponent }) {
  const r = comp.resistance ?? 1000;
  return (
    <g stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Leads */}
      <line x1="-40" y1="0" x2="-24" y2="0" />
      <line x1="24" y1="0" x2="40" y2="0" />
      {/* Zigzag */}
      <polyline points="-24,0 -20,-8 -12,8 -4,-8 4,8 12,-8 20,8 24,0" stroke="#38bdf8" />
      <text x="0" y="24" fill="#cbd5e1" fontSize="10" fontFamily="monospace" fontWeight="600" textAnchor="middle" stroke="none">
        {formatEngineeringUnits(r, 'Ω')}
      </text>
    </g>
  );
}

/* -------------------------------------------------------------
 * POTENTIOMETER
 * ------------------------------------------------------------- */
function RealisticPotentiometer({ comp }: { comp: CircuitComponent }) {
  const rTotal = comp.totalResistance ?? 10000;
  const wiperPos = comp.wiperPosition ?? 0.5;
  const angle = (wiperPos - 0.5) * 260; // -130deg to +130deg

  return (
    <g>
      {/* Terminal pins */}
      <line x1="-40" y1="-20" x2="-20" y2="-12" stroke="#94a3b8" strokeWidth="2" />
      <line x1="40" y1="-20" x2="20" y2="-12" stroke="#94a3b8" strokeWidth="2" />
      <line x1="0" y1="30" x2="0" y2="18" stroke="#38bdf8" strokeWidth="2.5" />

      {/* Main potentiometer round casing */}
      <circle cx="0" cy="0" r="22" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
      {/* Inner dial face */}
      <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      {/* Knob with pointer */}
      <g transform={`rotate(${angle})`}>
        <circle cx="0" cy="0" r="10" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="0" y1="0" x2="0" y2="-10" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      {/* Labels */}
      <text x="-36" y="-26" fill="#94a3b8" fontSize="8" fontFamily="monospace">A</text>
      <text x="0" y="42" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">W ({(wiperPos * 100).toFixed(0)}%)</text>
      <text x="36" y="-26" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="end">B</text>
    </g>
  );
}

function SchematicPotentiometer({ comp }: { comp: CircuitComponent }) {
  const wiperPos = comp.wiperPosition ?? 0.5;
  const wiperX = -18 + wiperPos * 36;
  return (
    <g stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1="-40" y1="-20" x2="-20" y2="-20" />
      <line x1="20" y1="-20" x2="40" y2="-20" />
      {/* Zigzag */}
      <polyline points="-20,-20 -15,-27 -7,-13 0,-27 7,-13 15,-27 20,-20" stroke="#38bdf8" />
      {/* Wiper arrow */}
      <line x1="0" y1="30" x2={wiperX} y2="-10" stroke="#f59e0b" strokeWidth="2" />
      <polygon points={`${wiperX}, -10 ${wiperX - 4}, -4 ${wiperX + 4}, -4`} fill="#f59e0b" stroke="none" />
      <text x="0" y="-32" fill="#cbd5e1" fontSize="9" fontFamily="monospace" textAnchor="middle" stroke="none">
        {formatEngineeringUnits(comp.totalResistance ?? 10000, 'Ω')}
      </text>
    </g>
  );
}

/* -------------------------------------------------------------
 * SWITCH / PUSHBUTTON
 * ------------------------------------------------------------- */
function RealisticSwitch({ comp, isConducting }: { comp: CircuitComponent; isConducting: boolean }) {
  const isOpen = comp.isOpen ?? false;
  return (
    <g style={{ cursor: 'pointer' }}>
      {/* Leads */}
      <line x1="-40" y1="0" x2="-20" y2="0" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      {/* Base mounting block */}
      <rect x="-24" y="-12" width="48" height="24" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
      {/* Terminal contact pads */}
      <circle cx="-16" cy="0" r="3.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
      <circle cx="16" cy="0" r="3.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />

      {/* Lever knife arm */}
      {isOpen ? (
        // Open knife arm angled at 35 degrees
        <g>
          <line x1="-16" y1="0" x2="14" y2="-18" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="14" cy="-18" r="4" fill="#dc2626" />
        </g>
      ) : (
        // Closed knife arm flat touching both pads
        <g>
          <line x1="-16" y1="0" x2="16" y2="0" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
          <circle cx="16" cy="0" r="4" fill="#10b981" />
        </g>
      )}

      {/* State label */}
      <text x="0" y="24" fill={isOpen ? '#94a3b8' : '#10b981'} fontSize="9" fontFamily="monospace" fontWeight="700" textAnchor="middle">
        {isOpen ? 'OPEN' : 'CLOSED'}
      </text>
    </g>
  );
}

function SchematicSwitch({ comp, isConducting }: { comp: CircuitComponent; isConducting: boolean }) {
  const isOpen = comp.isOpen ?? false;
  return (
    <g stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
      <line x1="-40" y1="0" x2="-18" y2="0" />
      <line x1="18" y1="0" x2="40" y2="0" />
      {/* Contact circles */}
      <circle cx="-14" cy="0" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
      <circle cx="14" cy="0" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
      {/* Switch arm */}
      {isOpen ? (
        <line x1="-14" y1="0" x2="12" y2="-16" stroke="#f59e0b" strokeWidth="2.5" />
      ) : (
        <line x1="-14" y1="0" x2="14" y2="0" stroke="#10b981" strokeWidth="2.5" />
      )}
      <text x="0" y="22" fill={isOpen ? '#94a3b8' : '#10b981'} fontSize="9" fontFamily="monospace" textAnchor="middle" stroke="none">
        {isOpen ? 'OPEN' : 'CLOSED'}
      </text>
    </g>
  );
}

/* -------------------------------------------------------------
 * LED
 * ------------------------------------------------------------- */
function RealisticLED({ comp, simState, isBlown }: { comp: CircuitComponent; simState?: ComponentSimState; isBlown: boolean }) {
  const color = comp.ledColor ?? 'red';
  const spec = LED_SPECS[color] ?? LED_SPECS.red;
  const brightness = simState?.brightness ?? 0;
  const isConducting = simState?.isConducting ?? false;
  const glowHex = spec.hex;

  return (
    <g>
      {/* Leads: Anode left (-40), Cathode right (+40) */}
      <line x1="-40" y1="0" x2="-16" y2="0" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

      {/* Volumetric Radial Glow when conducting */}
      {!isBlown && isConducting && brightness > 0 && (
        <circle
          cx="0"
          cy="0"
          r={20 + brightness * 16}
          fill={glowHex}
          opacity={Math.min(0.85, 0.2 + brightness * 0.45)}
          style={{ filter: `blur(${6 + brightness * 8}px)` }}
        />
      )}

      {/* LED epoxy rim base */}
      <rect x="-16" y="-14" width="32" height="28" rx="4" fill="#334155" opacity="0.4" />

      {/* LED Domed Body */}
      {isBlown ? (
        // Blown LED: Charred black dome with cracked overlay
        <g>
          <path d="M -14 10 L -14 -4 C -14 -16 14 -16 14 -4 L 14 10 Z" fill="#18181b" stroke="#7f1d1d" strokeWidth="2" />
          <path d="M -5 -8 L 0 -1 L 6 -5 L 3 6" stroke="#f87171" strokeWidth="1.5" fill="none" />
          <text x="0" y="24" fill="#ef4444" fontSize="8" fontWeight="700" fontFamily="sans-serif" textAnchor="middle">
            BLOWN
          </text>
        </g>
      ) : (
        <g>
          {/* Unlit or Lit Dome */}
          <path
            d="M -14 10 L -14 -4 C -14 -16 14 -16 14 -4 L 14 10 Z"
            fill={isConducting ? glowHex : `${glowHex}44`}
            stroke={isConducting ? '#ffffff' : glowHex}
            strokeWidth={isConducting ? '2' : '1.5'}
          />
          {/* Internal Anode / Cathode anvil wireframe inside dome */}
          <path d="M -6 6 L -6 -2 L -2 -4" stroke="#ffffff" strokeWidth="1" opacity="0.7" fill="none" />
          <path d="M 6 6 L 6 -4 L 0 -4" stroke="#ffffff" strokeWidth="1.2" opacity="0.7" fill="none" />
          {/* Flat rim at cathode side (right) */}
          <line x1="14" y1="-10" x2="14" y2="10" stroke="#f8fafc" strokeWidth="1.5" opacity="0.5" />
          {/* Current readout */}
          {isConducting && (
            <text x="0" y="24" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="600" textAnchor="middle">
              {((simState?.current ?? 0) * 1000).toFixed(1)} mA
            </text>
          )}
        </g>
      )}
    </g>
  );
}

function SchematicLED({ comp, simState }: { comp: CircuitComponent; simState?: ComponentSimState }) {
  const color = comp.ledColor ?? 'red';
  const spec = LED_SPECS[color] ?? LED_SPECS.red;
  const isConducting = simState?.isConducting ?? false;

  return (
    <g stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Leads */}
      <line x1="-40" y1="0" x2="-14" y2="0" />
      <line x1="14" y1="0" x2="40" y2="0" />
      {/* Diode Triangle pointing right to cathode */}
      <polygon points="-14,-12 -14,12 10,0" fill={isConducting ? spec.hex : '#0f172a'} stroke={isConducting ? spec.hex : '#94a3b8'} />
      {/* Cathode bar */}
      <line x1="10" y1="-14" x2="10" y2="14" stroke={isConducting ? spec.hex : '#94a3b8'} strokeWidth="2.5" />
      {/* Light radiation arrows */}
      <g stroke={spec.hex} strokeWidth="1.5">
        <line x1="2" y1="-14" x2="12" y2="-22" />
        <polyline points="7,-22 12,-22 12,-17" />
        <line x1="8" y1="-9" x2="18" y2="-17" />
        <polyline points="13,-17 18,-17 18,-12" />
      </g>
      {/* Anode / Cathode indicator */}
      <text x="-20" y="-16" fill="#94a3b8" fontSize="8" fontFamily="monospace" stroke="none">A</text>
      <text x="18" y="-16" fill="#94a3b8" fontSize="8" fontFamily="monospace" stroke="none">K</text>
    </g>
  );
}

/* -------------------------------------------------------------
 * INCANDESCENT BULB
 * ------------------------------------------------------------- */
function RealisticBulb({ comp, simState }: { comp: CircuitComponent; simState?: ComponentSimState }) {
  const brightness = simState?.brightness ?? 0;
  const isLit = brightness > 0.05;

  return (
    <g>
      <line x1="-40" y1="0" x2="-20" y2="0" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />

      {/* Radial warmth glow */}
      {isLit && (
        <circle
          cx="0"
          cy="0"
          r={22 + brightness * 16}
          fill="#fef08a"
          opacity={Math.min(0.9, 0.25 + brightness * 0.55)}
          style={{ filter: `blur(${8 + brightness * 6}px)` }}
        />
      )}

      {/* Glass bulb envelope */}
      <circle cx="0" cy="0" r="18" fill={isLit ? '#fef9c3' : '#1e293b'} stroke="#cbd5e1" strokeWidth="1.5" opacity={isLit ? 0.95 : 0.6} />

      {/* Tungsten filament loop */}
      <path
        d="M -7 7 L -4 -4 C -2 -9 2 -9 4 -4 L 7 7"
        stroke={isLit ? '#ea580c' : '#64748b'}
        strokeWidth={isLit ? '2.5' : '1.5'}
        fill="none"
      />
    </g>
  );
}

function SchematicBulb({ comp, simState }: { comp: CircuitComponent; simState?: ComponentSimState }) {
  return (
    <g stroke="#94a3b8" strokeWidth="2" fill="none">
      <line x1="-40" y1="0" x2="-18" y2="0" />
      <line x1="18" y1="0" x2="40" y2="0" />
      <circle cx="0" cy="0" r="18" stroke="#38bdf8" />
      <line x1="-12" y1="-12" x2="12" y2="12" stroke="#38bdf8" />
      <line x1="-12" y1="12" x2="12" y2="-12" stroke="#38bdf8" />
    </g>
  );
}

/* -------------------------------------------------------------
 * CAPACITOR
 * ------------------------------------------------------------- */
function RealisticCapacitor({ comp }: { comp: CircuitComponent }) {
  const c = comp.capacitance ?? 100e-6;
  return (
    <g>
      <line x1="-40" y1="0" x2="-18" y2="0" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="18" y1="0" x2="40" y2="0" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
      {/* Aluminum can body (Electrolytic blue) */}
      <rect x="-18" y="-15" width="36" height="30" rx="3" fill="#1e3a8a" stroke="#1d4ed8" strokeWidth="1.5" />
      {/* Cathode negative stripe on right */}
      <rect x="8" y="-15" width="10" height="30" fill="#cbd5e1" />
      <text x="13" y="2" fill="#0f172a" fontSize="10" fontWeight="700" textAnchor="middle">
        −
      </text>
      {/* Top vent score lines */}
      <line x1="-12" y1="-10" x2="-6" y2="10" stroke="#3b82f6" strokeWidth="1" opacity="0.6" />
      {/* Label */}
      <text x="0" y="24" fill="#cbd5e1" fontSize="9" fontFamily="monospace" textAnchor="middle">
        {formatEngineeringUnits(c, 'F')}
      </text>
    </g>
  );
}

function SchematicCapacitor({ comp }: { comp: CircuitComponent }) {
  const c = comp.capacitance ?? 100e-6;
  return (
    <g stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
      <line x1="-40" y1="0" x2="-8" y2="0" />
      <line x1="8" y1="0" x2="40" y2="0" />
      {/* Positive plate (flat) */}
      <line x1="-8" y1="-18" x2="-8" y2="18" stroke="#38bdf8" strokeWidth="2.5" />
      {/* Negative plate (curved) */}
      <path d="M 8 -18 Q 2 0 8 18" stroke="#94a3b8" strokeWidth="2.5" fill="none" />
      <text x="-16" y="-10" fill="#38bdf8" fontSize="10" fontWeight="700" stroke="none">+</text>
      <text x="0" y="30" fill="#cbd5e1" fontSize="9" fontFamily="monospace" textAnchor="middle" stroke="none">
        {formatEngineeringUnits(c, 'F')}
      </text>
    </g>
  );
}

/* -------------------------------------------------------------
 * GROUND
 * ------------------------------------------------------------- */
function GroundSymbol({ comp }: { comp: CircuitComponent }) {
  return (
    <g stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
      <line x1="0" y1="-20" x2="0" y2="0" stroke="#38bdf8" />
      <line x1="-16" y1="0" x2="16" y2="0" stroke="#38bdf8" strokeWidth="2.5" />
      <line x1="-10" y1="6" x2="10" y2="6" stroke="#38bdf8" strokeWidth="2" />
      <line x1="-4" y1="12" x2="4" y2="12" stroke="#38bdf8" strokeWidth="1.5" />
      <text x="0" y="24" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle" stroke="none">
        GND (0V)
      </text>
    </g>
  );
}

/* -------------------------------------------------------------
 * METER (AMMETER / VOLTMETER)
 * ------------------------------------------------------------- */
function MeterSymbol({ comp, label, value }: { comp: CircuitComponent; label: string; value: string }) {
  return (
    <g>
      <line x1="-35" y1="0" x2="-18" y2="0" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="0" x2="35" y2="0" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      {/* Circular meter face */}
      <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
      <text x="0" y="-3" fill="#f8fafc" fontSize="12" fontWeight="700" textAnchor="middle">
        {label}
      </text>
      <text x="0" y="10" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">
        {value}
      </text>
    </g>
  );
}
