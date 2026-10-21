import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  CircuitComponent,
  CircuitModel,
  ComponentSimState,
  SimulationResult,
  Terminal,
  Wire,
} from '../sim/types';
import { getComponentTerminals } from '../sim/solver';
import { ComponentVisual } from './ComponentVisuals';
import { RotateCw, Trash2, Zap, AlertTriangle, HelpCircle } from 'lucide-react';
import { formatEngineeringUnits } from '../sim/resistorColors';

interface ProbeState {
  redTerminalId: string | null;
  blackTerminalId: string | null;
}

interface CircuitCanvasProps {
  circuit: CircuitModel;
  simResult: SimulationResult;
  isSchematic: boolean;
  electronFlow: boolean;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onUpdateComponent: (comp: CircuitComponent) => void;
  onDeleteComponent: (id: string) => void;
  onAddWire: (wire: Wire) => void;
  onDeleteWire: (wireId: string) => void;
  onToggleSwitch: (comp: CircuitComponent) => void;
  probes: ProbeState;
  onSetProbe: (color: 'red' | 'black', terminalId: string | null) => void;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  circuit,
  simResult,
  isSchematic,
  electronFlow,
  selectedComponentId,
  onSelectComponent,
  onUpdateComponent,
  onDeleteComponent,
  onAddWire,
  onDeleteWire,
  onToggleSwitch,
  probes,
  onSetProbe,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Wiring state
  const [wiringStartTerm, setWiringStartTerm] = useState<Terminal | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredTerm, setHoveredTerm] = useState<Terminal | null>(null);
  const [hoveredWireId, setHoveredWireId] = useState<string | null>(null);

  // Component dragging
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Probe placement mode
  const [activeProbeMode, setActiveProbeMode] = useState<'red' | 'black' | null>(null);

  // Continuous animation frame for moving electron particles
  const [animTime, setAnimTime] = useState(0);

  useEffect(() => {
    let animId: number;
    let lastT = performance.now();
    const loop = (t: number) => {
      const dt = (t - lastT) / 1000;
      lastT = t;
      setAnimTime(prev => (prev + dt) % 10000);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Map of all component terminals with updated absolute positions
  const terminalsByComp = useMemo(() => {
    const map = new Map<string, Terminal[]>();
    for (const comp of circuit.components) {
      map.set(comp.id, getComponentTerminals(comp));
    }
    return map;
  }, [circuit.components]);

  const allTerminalsMap = useMemo(() => {
    const map = new Map<string, Terminal>();
    terminalsByComp.forEach(terms => {
      terms.forEach(t => map.set(t.id, t));
    });
    return map;
  }, [terminalsByComp]);

  // Transform screen coordinates to circuit canvas coordinates
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: clientX, y: clientY };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.4), 2.5);
    setZoom(newZoom);
  };

  // Handle Mouse Down on background for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      if (wiringStartTerm) {
        setWiringStartTerm(null);
        return;
      }
      onSelectComponent(null);
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  // Handle Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    const world = screenToWorld(e.clientX, e.clientY);
    setMousePos(world);

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingCompId) {
      const comp = circuit.components.find(c => c.id === draggingCompId);
      if (comp) {
        // Snap to 10px grid
        const rawX = world.x - dragOffset.x;
        const rawY = world.y - dragOffset.y;
        const snappedX = Math.round(rawX / 10) * 10;
        const snappedY = Math.round(rawY / 10) * 10;
        onUpdateComponent({ ...comp, x: snappedX, y: snappedY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingCompId(null);
  };

  // Wire generation path helper
  const getWirePath = (t1: Terminal, t2: Terminal) => {
    const dx = t2.x - t1.x;
    const dy = t2.y - t1.y;
    // Elegant S-curved cubic bezier
    const cx1 = t1.x + dx * 0.4;
    const cy1 = t1.y;
    const cx2 = t2.x - dx * 0.4;
    const cy2 = t2.y;
    return `M ${t1.x} ${t1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${t2.x} ${t2.y}`;
  };

  // Terminal click handler
  const handleTerminalClick = (e: React.MouseEvent, term: Terminal) => {
    e.stopPropagation();

    // If in probe placement mode
    if (activeProbeMode) {
      onSetProbe(activeProbeMode, term.id);
      setActiveProbeMode(null);
      return;
    }

    if (!wiringStartTerm) {
      setWiringStartTerm(term);
    } else {
      if (wiringStartTerm.id !== term.id) {
        // Create new wire
        const newWire: Wire = {
          id: `wire_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          fromTerminalId: wiringStartTerm.id,
          toTerminalId: term.id,
          color: '#38bdf8',
        };
        onAddWire(newWire);
      }
      setWiringStartTerm(null);
    }
  };

  const selectedComp = circuit.components.find(c => c.id === selectedComponentId);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 overflow-hidden cursor-crosshair select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      data-testid="circuit-canvas"
    >
      {/* Background Engineering Blueprint Grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.15) 1.2px, transparent 1.2px)`,
        }}
      />

      {/* SVG Canvas for Components, Wires, and Particles */}
      <svg
        className="w-full h-full absolute inset-0 pointer-events-auto"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Existing Wires */}
        {circuit.wires.map(wire => {
          const t1 = allTerminalsMap.get(wire.fromTerminalId);
          const t2 = allTerminalsMap.get(wire.toTerminalId);
          if (!t1 || !t2) return null;

          const pathD = getWirePath(t1, t2);
          const current = simResult.wireCurrents[wire.id] ?? 0;
          const dir = simResult.wireDirections[wire.id] ?? 1;
          const isLive = current > 1e-6;
          const isHovered = hoveredWireId === wire.id;

          // Particle speed scales with current
          const flowDir = electronFlow ? -dir : dir;
          const speed = isLive ? Math.min(25, 3 + Math.sqrt(current * 1000) * 4) : 0;
          const dashOffset = -flowDir * animTime * speed * 12;

          return (
            <g
              key={wire.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredWireId(wire.id)}
              onMouseLeave={() => setHoveredWireId(null)}
              onClick={e => {
                e.stopPropagation();
                onDeleteWire(wire.id);
              }}
            >
              {/* Invisible thick click hitzone */}
              <path d={pathD} fill="none" stroke="transparent" strokeWidth="16" />

              {/* Base Wire Core */}
              <path
                d={pathD}
                fill="none"
                stroke={isHovered ? '#f43f5e' : isLive ? '#0284c7' : '#475569'}
                strokeWidth={isHovered ? 4 : 3}
                strokeLinecap="round"
                opacity={isHovered ? 1 : 0.85}
              />

              {/* Animated Current / Electron Flow particles */}
              {isLive && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={electronFlow ? '#38bdf8' : '#fbbf24'}
                  strokeWidth="3.5"
                  strokeDasharray="4 16"
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
              )}

              {/* Hover Delete Badge */}
              {isHovered && (
                <g transform={`translate(${(t1.x + t2.x) / 2}, ${(t1.y + t2.y) / 2})`}>
                  <circle cx="0" cy="0" r="10" fill="#dc2626" />
                  <text x="0" y="3.5" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                    ✕
                  </text>
                  <rect x="14" y="-12" width="60" height="20" rx="3" fill="#0f172a" stroke="#dc2626" strokeWidth="1" />
                  <text x="44" y="2" fill="#f8fafc" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    {formatEngineeringUnits(current, 'A')}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* 2. Dynamic Rubber-band Wire when creating a connection */}
        {wiringStartTerm && (
          <g pointerEvents="none">
            <path
              d={getWirePath(wiringStartTerm, {
                id: 'temp',
                componentId: '',
                name: '',
                x: hoveredTerm ? hoveredTerm.x : mousePos.x,
                y: hoveredTerm ? hoveredTerm.y : mousePos.y,
              })}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
            <circle
              cx={hoveredTerm ? hoveredTerm.x : mousePos.x}
              cy={hoveredTerm ? hoveredTerm.y : mousePos.y}
              r="6"
              fill="#38bdf8"
              opacity="0.8"
            />
          </g>
        )}

        {/* 3. Circuit Components */}
        {circuit.components.map(comp => {
          const simState = simResult.componentStates[comp.id];
          const isSelected = selectedComponentId === comp.id;

          return (
            <g
              key={comp.id}
              transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`}
              className="cursor-move"
              onMouseDown={e => {
                e.stopPropagation();
                onSelectComponent(comp.id);
                const world = screenToWorld(e.clientX, e.clientY);
                setDraggingCompId(comp.id);
                setDragOffset({ x: world.x - comp.x, y: world.y - comp.y });
              }}
              onClick={e => {
                // If switch, direct toggle
                if (comp.type === 'switch' || comp.type === 'pushbutton') {
                  e.stopPropagation();
                  onToggleSwitch(comp);
                }
              }}
            >
              {/* Selection Halo */}
              {isSelected && (
                <rect
                  x="-46"
                  y="-32"
                  width="92"
                  height="64"
                  rx="6"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
              )}

              {/* Render Component Body */}
              <ComponentVisual
                component={comp}
                simState={simState}
                isSchematic={isSchematic}
                isSelected={isSelected}
              />
            </g>
          );
        })}

        {/* 4. Connection Terminals Snap Rings (on top of components) */}
        {Array.from(allTerminalsMap.values()).map(term => {
          const isHovered = hoveredTerm?.id === term.id;
          const isWiringSource = wiringStartTerm?.id === term.id;
          const isRedProbe = probes.redTerminalId === term.id;
          const isBlackProbe = probes.blackTerminalId === term.id;
          const termV = simResult.componentStates[term.componentId]?.terminalVoltages[term.id];

          return (
            <g
              key={term.id}
              transform={`translate(${term.x}, ${term.y})`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredTerm(term)}
              onMouseLeave={() => setHoveredTerm(null)}
              onClick={e => handleTerminalClick(e, term)}
            >
              {/* Magnetic snap halo */}
              <circle
                cx="0"
                cy="0"
                r={isHovered || isWiringSource ? 10 : 6}
                fill={isWiringSource ? '#38bdf8' : isHovered ? 'rgba(56, 189, 248, 0.4)' : '#0f172a'}
                stroke={isWiringSource ? '#ffffff' : '#38bdf8'}
                strokeWidth={isHovered ? 2.5 : 1.5}
              />
              <circle cx="0" cy="0" r="2.5" fill="#f8fafc" />

              {/* Red / Black Multimeter Probe Clip Indicators */}
              {isRedProbe && (
                <g transform="translate(0, -18)">
                  <polygon points="0,0 -6,-14 6,-14" fill="#dc2626" />
                  <rect x="-8" y="-24" width="16" height="10" rx="2" fill="#991b1b" />
                  <text x="0" y="-16" fill="#f8fafc" fontSize="7" fontWeight="bold" textAnchor="middle">
                    V+
                  </text>
                </g>
              )}
              {isBlackProbe && (
                <g transform="translate(0, 18)">
                  <polygon points="0,0 -6,14 6,14" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                  <rect x="-8" y="14" width="16" height="10" rx="2" fill="#0f172a" />
                  <text x="0" y="22" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle">
                    COM
                  </text>
                </g>
              )}

              {/* Voltage hover readout */}
              {isHovered && termV !== undefined && (
                <g transform="translate(0, -22)" pointerEvents="none">
                  <rect x="-30" y="-16" width="60" height="18" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                  <text x="0" y="-3" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="600" textAnchor="middle">
                    {termV.toFixed(2)} V
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Canvas Action Bar for Selected Component */}
      {selectedComp && (
        <div
          className="absolute z-10 flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg shadow-xl"
          style={{
            left: `${selectedComp.x * zoom + pan.x}px`,
            top: `${(selectedComp.y - 50) * zoom + pan.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <button
            onClick={() => onUpdateComponent({ ...selectedComp, rotation: ((selectedComp.rotation + 90) % 360) as 0 | 90 | 180 | 270 })}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Rotate 90° (R)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          {(selectedComp.type === 'switch' || selectedComp.type === 'pushbutton') && (
            <button
              onClick={() => onToggleSwitch(selectedComp)}
              className="px-2 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/50 rounded transition-colors"
            >
              Toggle
            </button>
          )}
          <button
            onClick={() => onDeleteComponent(selectedComp.id)}
            className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 rounded transition-colors"
            title="Delete Component (Del)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Canvas HUD Overlays */}
      {/* Top Left: Wiring Hint / Active Mode */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {wiringStartTerm && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-950/90 border border-sky-500/50 text-sky-200 text-xs rounded-lg shadow-lg">
            <Zap className="w-4 h-4 text-sky-400 animate-pulse" />
            <span>Click any terminal to connect wire (or click canvas to cancel)</span>
            <button
              onClick={() => setWiringStartTerm(null)}
              className="ml-2 text-sky-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Short Circuit Warning Alert */}
        {simResult.hasShortCircuit && (
          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-rose-950/90 border border-rose-500 text-rose-100 text-xs font-medium rounded-lg shadow-xl animate-bounce">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{simResult.shortCircuitMessage || 'Short Circuit! Excessive current detected.'}</span>
          </div>
        )}
      </div>

      {/* Bottom Floating Bar: Multimeter Quick Probes & Zoom Controls */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Multimeter Leads */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg text-xs pointer-events-auto shadow-lg">
          <span className="text-slate-400 px-1 font-medium hidden sm:inline">Probes:</span>
          <button
            onClick={() => setActiveProbeMode(activeProbeMode === 'red' ? null : 'red')}
            className={`flex items-center gap-1 px-2 py-1 rounded font-medium text-xs transition-colors ${
              activeProbeMode === 'red'
                ? 'bg-rose-600 text-white shadow'
                : probes.redTerminalId
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'text-rose-400 hover:bg-rose-950/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{probes.redTerminalId ? 'Red (V+)' : 'Red Lead'}</span>
          </button>
          <button
            onClick={() => setActiveProbeMode(activeProbeMode === 'black' ? null : 'black')}
            className={`flex items-center gap-1 px-2 py-1 rounded font-medium text-xs transition-colors ${
              activeProbeMode === 'black'
                ? 'bg-slate-700 text-white shadow'
                : probes.blackTerminalId
                ? 'bg-slate-800 text-slate-300 border border-slate-700'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>{probes.blackTerminalId ? 'Black (COM)' : 'Black Lead'}</span>
          </button>
          {(probes.redTerminalId || probes.blackTerminalId) && (
            <button
              onClick={() => {
                onSetProbe('red', null);
                onSetProbe('black', null);
              }}
              className="px-1.5 py-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 text-[11px]"
              title="Clear Probes"
            >
              Clear
            </button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur border border-slate-800 p-1 rounded-lg text-xs pointer-events-auto shadow-lg ml-auto">
          <button
            onClick={() => setZoom(z => Math.max(z * 0.9, 0.4))}
            className="px-2 py-1 text-slate-300 hover:bg-slate-800 rounded font-mono"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="px-1 text-slate-400 font-mono tabular-nums text-[11px]">{(zoom * 100).toFixed(0)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(z * 1.1, 2.5))}
            className="px-2 py-1 text-slate-300 hover:bg-slate-800 rounded font-mono"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => {
              setPan({ x: 0, y: 0 });
              setZoom(1);
            }}
            className="px-1.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-[11px]"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
