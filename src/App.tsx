/**
 * CircuitCraft - Interactive Electronics Workbench
 * Build simple circuits with batteries, resistors, switches, and LEDs,
 * then simulate voltage and current in real time.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CircuitComponent, CircuitModel, ComponentType, SimulationResult, Wire } from './sim/types';
import { solveCircuit, stepSimulationModel } from './sim/solver';
import { PRESET_CIRCUITS } from './sim/presets';
import { TopBar } from './components/TopBar';
import { ComponentPalette } from './components/ComponentPalette';
import { CircuitCanvas } from './components/CircuitCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { MultimeterView } from './components/MultimeterView';
import { LabChallenges } from './components/LabChallenges';
import { Sliders, Gauge, Award, X } from 'lucide-react';

export default function App() {
  // Main circuit state (defaults to Simple LED Circuit)
  const [circuit, setCircuit] = useState<CircuitModel>(() => PRESET_CIRCUITS[0].circuit);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  // Simulation controls
  const [isSimulating, setIsSimulating] = useState(true);
  const [isSchematic, setIsSchematic] = useState(false);
  const [electronFlow, setElectronFlow] = useState(false);

  // Responsive mobile drawer states
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);

  // Multimeter probes
  const [probes, setProbes] = useState<{ redTerminalId: string | null; blackTerminalId: string | null }>({
    redTerminalId: null,
    blackTerminalId: null,
  });

  // Right sidebar tab
  const [activeTab, setActiveTab] = useState<'inspector' | 'multimeter' | 'challenges'>('inspector');

  // Live simulation result
  const [simResult, setSimResult] = useState<SimulationResult>(() => solveCircuit(circuit));

  // Run solver whenever circuit changes
  useEffect(() => {
    const res = solveCircuit(circuit);
    setSimResult(res);
  }, [circuit]);

  // Simulation clock loop for dynamic components (capacitors, LED burnout)
  useEffect(() => {
    if (!isSimulating) return;

    let animId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      setCircuit(prevModel => {
        const currentSim = solveCircuit(prevModel, { dt });
        const { updatedModel } = stepSimulationModel(prevModel, currentSim, dt);
        return updatedModel;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isSimulating]);

  // Component operations
  const handleAddComponent = (type: ComponentType, defaultProps: Record<string, any> = {}) => {
    const id = `${type}_${Date.now().toString(36)}`;
    const offset = (circuit.components.length * 25) % 150;
    const newComp: CircuitComponent = {
      id,
      type,
      x: 350 + offset,
      y: 250 + offset,
      rotation: 0,
      ...defaultProps,
    };

    setCircuit(prev => ({
      ...prev,
      components: [...prev.components, newComp],
    }));
    setSelectedComponentId(id);
    setActiveTab('inspector');
    setMobilePaletteOpen(false);
  };

  const handleUpdateComponent = (updated: CircuitComponent) => {
    setCircuit(prev => ({
      ...prev,
      components: prev.components.map(c => (c.id === updated.id ? updated : c)),
    }));
  };

  const handleDeleteComponent = (id: string) => {
    setCircuit(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== id),
      wires: prev.wires.filter(
        w => !w.fromTerminalId.startsWith(`${id}:`) && !w.toTerminalId.startsWith(`${id}:`)
      ),
    }));
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
  };

  const handleAddWire = (wire: Wire) => {
    setCircuit(prev => ({
      ...prev,
      wires: [...prev.wires, wire],
    }));
  };

  const handleDeleteWire = (wireId: string) => {
    setCircuit(prev => ({
      ...prev,
      wires: prev.wires.filter(w => w.id !== wireId),
    }));
  };

  const handleToggleSwitch = (comp: CircuitComponent) => {
    handleUpdateComponent({
      ...comp,
      isOpen: !comp.isOpen,
    });
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = PRESET_CIRCUITS.find(p => p.id === presetId);
    if (preset) {
      const cloned: CircuitModel = JSON.parse(JSON.stringify(preset.circuit));
      setCircuit(cloned);
      setSelectedComponentId(null);
      setProbes({ redTerminalId: null, blackTerminalId: null });
      setMobilePaletteOpen(false);
      setMobileInspectorOpen(false);
    }
  };

  const handleClearCircuit = () => {
    setCircuit({ components: [], wires: [] });
    setSelectedComponentId(null);
    setProbes({ redTerminalId: null, blackTerminalId: null });
  };

  const handleResetBlownComponents = () => {
    setCircuit(prev => ({
      ...prev,
      components: prev.components.map(c => (c.isBlown ? { ...c, isBlown: false } : c)),
    }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponentId) {
        handleDeleteComponent(selectedComponentId);
      } else if ((e.key === 'r' || e.key === 'R') && selectedComponentId) {
        const comp = circuit.components.find(c => c.id === selectedComponentId);
        if (comp) {
          handleUpdateComponent({
            ...comp,
            rotation: ((comp.rotation + 90) % 360) as 0 | 90 | 180 | 270,
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, circuit]);

  const selectedComp = circuit.components.find(c => c.id === selectedComponentId) || null;
  const selectedSimState = selectedComponentId ? simResult.componentStates[selectedComponentId] : undefined;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Header (Compliant with Top Bar Contract) */}
      <TopBar
        isSimulating={isSimulating}
        onToggleSimulate={() => setIsSimulating(!isSimulating)}
        isSchematic={isSchematic}
        onToggleSchematic={() => setIsSchematic(!isSchematic)}
        electronFlow={electronFlow}
        onToggleElectronFlow={() => setElectronFlow(!electronFlow)}
        onLoadPreset={handleLoadPreset}
        onClearCircuit={handleClearCircuit}
        onResetBlownComponents={handleResetBlownComponents}
        onToggleMobilePalette={() => setMobilePaletteOpen(!mobilePaletteOpen)}
        onToggleMobileInspector={() => setMobileInspectorOpen(!mobileInspectorOpen)}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left: Component Palette (Desktop fixed, Mobile sliding overlay) */}
        <div
          className={`lg:relative lg:block ${
            mobilePaletteOpen ? 'absolute inset-y-0 left-0 z-40 block shadow-2xl' : 'hidden'
          }`}
        >
          {mobilePaletteOpen && (
            <div className="lg:hidden flex items-center justify-between p-2 bg-slate-900 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-200">Components</span>
              <button
                onClick={() => setMobilePaletteOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <ComponentPalette onAddComponent={handleAddComponent} />
        </div>

        {/* Backdrop for mobile palette */}
        {mobilePaletteOpen && (
          <div
            onClick={() => setMobilePaletteOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 z-30"
          />
        )}

        {/* Center: Circuit Interactive Stage */}
        <main className="flex-1 h-full relative overflow-hidden flex flex-col">
          <CircuitCanvas
            circuit={circuit}
            simResult={simResult}
            isSchematic={isSchematic}
            electronFlow={electronFlow}
            selectedComponentId={selectedComponentId}
            onSelectComponent={id => {
              setSelectedComponentId(id);
              if (id) {
                setActiveTab('inspector');
              }
            }}
            onUpdateComponent={handleUpdateComponent}
            onDeleteComponent={handleDeleteComponent}
            onAddWire={handleAddWire}
            onDeleteWire={handleDeleteWire}
            onToggleSwitch={handleToggleSwitch}
            probes={probes}
            onSetProbe={(color, termId) => {
              setProbes(prev => ({
                ...prev,
                [color === 'red' ? 'redTerminalId' : 'blackTerminalId']: termId,
              }));
              setActiveTab('multimeter');
            }}
          />
        </main>

        {/* Right: Tabbed Analysis & Control Deck (Desktop fixed, Mobile sliding overlay) */}
        <div
          className={`lg:relative lg:block ${
            mobileInspectorOpen ? 'absolute inset-y-0 right-0 z-40 block shadow-2xl' : 'hidden'
          }`}
        >
          <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0">
            {/* Mobile Close Button */}
            {mobileInspectorOpen && (
              <div className="lg:hidden flex items-center justify-between p-2 bg-slate-950 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-200">Lab Deck</span>
                <button
                  onClick={() => setMobileInspectorOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-slate-800 bg-slate-950/60 p-1">
              <button
                onClick={() => setActiveTab('inspector')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'inspector'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Inspector</span>
              </button>
              <button
                onClick={() => setActiveTab('multimeter')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'multimeter'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Multimeter</span>
              </button>
              <button
                onClick={() => setActiveTab('challenges')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'challenges'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Lab Missions</span>
              </button>
            </div>

            {/* Active Tab Body */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'inspector' && (
                <PropertiesPanel
                  component={selectedComp}
                  simState={selectedSimState}
                  onUpdateComponent={handleUpdateComponent}
                  onDeleteComponent={handleDeleteComponent}
                />
              )}
              {activeTab === 'multimeter' && (
                <MultimeterView
                  circuit={circuit}
                  simResult={simResult}
                  selectedComponentId={selectedComponentId}
                  probes={probes}
                  onClearProbes={() => setProbes({ redTerminalId: null, blackTerminalId: null })}
                />
              )}
              {activeTab === 'challenges' && (
                <LabChallenges
                  circuit={circuit}
                  simResult={simResult}
                  onLoadPreset={handleLoadPreset}
                />
              )}
            </div>
          </aside>
        </div>

        {/* Backdrop for mobile inspector */}
        {mobileInspectorOpen && (
          <div
            onClick={() => setMobileInspectorOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 z-30"
          />
        )}
      </div>
    </div>
  );
}
