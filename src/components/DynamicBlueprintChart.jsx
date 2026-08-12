import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { buildBlueprintChartPayload, chartIndexToFrame } from '../utils/blueprintChartData';

export default function DynamicBlueprintChart({
  pipelineSnapshot = null,
  phaseName = '',
  totalFrames = 128,
  activeFrame = 1,
  onScrubFrame,
  onScrubDataPoint,
  chartId = 'default',
}) {
  const chartPayload = useMemo(
    () => buildBlueprintChartPayload(pipelineSnapshot, { phaseName }),
    [pipelineSnapshot, phaseName]
  );

  const {
    data,
    activeJointLabel,
    currentLeftVal,
    currentRightVal,
    rangeMin,
    rangeMax,
    isFallback,
  } = chartPayload;

  const yDomain = useMemo(() => {
    const pad = 8;
    return [Math.floor(rangeMin - pad), Math.ceil(rangeMax + pad)];
  }, [rangeMin, rangeMax]);

  const leftGradientId = `leftGlowGradient-${chartId}`;
  const rightGradientId = `rightGlowGradient-${chartId}`;

  const handleChartClick = (state) => {
    const payload = state?.activePayload?.[0]?.payload;
    if (!payload) return;
    onScrubDataPoint?.(payload);
    onScrubFrame?.(chartIndexToFrame(payload, totalFrames));
  };

  const activeIndex = useMemo(() => {
    if (!data?.length) return 0;
    const ratio = (activeFrame - 1) / Math.max(totalFrames - 1, 1);
    return Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1))));
  }, [activeFrame, totalFrames, data]);

  const displayLeft = data?.[activeIndex]?.left_value ?? currentLeftVal;
  const displayRight = data?.[activeIndex]?.right_value ?? currentRightVal;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm font-sans text-slate-900 print:break-inside-avoid">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-6">
          <span className="text-xs font-black tracking-widest text-slate-400">
            {activeJointLabel} METRIC LAYER
          </span>
          <div className="flex items-center gap-4 text-sm font-bold">
            <span className="text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]">
              L {typeof displayLeft === 'number' ? `${displayLeft.toFixed(1)}°` : displayLeft}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-cyan-500 drop-shadow-[0_0_6px_rgba(6,182,212,0.35)]">
              R {typeof displayRight === 'number' ? `${displayRight.toFixed(1)}°` : displayRight}
            </span>
          </div>
        </div>

        <div className="text-[10px] font-black bg-slate-50 border border-slate-200 text-slate-500 px-2.5 py-1 rounded-lg">
          RANGE: {rangeMin.toFixed(1)}° – {rangeMax.toFixed(1)}°
          {isFallback ? ' · CALIBRATED PREVIEW' : ''}
        </div>
      </div>

      <div className="h-64 w-full relative print:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            onClick={handleChartClick}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#94a3b8' }}
              stroke="#e2e8f0"
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#94a3b8' }}
              stroke="#e2e8f0"
              domain={yDomain}
              tickLine={false}
            />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
            <ReferenceLine
              x={data?.[activeIndex]?.timestamp}
              stroke="#06b6d4"
              strokeDasharray="4 4"
              strokeOpacity={0.65}
            />

            <Area
              type="monotone"
              dataKey="left_value"
              stroke="#10b981"
              strokeWidth={2.5}
              fill={`url(#${leftGradientId})`}
              dot={false}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: '#10b981' }}
            />
            <Area
              type="monotone"
              dataKey="right_value"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fill={`url(#${rightGradientId})`}
              dot={false}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: '#06b6d4' }}
            />

            <defs>
              <linearGradient id={leftGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={rightGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between items-center font-mono text-[9px] text-slate-400 font-bold print:text-[8px]">
        <span>[ RECHARTS RENDERING VECTOR ACTIVE ]</span>
        <span className="text-cyan-500 print:text-cyan-700">
          CLICK CHART TIMELINE TO SCRUB VIDEO
        </span>
      </div>
    </div>
  );
}
