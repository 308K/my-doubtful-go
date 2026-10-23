// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React from "react";
import type { PipelineResult } from "../mygo";
import {
  formatCurrency,
  formatPercent,
  getThemeByTierOrLevel,
  type PaletteMode,
} from "../theme";
import { PieChart, BarChart3, Compass } from "lucide-react";

interface ChartsPanelProps {
  data: PipelineResult;
  paletteMode: PaletteMode;
  activeTier: string;
  onSelectTier: (tier: string) => void;
  activeRegion: string;
  onSelectRegion: (region: string) => void;
}

export const ChartsPanel: React.FC<ChartsPanelProps> = ({
  data,
  paletteMode,
  activeTier,
  onSelectTier,
  activeRegion,
  onSelectRegion,
}) => {
  const tiers = data.tierSummaries;
  const regions = data.regionSummaries;

  // Max balance for pyramid scaling
  const maxTierBal = Math.max(...tiers.map((t) => t.balanceSum), 1);

  // Donut SVG geometry
  const radiusOuter = 74;
  const circumferenceOuter = 2 * Math.PI * radiusOuter;
  const radiusInner = 50;
  const circumferenceInner = 2 * Math.PI * radiusInner;

  let accBalRatio = 0;
  let accProvRatio = 0;
  const totalProv = Math.max(data.normalProvTotal, 1);

  // Radar polygon helper for top 6-7 regions
  const radarSize = 210;
  const radarCenter = radarSize / 2;
  const radarRadius = 74;
  const maxRegBal = Math.max(...regions.map((r) => r.balanceTotal), 1);

  const radarPoints = regions.map((reg, i) => {
    const angle = (Math.PI * 2 * i) / Math.max(regions.length, 1) - Math.PI / 2;
    const balNorm = Math.max(0.18, reg.balanceTotal / maxRegBal);
    const colNorm = Math.max(0.18, reg.collectionRate);
    return {
      region: reg.region,
      angle,
      labelX: radarCenter + (radarRadius + 22) * Math.cos(angle),
      labelY: radarCenter + (radarRadius + 22) * Math.sin(angle),
      balX: radarCenter + radarRadius * balNorm * Math.cos(angle),
      balY: radarCenter + radarRadius * balNorm * Math.sin(angle),
      colX: radarCenter + radarRadius * colNorm * Math.cos(angle),
      colY: radarCenter + radarRadius * colNorm * Math.sin(angle),
      axisX: radarCenter + radarRadius * Math.cos(angle),
      axisY: radarCenter + radarRadius * Math.sin(angle),
      raw: reg,
    };
  });

  const balPolygon = radarPoints.map((p) => `${p.balX.toFixed(1)},${p.balY.toFixed(1)}`).join(" ");
  const colPolygon = radarPoints.map((p) => `${p.colX.toFixed(1)},${p.colY.toFixed(1)}`).join(" ");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. 账龄结构与坏账准备金字塔图 */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              账龄分档与坏账计提金字塔
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            点击条目联动筛选明细
          </span>
        </div>

        <div className="space-y-2.5 my-auto">
          {tiers.map((tier) => {
            const theme = getThemeByTierOrLevel(tier.agingTier);
            const barColor = paletteMode === "mygo" ? theme.color : theme.classicColor;
            const balWidthPct = Math.max(4, (tier.balanceSum / maxTierBal) * 100);
            const provWidthPct = Math.max(2, (tier.provisionSum / maxTierBal) * 100);
            const isSelected = activeTier === tier.agingTier;

            return (
              <div
                key={tier.agingTier}
                onClick={() =>
                  onSelectTier(isSelected ? "ALL" : tier.agingTier)
                }
                className={`group cursor-pointer rounded-lg p-2 transition-all border ${
                  isSelected
                    ? "border-sky-500 bg-sky-500/5 dark:bg-sky-500/10"
                    : "border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: barColor }}
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {tier.agingTier}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      ({paletteMode === "mygo" ? `${theme.character} · ${theme.name}` : theme.classicName})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-600 dark:text-slate-300">
                      {tier.count}笔
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      ¥{(tier.balanceSum / 10000).toFixed(1)}万
                    </span>
                  </div>
                </div>

                {/* Dual progress pyramid bars */}
                <div className="space-y-1">
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${balWidthPct}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>计提比例 {(tier.provisionRate * 100).toFixed(0)}%</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400">
                      坏账准备: ¥{formatCurrency(tier.provisionSum)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full opacity-75 transition-all duration-500"
                      style={{
                        width: `${provWidthPct}%`,
                        backgroundColor: "#f43f5e",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 坏账占比与未收金额双环图 */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-pink-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              未收余额(外环) vs 坏账准备(内环)结构
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            综合计提率 {formatPercent(data.overallProvRate, 2)}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-around gap-3 my-auto py-1">
          <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
            <svg className="w-44 h-44 -rotate-90" viewBox="0 0 180 180">
              {/* Outer ring: Uncollected Balance Ratio */}
              {tiers.map((tier) => {
                const theme = getThemeByTierOrLevel(tier.agingTier);
                const strokeColor =
                  paletteMode === "mygo" ? theme.color : theme.classicColor;
                const dash = tier.balanceRatio * circumferenceOuter;
                const offset = -accBalRatio * circumferenceOuter;
                accBalRatio += tier.balanceRatio;
                return (
                  <circle
                    key={`outer-${tier.agingTier}`}
                    cx="90"
                    cy="90"
                    r={radiusOuter}
                    fill="transparent"
                    stroke={strokeColor}
                    strokeWidth="15"
                    strokeDasharray={`${dash} ${circumferenceOuter}`}
                    strokeDashoffset={offset}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() =>
                      onSelectTier(
                        activeTier === tier.agingTier ? "ALL" : tier.agingTier
                      )
                    }
                  >
                    <title>{`${tier.agingTier} 未收余额: ¥${formatCurrency(tier.balanceSum)} (${formatPercent(tier.balanceRatio)})`}</title>
                  </circle>
                );
              })}

              {/* Inner ring: Bad Debt Provision Share */}
              {tiers.map((tier) => {
                const theme = getThemeByTierOrLevel(tier.agingTier);
                const strokeColor =
                  paletteMode === "mygo" ? theme.color : theme.classicColor;
                const provRatio = tier.provisionSum / totalProv;
                const dash = provRatio * circumferenceInner;
                const offset = -accProvRatio * circumferenceInner;
                accProvRatio += provRatio;
                return (
                  <circle
                    key={`inner-${tier.agingTier}`}
                    cx="90"
                    cy="90"
                    r={radiusInner}
                    fill="transparent"
                    stroke={strokeColor}
                    strokeWidth="12"
                    strokeOpacity="0.85"
                    strokeDasharray={`${dash} ${circumferenceInner}`}
                    strokeDashoffset={offset}
                    className="cursor-pointer transition-opacity hover:opacity-100"
                    onClick={() =>
                      onSelectTier(
                        activeTier === tier.agingTier ? "ALL" : tier.agingTier
                      )
                    }
                  >
                    <title>{`${tier.agingTier} 坏账准备: ¥${formatCurrency(tier.provisionSum)} (${formatPercent(provRatio)})`}</title>
                  </circle>
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                坏账准备总额
              </span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                ¥{(data.normalProvTotal / 10000).toFixed(2)}万
              </span>
              <span className="text-[10px] text-rose-500 font-medium">
                {data.normalCount} 笔正常入表
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 w-full text-xs">
            {tiers.map((tier) => {
              const theme = getThemeByTierOrLevel(tier.agingTier);
              const dotColor =
                paletteMode === "mygo" ? theme.color : theme.classicColor;
              const provShare = tier.provisionSum / totalProv;
              return (
                <div
                  key={tier.agingTier}
                  onClick={() =>
                    onSelectTier(
                      activeTier === tier.agingTier ? "ALL" : tier.agingTier
                    )
                  }
                  className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {paletteMode === "mygo" ? theme.character : tier.agingTier}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span
                      className="text-slate-500 dark:text-slate-400"
                      title="占未收余额比"
                    >
                      余额{formatPercent(tier.balanceRatio)}
                    </span>
                    <span
                      className="font-semibold text-slate-800 dark:text-slate-200"
                      title="占坏账准备总额比"
                    >
                      坏账{formatPercent(provShare)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>外环：各档未收余额占比</span>
          <span>内环：各档计提坏账贡献度</span>
        </div>
      </div>

      {/* 3. 区域敞口雷达与回款率矩阵 */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              七大区域风险敞口与回款雷达图
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            点击区域筛选
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 my-auto">
          <svg
            className="w-48 h-48 shrink-0"
            viewBox={`0 0 ${radarSize} ${radarSize}`}
          >
            {/* Concentric radar webs */}
            {[0.25, 0.5, 0.75, 1.0].map((scale) => (
              <circle
                key={scale}
                cx={radarCenter}
                cy={radarCenter}
                r={radarRadius * scale}
                fill="none"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray="2 2"
              />
            ))}
            {/* Axes */}
            {radarPoints.map((p) => (
              <line
                key={`axis-${p.region}`}
                x1={radarCenter}
                y1={radarCenter}
                x2={p.axisX}
                y2={p.axisY}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
              />
            ))}
            {/* Balance polygon */}
            <polygon
              points={balPolygon}
              fill="rgba(119, 187, 221, 0.28)"
              stroke="#77BBDD"
              strokeWidth="2"
            />
            {/* Collection rate polygon */}
            <polygon
              points={colPolygon}
              fill="rgba(119, 221, 119, 0.22)"
              stroke="#77DD77"
              strokeWidth="1.8"
            />
            {/* Labels & interactive vertices */}
            {radarPoints.map((p) => {
              const isSelected = activeRegion === p.region;
              return (
                <g
                  key={`node-${p.region}`}
                  className="cursor-pointer"
                  onClick={() =>
                    onSelectRegion(isSelected ? "ALL" : p.region)
                  }
                >
                  <circle
                    cx={p.balX}
                    cy={p.balY}
                    r={isSelected ? 5 : 3.5}
                    fill={isSelected ? "#FF8899" : "#77BBDD"}
                  />
                  <text
                    x={p.labelX}
                    y={p.labelY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={`text-[10px] font-medium fill-current ${
                      isSelected
                        ? "text-sky-500 font-bold"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {p.region}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="flex flex-col gap-1 w-full text-xs max-h-44 overflow-y-auto pr-1">
            {regions.map((r) => {
              const isSelected = activeRegion === r.region;
              return (
                <div
                  key={r.region}
                  onClick={() =>
                    onSelectRegion(isSelected ? "ALL" : r.region)
                  }
                  className={`flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 font-semibold"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span>
                    {r.region}{" "}
                    <span className="text-[10px] text-slate-400">
                      ({r.recordCount}笔)
                    </span>
                  </span>
                  <div className="text-right font-mono text-[11px]">
                    <div>¥{(r.balanceTotal / 10000).toFixed(1)}万</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      回款率 {formatPercent(r.collectionRate, 0)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#77BBDD]" />
            高松灯蓝：未收余额规模
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#77DD77]" />
            要乐奈绿：区域回款率
          </span>
        </div>
      </div>
    </div>
  );
};
