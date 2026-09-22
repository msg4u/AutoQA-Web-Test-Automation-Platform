import React, { useState } from 'react';
import { Columns, SplitSquareVertical, Eye, Layers } from 'lucide-react';

interface VisualDiffViewerProps {
  currentScreenshot: string;
  baselineScreenshot: string;
  diffPercentage?: number;
  stepDescription: string;
}

export const VisualDiffViewer: React.FC<VisualDiffViewerProps> = ({
  currentScreenshot,
  baselineScreenshot,
  diffPercentage = 4.8,
  stepDescription,
}) => {
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'overlay'>('slider');
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Header controls */}
      <div className="bg-slate-800/80 border-b border-slate-700 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-blue-400" />
          <span className="font-semibold text-slate-200">Visual Regression Diff:</span>
          <span className="text-slate-400 truncate max-w-sm">{stepDescription}</span>
          <span className="bg-rose-500/20 text-rose-400 font-mono font-semibold px-2 py-0.5 rounded border border-rose-500/30">
            {diffPercentage}% visual diff
          </span>
        </div>

        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700">
          <button
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'slider' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SplitSquareVertical className="h-3.5 w-3.5" />
            <span>Interactive Slider</span>
          </button>

          <button
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'side-by-side' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Side by Side</span>
          </button>

          <button
            onClick={() => setViewMode('overlay')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'overlay' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Diff Overlay</span>
          </button>
        </div>
      </div>

      {/* Main Diff Display */}
      <div className="p-4 bg-slate-950 flex items-center justify-center">
        {/* SLIDER VIEW */}
        {viewMode === 'slider' && (
          <div className="w-full max-w-4xl relative select-none overflow-hidden rounded-lg border border-slate-800 shadow-md">
            {/* Baseline Image (Full Background) */}
            <img
              src={baselineScreenshot}
              alt="Baseline screenshot"
              className="w-full h-auto block pointer-events-none"
            />

            {/* Current Image (Clipped by Slider) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
            >
              <img
                src={currentScreenshot}
                alt="Current screenshot"
                className="w-full h-auto block pointer-events-none"
              />
            </div>

            {/* Slider Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-2xl flex items-center justify-center"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-lg border-2 border-white">
                ↔
              </div>
            </div>

            {/* Slider Range Input */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
            />

            {/* Labels */}
            <div className="absolute top-3 left-3 bg-slate-900/90 text-white text-[10px] font-semibold px-2 py-1 rounded border border-slate-700 pointer-events-none">
              Current Run ({sliderPosition}%)
            </div>
            <div className="absolute top-3 right-3 bg-slate-900/90 text-white text-[10px] font-semibold px-2 py-1 rounded border border-slate-700 pointer-events-none">
              Baseline Target ({100 - sliderPosition}%)
            </div>
          </div>
        )}

        {/* SIDE BY SIDE VIEW */}
        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300 block">Baseline (Expected State)</span>
              <div className="rounded-lg overflow-hidden border border-slate-700 shadow">
                <img src={baselineScreenshot} alt="Baseline" className="w-full h-auto" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-rose-400 block">Current Run (Observed State)</span>
              <div className="rounded-lg overflow-hidden border border-rose-500/50 shadow">
                <img src={currentScreenshot} alt="Current" className="w-full h-auto" />
              </div>
            </div>
          </div>
        )}

        {/* OVERLAY VIEW */}
        {viewMode === 'overlay' && (
          <div className="relative w-full max-w-4xl rounded-lg overflow-hidden border border-slate-800 shadow">
            <img src={baselineScreenshot} alt="Baseline" className="w-full h-auto block" />
            <div className="absolute inset-0 mix-blend-difference opacity-80 pointer-events-none">
              <img src={currentScreenshot} alt="Current" className="w-full h-auto block" />
            </div>
            <div className="absolute bottom-3 left-3 bg-slate-900/95 text-rose-400 text-xs px-3 py-1.5 rounded-lg border border-rose-500/30 font-semibold">
              Difference heatmap (White regions indicate pixels changed from baseline)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
