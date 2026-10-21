import React from 'react';
import { ComponentType, LEDColor } from '../sim/types';
import { Zap, ToggleRight, Sun, Disc, Gauge, Radio, Plus } from 'lucide-react';

interface PaletteItem {
  type: ComponentType;
  name: string;
  category: 'Power' | 'Passives' | 'Switches' | 'Outputs' | 'Meters';
  description: string;
  defaultProps?: Record<string, any>;
  icon: React.ReactNode;
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Power
  {
    type: 'battery',
    name: 'Battery (9V)',
    category: 'Power',
    description: 'DC voltage source (9.0V default, adjustable 1.5V-24V)',
    defaultProps: { voltage: 9.0, internalResistance: 0.05, label: '9V Battery' },
    icon: <Zap className="w-4 h-4 text-amber-400" />,
  },
  {
    type: 'ground',
    name: 'Earth Ground',
    category: 'Power',
    description: '0V potential reference node',
    defaultProps: { label: 'GND' },
    icon: <div className="w-4 h-4 flex items-center justify-center font-bold text-sky-400 text-xs">⏚</div>,
  },
  // Passives
  {
    type: 'resistor',
    name: 'Resistor (1kΩ)',
    category: 'Passives',
    description: 'Limits current flow and drops voltage per Ohm’s Law',
    defaultProps: { resistance: 1000, maxPowerRating: 0.25, label: '1 kΩ' },
    icon: <div className="w-4 h-4 flex items-center justify-center font-bold text-amber-500 text-xs">Ω</div>,
  },
  {
    type: 'potentiometer',
    name: 'Potentiometer (10kΩ)',
    category: 'Passives',
    description: 'Rotary variable resistor and 3-pin voltage divider',
    defaultProps: { totalResistance: 10000, wiperPosition: 0.5, label: '10kΩ Pot' },
    icon: <Radio className="w-4 h-4 text-cyan-400" />,
  },
  {
    type: 'capacitor',
    name: 'Capacitor (100µF)',
    category: 'Passives',
    description: 'Stores electrical energy; blocks steady DC after charging',
    defaultProps: { capacitance: 100e-6, chargeVoltage: 0, label: '100 µF' },
    icon: <Disc className="w-4 h-4 text-blue-400" />,
  },
  // Switches
  {
    type: 'switch',
    name: 'Toggle Switch',
    category: 'Switches',
    description: 'Single-pole single-throw (SPST) on/off knife switch',
    defaultProps: { isOpen: false, label: 'Switch' },
    icon: <ToggleRight className="w-4 h-4 text-emerald-400" />,
  },
  {
    type: 'pushbutton',
    name: 'Pushbutton',
    category: 'Switches',
    description: 'Momentary contact switch (press to make connection)',
    defaultProps: { isOpen: true, isMomentary: true, label: 'Button' },
    icon: <div className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-300" />,
  },
  // Outputs
  {
    type: 'led',
    name: 'Red LED',
    category: 'Outputs',
    description: '1.9V forward drop; requires resistor to prevent burnout',
    defaultProps: { ledColor: 'red', label: 'Red LED' },
    icon: <Sun className="w-4 h-4 text-rose-500" />,
  },
  {
    type: 'led',
    name: 'Green LED',
    category: 'Outputs',
    description: '2.2V forward drop; high efficiency indicator',
    defaultProps: { ledColor: 'green', label: 'Green LED' },
    icon: <Sun className="w-4 h-4 text-emerald-400" />,
  },
  {
    type: 'led',
    name: 'Blue LED',
    category: 'Outputs',
    description: '3.1V forward drop; high energy semiconductor',
    defaultProps: { ledColor: 'blue', label: 'Blue LED' },
    icon: <Sun className="w-4 h-4 text-sky-400" />,
  },
  {
    type: 'bulb',
    name: 'Lamp / Bulb',
    category: 'Outputs',
    description: 'Incandescent filament lamp with thermal glow',
    defaultProps: { coldResistance: 24, ratedPower: 1.5, label: 'Lamp' },
    icon: <Sun className="w-4 h-4 text-amber-300" />,
  },
  // Meters
  {
    type: 'voltmeter',
    name: 'Voltmeter',
    category: 'Meters',
    description: 'High impedance voltage meter across two points',
    defaultProps: { label: 'Voltmeter' },
    icon: <Gauge className="w-4 h-4 text-sky-400" />,
  },
  {
    type: 'ammeter',
    name: 'Ammeter',
    category: 'Meters',
    description: 'In-line series current meter',
    defaultProps: { label: 'Ammeter' },
    icon: <Gauge className="w-4 h-4 text-emerald-400" />,
  },
];

interface PaletteProps {
  onAddComponent: (type: ComponentType, defaultProps?: Record<string, any>) => void;
}

export const ComponentPalette: React.FC<PaletteProps> = ({ onAddComponent }) => {
  const categories = ['Power', 'Passives', 'Switches', 'Outputs', 'Meters'] as const;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-y-auto shrink-0 select-none">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-white tracking-tight">Component Workbench</h2>
        <p className="text-xs text-slate-400 mt-0.5">Click or drag items to place on canvas</p>
      </div>

      <div className="p-3 space-y-4">
        {categories.map(cat => {
          const items = PALETTE_ITEMS.filter(it => it.category === cat);
          return (
            <div key={cat} className="space-y-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-1">
                {cat}
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {items.map((item, idx) => (
                  <button
                    key={`${item.type}-${idx}`}
                    onClick={() => onAddComponent(item.type, item.defaultProps)}
                    className="group flex items-center justify-between w-full px-2.5 py-2 text-left bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800/80 hover:border-slate-700 rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 group-hover:border-sky-500/50 transition-colors">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
