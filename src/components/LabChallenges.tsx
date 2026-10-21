import React, { useMemo } from 'react';
import { CircuitModel, SimulationResult } from '../sim/types';
import { LAB_CHALLENGES } from '../sim/presets';
import { CheckCircle2, Circle, Lightbulb, Award } from 'lucide-react';

interface LabProps {
  circuit: CircuitModel;
  simResult: SimulationResult;
  onLoadPreset: (id: string) => void;
}

export const LabChallenges: React.FC<LabProps> = ({ circuit, simResult, onLoadPreset }) => {
  const challengeResults = useMemo(() => {
    return LAB_CHALLENGES.map(ch => {
      const outcome = ch.check(circuit, simResult);
      return {
        ...ch,
        isCompleted: outcome.completed,
        feedback: outcome.feedback,
      };
    });
  }, [circuit, simResult]);

  const completedCount = challengeResults.filter(c => c.isCompleted).length;

  return (
    <div className="p-4 space-y-4 select-none">
      {/* Header with progress */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white">Lab Experiments</h3>
          <p className="text-xs text-slate-400">Complete practical circuit missions</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-950/60 border border-sky-800/80 rounded-lg text-xs font-medium text-sky-300">
          <Award className="w-4 h-4 text-sky-400" />
          <span>
            {completedCount} / {LAB_CHALLENGES.length} Completed
          </span>
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-3">
        {challengeResults.map(ch => (
          <div
            key={ch.id}
            className={`p-3 rounded-xl border transition-all ${
              ch.isCompleted
                ? 'bg-emerald-950/20 border-emerald-800/60'
                : 'bg-slate-900/70 border-slate-800'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {ch.isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-100">{ch.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {ch.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{ch.instructions}</p>

                {/* Status / Feedback */}
                <div
                  className={`text-[11px] p-2 rounded-lg font-medium leading-relaxed ${
                    ch.isCompleted
                      ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-900'
                      : 'bg-slate-950/80 text-slate-400 border border-slate-800'
                  }`}
                >
                  {ch.feedback}
                </div>

                {/* Hint Disclosure */}
                <details className="text-[11px] text-slate-400 pt-1 group">
                  <summary className="cursor-pointer text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>View Hint</span>
                  </summary>
                  <p className="mt-1.5 pl-4 text-slate-300 italic">{ch.hint}</p>
                </details>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
