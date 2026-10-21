import React from 'react';
import { CircuitComponent, ComponentSimState, LEDColor } from '../sim/types';
import { formatEngineeringUnits } from '../sim/resistorColors';
import { LED_SPECS } from '../sim/solver';
import { Sliders, AlertTriangle, Zap, RotateCw, Trash2 } from 'lucide-react';

interface PropsPanelProps {
  component: CircuitComponent | null;
  simState?: ComponentSimState;
  onUpdateComponent: (comp: CircuitComponent) => void;
  onDeleteComponent: (id: string) => void;
}

export const PropertiesPanel: React.FC<PropsPanelProps> = ({
  component,
  simState,
  onUpdateComponent,
  onDeleteComponent,
}) => {
  if (!component) {
    return (
      <div className="p-4 text-center text-slate-500 text-xs flex flex-col items-center justify-center h-48">
        <Sliders className="w-8 h-8 text-slate-700 mb-2" />
        <p>No component selected</p>
        <p className="text-[11px] text-slate-400 mt-1">Click any component on the board to view and edit its parameters</p>
      </div>
    );
  }

  const vDrop = simState?.voltageDrop ?? 0;
  const current = simState?.current ?? 0;
  const power = simState?.power ?? 0;

  return (
    <div className="p-4 space-y-4">
      {/* Component Title & Quick Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white capitalize">
            {component.label || component.type}
          </h3>
          <span className="text-[10px] font-mono text-slate-400">ID: {component.id}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              onUpdateComponent({
                ...component,
                rotation: ((component.rotation + 90) % 360) as 0 | 90 | 180 | 270,
              })
            }
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteComponent(component.id)}
            className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Measurement Readouts */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-medium">Voltage</span>
          <div className="text-xs font-mono font-semibold text-sky-400 tabular-nums">
            {formatEngineeringUnits(vDrop, 'V')}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-medium">Current</span>
          <div className="text-xs font-mono font-semibold text-emerald-400 tabular-nums">
            {formatEngineeringUnits(current, 'A')}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-medium">Power</span>
          <div className="text-xs font-mono font-semibold text-amber-400 tabular-nums">
            {formatEngineeringUnits(power, 'W')}
          </div>
        </div>
      </div>

      {/* Warning State if overloaded or blown */}
      {simState?.isBlown && (
        <div className="flex items-center gap-2 p-2 bg-rose-950/70 border border-rose-800 text-rose-200 rounded-lg text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Burned out due to excessive forward current! (Limit: 30 mA)</span>
        </div>
      )}

      {/* Component Specific Parameter Editors */}
      <div className="space-y-3 pt-1">
        {/* Label */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Display Label</label>
          <input
            type="text"
            value={component.label || ''}
            onChange={e => onUpdateComponent({ ...component, label: e.target.value })}
            placeholder={component.type}
            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Battery Voltage */}
        {component.type === 'battery' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Supply Voltage</span>
              <span className="font-mono text-sky-400">{component.voltage ?? 9} V</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="24"
              step="0.5"
              value={component.voltage ?? 9}
              onChange={e => onUpdateComponent({ ...component, voltage: parseFloat(e.target.value) })}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex gap-1.5 pt-1">
              {[1.5, 3.0, 5.0, 9.0, 12.0].map(v => (
                <button
                  key={v}
                  onClick={() => onUpdateComponent({ ...component, voltage: v })}
                  className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono"
                >
                  {v}V
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resistor Value */}
        {component.type === 'resistor' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Resistance (Ω)</span>
              <span className="font-mono text-amber-400">
                {formatEngineeringUnits(component.resistance ?? 1000, 'Ω')}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100000"
              step="10"
              value={component.resistance ?? 1000}
              onChange={e => onUpdateComponent({ ...component, resistance: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            {/* Quick standard E12 resistor values */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[100, 220, 330, 470, 1000, 4700, 10000, 100000].map(r => (
                <button
                  key={r}
                  onClick={() => onUpdateComponent({ ...component, resistance: r })}
                  className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-center truncate"
                >
                  {formatEngineeringUnits(r, 'Ω')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Potentiometer Wiper */}
        {component.type === 'potentiometer' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Wiper Ratio</span>
              <span className="font-mono text-cyan-400">
                {((component.wiperPosition ?? 0.5) * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.99"
              step="0.01"
              value={component.wiperPosition ?? 0.5}
              onChange={e => onUpdateComponent({ ...component, wiperPosition: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="text-[11px] text-slate-400 font-mono flex justify-between">
              <span>
                R_AW: {formatEngineeringUnits((component.totalResistance ?? 10000) * (component.wiperPosition ?? 0.5), 'Ω')}
              </span>
              <span>
                R_WB: {formatEngineeringUnits((component.totalResistance ?? 10000) * (1 - (component.wiperPosition ?? 0.5)), 'Ω')}
              </span>
            </div>
          </div>
        )}

        {/* LED Color Picker */}
        {component.type === 'led' && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">LED Emitting Color</label>
            <div className="flex items-center gap-2">
              {(['red', 'green', 'blue', 'amber', 'white'] as LEDColor[]).map(color => (
                <button
                  key={color}
                  onClick={() => onUpdateComponent({ ...component, ledColor: color })}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    component.ledColor === color ? 'scale-125 border-white' : 'border-slate-700 hover:scale-110'
                  }`}
                  style={{ backgroundColor: LED_SPECS[color].hex }}
                  title={`${color} (Vf = ${LED_SPECS[color].forwardVoltage}V)`}
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Forward voltage drop: <span className="font-mono text-sky-400">{LED_SPECS[component.ledColor ?? 'red'].forwardVoltage}V</span>
            </p>
          </div>
        )}

        {/* Capacitor Value */}
        {component.type === 'capacitor' && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Capacitance</span>
              <span className="font-mono text-blue-400">
                {formatEngineeringUnits(component.capacitance ?? 100e-6, 'F')}
              </span>
            </div>
            <input
              type="range"
              min="0.000001"
              max="0.001"
              step="0.00001"
              value={component.capacitance ?? 100e-6}
              onChange={e => onUpdateComponent({ ...component, capacitance: parseFloat(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex gap-1.5 pt-1">
              {[10e-6, 47e-6, 100e-6, 220e-6, 470e-6].map(c => (
                <button
                  key={c}
                  onClick={() => onUpdateComponent({ ...component, capacitance: c })}
                  className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono"
                >
                  {formatEngineeringUnits(c, 'F')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Switch State */}
        {(component.type === 'switch' || component.type === 'pushbutton') && (
          <div className="pt-2">
            <button
              onClick={() => onUpdateComponent({ ...component, isOpen: !component.isOpen })}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                component.isOpen
                  ? 'bg-amber-950/60 border-amber-700 text-amber-300 hover:bg-amber-900/80'
                  : 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900/80'
              }`}
            >
              {component.isOpen ? 'Switch is OPEN (Click to Close)' : 'Switch is CLOSED (Click to Open)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
