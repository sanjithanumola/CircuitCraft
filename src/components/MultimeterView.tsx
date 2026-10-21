import React, { useState, useEffect, useRef } from 'react';
import { CircuitModel, SimulationResult } from '../sim/types';
import { formatEngineeringUnits } from '../sim/resistorColors';
import { Activity, Gauge, Zap } from 'lucide-react';

interface MultimeterProps {
  circuit: CircuitModel;
  simResult: SimulationResult;
  selectedComponentId: string | null;
  probes: { redTerminalId: string | null; blackTerminalId: string | null };
  onClearProbes: () => void;
}

export const MultimeterView: React.FC<MultimeterProps> = ({
  circuit,
  simResult,
  selectedComponentId,
  probes,
  onClearProbes,
}) => {
  const [mode, setMode] = useState<'voltage' | 'current' | 'power'>('voltage');
  const [history, setHistory] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate live probe measurement value
  let displayValue = 0;
  let unit = 'V';
  let measurementSource = 'Total Circuit';

  if (probes.redTerminalId && probes.blackTerminalId) {
    const redNet = simResult.terminalToNetMap[probes.redTerminalId] ?? 0;
    const blackNet = simResult.terminalToNetMap[probes.blackTerminalId] ?? 0;
    const vRed = simResult.nodeVoltages[redNet] ?? 0;
    const vBlack = simResult.nodeVoltages[blackNet] ?? 0;

    if (mode === 'voltage') {
      displayValue = vRed - vBlack;
      unit = 'V';
      measurementSource = 'Probes ΔV';
    } else if (mode === 'current') {
      displayValue = simResult.totalCurrentAmps;
      unit = 'A';
      measurementSource = 'Probes Loop';
    } else {
      displayValue = Math.abs((vRed - vBlack) * simResult.totalCurrentAmps);
      unit = 'W';
      measurementSource = 'Probes Power';
    }
  } else if (selectedComponentId) {
    const compState = simResult.componentStates[selectedComponentId];
    const comp = circuit.components.find(c => c.id === selectedComponentId);
    measurementSource = comp?.label || comp?.type || 'Component';

    if (compState) {
      if (mode === 'voltage') {
        displayValue = compState.voltageDrop;
        unit = 'V';
      } else if (mode === 'current') {
        displayValue = compState.current;
        unit = 'A';
      } else {
        displayValue = compState.power;
        unit = 'W';
      }
    }
  } else {
    // Overall circuit
    if (mode === 'voltage') {
      const bat = circuit.components.find(c => c.type === 'battery');
      displayValue = bat?.voltage ?? 0;
      unit = 'V';
      measurementSource = 'Main Supply';
    } else if (mode === 'current') {
      displayValue = simResult.totalCurrentAmps;
      unit = 'A';
      measurementSource = 'Total Loop';
    } else {
      displayValue = simResult.totalPowerWatts;
      unit = 'W';
      measurementSource = 'Total System';
    }
  }

  // Update oscilloscope history buffer at regular interval
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => {
        const next = [...prev, displayValue];
        if (next.length > 80) next.shift();
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [displayValue]);

  // Render Oscilloscope Waveform on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Center Zero line
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    if (history.length < 2) return;

    // Find scale
    const maxVal = Math.max(1, ...history.map(Math.abs));
    const yScale = (h * 0.4) / maxVal;

    // Draw trace
    ctx.strokeStyle = mode === 'voltage' ? '#38bdf8' : mode === 'current' ? '#34d399' : '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const dx = w / (history.length - 1);
    for (let i = 0; i < history.length; i++) {
      const x = i * dx;
      const y = h / 2 - history[i] * yScale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [history, mode]);

  return (
    <div className="p-4 space-y-4 select-none">
      {/* Bench Digital Multimeter Casing */}
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-xl p-4 shadow-xl shadow-black/40">
        {/* Multimeter Top Brand & Function Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-slate-200 tracking-wider">DMM-6500</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase">{measurementSource}</span>
        </div>

        {/* High-Contrast LCD Display */}
        <div className="my-3 p-3 bg-[#0a1120] border border-sky-950 rounded-lg shadow-inner flex flex-col justify-between">
          <div className="flex justify-between items-center text-[10px] text-sky-500 font-mono">
            <span>AUTO-RANGE</span>
            <span>{mode.toUpperCase()} MODE</span>
          </div>
          <div className="flex items-baseline justify-end gap-1 my-1">
            <span className="text-3xl font-mono font-bold text-sky-400 tracking-tight tabular-nums">
              {formatEngineeringUnits(displayValue, unit)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>HOLD: OFF</span>
            <span>60.0 SAMPLES/s</span>
          </div>
        </div>

        {/* Function Mode Selector Buttons */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            onClick={() => setMode('voltage')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'voltage'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            DC Volts (V)
          </button>
          <button
            onClick={() => setMode('current')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'current'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Current (A)
          </button>
          <button
            onClick={() => setMode('power')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'power'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Power (W)
          </button>
        </div>

        {/* Probe Lead Input Sockets Status */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-300" />
            <span className="text-slate-300">
              V/Ω (+):{' '}
              <span className="font-mono text-rose-400">
                {probes.redTerminalId ? 'Connected' : 'Free Lead'}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-200" />
            <span className="text-slate-300">
              COM (−):{' '}
              <span className="font-mono text-slate-400">
                {probes.blackTerminalId ? 'Connected' : 'Free Lead'}
              </span>
            </span>
          </div>
        </div>

        {(probes.redTerminalId || probes.blackTerminalId) && (
          <button
            onClick={onClearProbes}
            className="w-full mt-2.5 py-1 text-center text-[11px] text-slate-400 hover:text-slate-200 bg-slate-950/60 rounded border border-slate-800 hover:border-slate-700"
          >
            Disconnect Probes
          </button>
        )}
      </div>

      {/* Real-time Oscilloscope Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-semibold text-slate-200">Real-time Oscilloscope</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">50 ms/div</span>
        </div>
        <div className="rounded-lg overflow-hidden border border-slate-800">
          <canvas ref={canvasRef} width={260} height={100} className="w-full h-24 block" />
        </div>
      </div>
    </div>
  );
};
