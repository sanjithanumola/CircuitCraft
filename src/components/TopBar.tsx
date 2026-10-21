import React from 'react';
import { PRESET_CIRCUITS } from '../sim/presets';
import { Play, Pause, Cpu, Menu, Sliders } from 'lucide-react';

interface TopBarProps {
  isSimulating: boolean;
  onToggleSimulate: () => void;
  isSchematic: boolean;
  onToggleSchematic: () => void;
  electronFlow: boolean;
  onToggleElectronFlow: () => void;
  onLoadPreset: (presetId: string) => void;
  onClearCircuit: () => void;
  onResetBlownComponents: () => void;
  onToggleMobilePalette?: () => void;
  onToggleMobileInspector?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isSimulating,
  onToggleSimulate,
  isSchematic,
  onToggleSchematic,
  electronFlow,
  onToggleElectronFlow,
  onLoadPreset,
  onClearCircuit,
  onResetBlownComponents,
  onToggleMobilePalette,
  onToggleMobileInspector,
}) => {
  return (
    <header className="flex items-center justify-between gap-4 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-slate-100 shrink-0">
      {/* Zone 1: Brand Wordmark & Mobile Drawer Toggles */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        {onToggleMobilePalette && (
          <button
            onClick={onToggleMobilePalette}
            className="lg:hidden p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg"
            aria-label="Toggle Component Workbench"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <a href="/" className="flex items-center gap-2 text-base font-bold tracking-tight text-white hover:text-sky-400 transition-colors">
          <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/30">
            <Cpu className="w-4 h-4" />
          </div>
          <span>CircuitCraft</span>
        </a>
      </div>

      {/* Zone 2: Clean Segmented Controls & Presets */}
      <div className="hidden md:flex items-center gap-3 whitespace-nowrap shrink-0">
        {/* Presets Select */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="preset-select" className="text-xs text-slate-400 font-medium">
            Presets:
          </label>
          <select
            id="preset-select"
            defaultValue=""
            onChange={e => {
              if (e.target.value) {
                onLoadPreset(e.target.value);
                e.target.value = '';
              }
            }}
            className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer max-w-[200px] truncate"
          >
            <option value="" disabled>
              Select Circuit...
            </option>
            {PRESET_CIRCUITS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Style: Realistic vs Schematic */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
          <button
            onClick={onToggleSchematic}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              !isSchematic ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Realistic
          </button>
          <button
            onClick={onToggleSchematic}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              isSchematic ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Schematic
          </button>
        </div>

        {/* Current Flow Style */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
          <button
            onClick={onToggleElectronFlow}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              !electronFlow ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Conventional positive-to-negative current"
          >
            Conventional
          </button>
          <button
            onClick={onToggleElectronFlow}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              electronFlow ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Electron negative-to-positive flow"
          >
            Electron Flow
          </button>
        </div>

        {/* Simulation Play / Pause */}
        <button
          onClick={onToggleSimulate}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
            isSimulating
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
              : 'bg-amber-950 text-amber-300 border-amber-800 hover:bg-amber-900'
          }`}
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isSimulating ? 'Simulating' : 'Paused'}</span>
        </button>
      </div>

      {/* Zone 3: Actions (Reset Blown, Clear, Mobile Inspector) */}
      <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
        <button
          onClick={onResetBlownComponents}
          className="hidden sm:inline-block px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          title="Reset blown LEDs and parts"
        >
          Reset Blown
        </button>
        <button
          onClick={onClearCircuit}
          className="px-2.5 sm:px-3 py-1 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors"
        >
          Clear
        </button>
        {onToggleMobileInspector && (
          <button
            onClick={onToggleMobileInspector}
            className="lg:hidden p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg"
            aria-label="Toggle Inspector & Multimeter"
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
