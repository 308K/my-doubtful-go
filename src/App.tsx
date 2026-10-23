// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React, { useEffect } from "react";
import { isMyGo, onFileDrop } from "mygo-runtime";
import { useSmartARStore, type ActiveStep } from "./store";
import {
  formatCurrency,
  formatPercent,
  getThemeByTierOrLevel,
  RISK_THEME_LIST,
} from "./theme";
import { ChartsPanel } from "./components/ChartsPanel";
import { ARDataTable } from "./components/ARDataTable";
import {
  Step1UploadCleanView,
  Step2MasterAndMissingView,
  Step3AnomalyTriageView,
  Step5FormulaExportView,
} from "./components/PipelineStepsView";
import {
  FolderOpen,
  Download,
  Calendar,
  Palette,
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Layers,
  Database,
  ShieldAlert,
  BarChart3,
  FileSpreadsheet,
  CheckCircle2,
  Cpu,
} from "lucide-react";

const PIPELINE_STEPS: {
  step: ActiveStep;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    step: 1,
    title: "Step 1: 结构清洗",
    subtitle: "表头探测/空行小计剔除/去重",
    icon: Layers,
  },
  {
    step: 2,
    title: "Step 2: 主数据与修补",
    subtitle: "20家标准客户/8类缺失推导",
    icon: Database,
  },
  {
    step: 3,
    title: "Step 3: 异常审计分流",
    subtitle: "6类原地修正/13笔挂起隔离",
    icon: ShieldAlert,
  },
  {
    step: 4,
    title: "Step 4: MyGO 账龄预警看板",
    subtitle: "五级阶梯计提/角色色卡联动",
    icon: BarChart3,
  },
  {
    step: 5,
    title: "Step 5: 动态公式导出",
    subtitle: "5张工作表/2432个原生公式",
    icon: FileSpreadsheet,
  },
];

export const App: React.FC = () => {
  const {
    activeStep,
    pipelineData,
    systemInfo,
    isLoading,
    isExporting,
    error,
    toastMessage,
    asOfDate,
    paletteMode,
    darkMode,
    searchQuery,
    tierFilter,
    regionFilter,
    datasetScope,
    lastExport,
    setActiveStep,
    setPaletteMode,
    togglePaletteMode,
    toggleDarkMode,
    setSearchQuery,
    setTierFilter,
    setRegionFilter,
    setDatasetScope,
    clearToast,
    initApp,
    loadSampleData,
    openFileWithDialog,
    loadFromFilePath,
    loadFromBrowserFile,
    changeAsOfDate,
    exportWorkbook,
    revealExportedFile,
  } = useSmartARStore();

  useEffect(() => {
    void initApp();
    if (isMyGo()) {
      const off = onFileDrop(({ paths }) => {
        const xlsxPath = paths.find(
          (p) =>
            p.toLowerCase().endsWith(".xlsx") ||
            p.toLowerCase().endsWith(".xlsm")
        );
        if (xlsxPath) {
          void loadFromFilePath(xlsxPath);
        }
      });
      return () => off();
    }
  }, [initApp, loadFromFilePath]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => clearToast(), 4500);
    return () => clearTimeout(timer);
  }, [toastMessage, clearToast]);

  const activeRecords =
    datasetScope === "normal"
      ? pipelineData?.normalRecords ?? []
      : datasetScope === "suspended"
      ? pipelineData?.suspendedRecords ?? []
      : pipelineData?.allRecords ?? [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Executive Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-[#0d1322]/90 backdrop-blur-md px-5 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand Title & MyGO!!!!! 5-Color Ribbon */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#77BBDD] via-[#7777AA] to-[#FF8899] p-0.5 shadow-sm">
              <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center font-black text-xs tracking-tighter text-white">
                AR!
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  SmartAR 智能应收账款账龄分析与坏账预警系统
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gradient-to-r from-[#77BBDD]/20 via-[#FFDD88]/20 to-[#FF8899]/20 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                  V1.1.0 · MyGO!!!!! 视觉扩展版
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  100% 本地内存计算 · 零外网传输
                </span>
                {systemInfo && (
                  <span className="hidden sm:flex items-center gap-1 font-mono">
                    <Cpu className="w-3 h-3 text-sky-500" />
                    {systemInfo.os}/{systemInfo.arch} · {systemInfo.goVersion}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Global Controls: Base Date + Theme Switch + Import/Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Report As-Of Date Selector */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
              <Calendar className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-slate-500 dark:text-slate-400">
                报表基准日:
              </span>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => {
                  if (e.target.value) {
                    void changeAsOfDate(e.target.value);
                  }
                }}
                className="font-mono font-semibold text-slate-900 dark:text-white bg-transparent focus:outline-none cursor-pointer"
              />
            </div>

            {/* MyGO!!!!! vs Classic Theme Toggle */}
            <button
              onClick={togglePaletteMode}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                paletteMode === "mygo"
                  ? "border-[#FF8899]/50 bg-[#FF8899]/10 text-[#BE123C] dark:text-[#fda4af]"
                  : "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              }`}
              title="一键切换 MyGO!!!!! 乐队五人代表色 / 标准财务预警色卡"
            >
              <Palette className="w-3.5 h-3.5" />
              {paletteMode === "mygo"
                ? "MyGO!!!!! 五人代表色"
                : "标准财务色卡"}
              <span className="flex items-center gap-0.5 ml-1">
                {RISK_THEME_LIST.map((t) => (
                  <span
                    key={t.key}
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        paletteMode === "mygo" ? t.color : t.classicColor,
                    }}
                  />
                ))}
              </span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="切换深色/浅色金融高定外观"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Import File Button */}
            <button
              onClick={() => void openFileWithDialog()}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-sky-500" />
              导入本地 Excel
            </button>

            {/* Primary Export Dynamic Formula Excel Button */}
            <button
              disabled={isExporting}
              onClick={() => void exportWorkbook(false)}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              导出动态公式 Excel
            </button>
          </div>
        </div>

        {/* 5-Step Pipeline Wizard Navigation Bar */}
        <div className="max-w-[1600px] mx-auto mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PIPELINE_STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = activeStep === s.step;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive
                    ? "border-sky-500/60 bg-sky-500/10 dark:bg-sky-500/15 text-sky-600 dark:text-sky-300 shadow-2xs"
                    : "border-transparent bg-slate-100/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive
                      ? "bg-sky-500 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{s.title}</div>
                  <div className="text-[10px] opacity-75 truncate">
                    {s.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="max-w-[1600px] w-full mx-auto px-5 pt-3">
          <div className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={clearToast}
              className="text-[11px] opacity-70 hover:opacity-100"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="max-w-[1600px] w-full mx-auto px-5 pt-3">
          <div className="px-4 py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-5 py-4 space-y-5">
        {isLoading && !pipelineData ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Sparkles className="w-8 h-8 animate-spin text-sky-500" />
            <p className="text-sm">
              正在通过 Go 内核高速执行 5 步应收账款结构清洗与账龄测算...
            </p>
          </div>
        ) : pipelineData ? (
          <>
            {activeStep === 1 && (
              <Step1UploadCleanView
                data={pipelineData}
                onOpenDialog={() => void openFileWithDialog()}
                onLoadSample={() => void loadSampleData()}
                onUploadFile={(file) => void loadFromBrowserFile(file)}
                onNextStep={() => setActiveStep(2)}
              />
            )}

            {activeStep === 2 && (
              <Step2MasterAndMissingView
                data={pipelineData}
                onNextStep={() => setActiveStep(3)}
              />
            )}

            {activeStep === 3 && (
              <Step3AnomalyTriageView
                data={pipelineData}
                onNextStep={() => setActiveStep(4)}
              />
            )}

            {activeStep === 5 && (
              <Step5FormulaExportView
                data={pipelineData}
                paletteMode={paletteMode}
                onSetPaletteMode={setPaletteMode}
                onExportDialog={() => void exportWorkbook(false)}
                onQuickExport={() => void exportWorkbook(true)}
                isExporting={isExporting}
                lastExport={lastExport}
                onRevealFile={(p) => void revealExportedFile(p)}
              />
            )}

            {activeStep === 4 && (
              <div className="space-y-4">
                {/* 1. Top 4 Executive Financial KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>未收应收账款余额合计 (107笔正常)</span>
                      <TrendingUp className="w-4 h-4 text-sky-500" />
                    </div>
                    <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-1.5">
                      ¥{formatCurrency(pipelineData.normalBalTotal)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>应收总额: ¥{(pipelineData.normalArTotal / 10000).toFixed(2)}万</span>
                      <span className="text-emerald-500">
                        已回款: ¥{(pipelineData.normalRecTotal / 10000).toFixed(2)}万
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-rose-500/30 bg-white dark:bg-slate-900/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>阶梯计提坏账准备总额</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold">
                        综合计提率 {formatPercent(pipelineData.overallProvRate, 2)}
                      </span>
                    </div>
                    <div className="text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400 mt-1.5">
                      ¥{formatCurrency(pipelineData.normalProvTotal)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>五级阶梯: 1% / 5% / 20% / 50% / 100%</span>
                      <span>账面净值: ¥{((pipelineData.normalBalTotal - pipelineData.normalProvTotal) / 10000).toFixed(2)}万</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>已逾期单据敞口监控</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold">
                        逾期笔数占比 {formatPercent(pipelineData.overdueCount / Math.max(pipelineData.normalCount, 1))}
                      </span>
                    </div>
                    <div className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-1.5">
                      ¥{formatCurrency(pipelineData.overdueBalTotal)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>逾期单据: {pipelineData.overdueCount} 笔 / {pipelineData.normalCount} 笔</span>
                      <span>基准日: {pipelineData.asOfDate}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>数据治理与异常分流审计</span>
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 mt-1.5">
                      {pipelineData.totalSuspended} 笔挂起{" "}
                      <span className="text-sm font-normal text-slate-400">
                        / {pipelineData.totalMissingFixed + pipelineData.totalInPlaceFixed} 处修复
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setActiveStep(3)}
                        className="text-sky-500 hover:underline cursor-pointer"
                      >
                        查看 9 类异常详情 →
                      </button>
                      <button
                        onClick={() => setActiveStep(5)}
                        className="text-emerald-500 hover:underline cursor-pointer"
                      >
                        预览 2,432 个动态公式 →
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. MyGO!!!!! 5-Character Warning Matrix Cards (PRD Section 3.1 & 3.2) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {pipelineData.tierSummaries.map((tier) => {
                    const theme = getThemeByTierOrLevel(tier.agingTier);
                    const isSelected = tierFilter === tier.agingTier;
                    const accentColor =
                      paletteMode === "mygo" ? theme.color : theme.classicColor;

                    return (
                      <div
                        key={tier.agingTier}
                        onClick={() =>
                          setTierFilter(isSelected ? "ALL" : tier.agingTier)
                        }
                        style={{
                          borderTopWidth: "4px",
                          borderTopColor: accentColor,
                        }}
                        className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                          isSelected
                            ? "border-sky-500 bg-sky-500/10 shadow-sm scale-[1.01]"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/85 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs border ${
                              paletteMode === "mygo"
                                ? theme.badgeClass
                                : theme.classicBadgeClass
                            }`}
                          >
                            {paletteMode === "mygo"
                              ? `${theme.character} · ${theme.name}`
                              : theme.classicName}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                            计提 {(tier.provisionRate * 100).toFixed(0)}%
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-baseline justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {tier.agingTier}{" "}
                              <span className="text-[11px] font-normal text-slate-400">
                                ({tier.rangeText})
                              </span>
                            </div>
                            <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                              ¥{formatCurrency(tier.balanceSum)}
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {tier.count}笔
                            </span>
                            <div className="text-[10px] text-slate-400">
                              占比 {formatPercent(tier.balanceRatio)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 truncate max-w-[130px]" title={theme.metaphor}>
                            {paletteMode === "mygo" ? theme.metaphor : tier.suggestedAction}
                          </span>
                          <span className="font-mono font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                            坏账: ¥{(tier.provisionSum / 10000).toFixed(2)}万
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 3. Interactive Visual Charts (Pyramid, Dual-Ring Donut, Regional Radar) */}
                <ChartsPanel
                  data={pipelineData}
                  paletteMode={paletteMode}
                  activeTier={tierFilter}
                  onSelectTier={setTierFilter}
                  activeRegion={regionFilter}
                  onSelectRegion={setRegionFilter}
                />

                {/* 4. TanStack Interactive Data Table with Single-Record Formula Penetration */}
                <ARDataTable
                  records={activeRecords}
                  paletteMode={paletteMode}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  tierFilter={tierFilter}
                  onTierFilterChange={setTierFilter}
                  regionFilter={regionFilter}
                  onRegionFilterChange={setRegionFilter}
                  datasetScope={datasetScope}
                  onScopeChange={setDatasetScope}
                  counts={{
                    normal: pipelineData.normalCount,
                    suspended: pipelineData.totalSuspended,
                    all: pipelineData.allRecords.length,
                  }}
                />
              </div>
            )}
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b101d] px-5 py-2.5 text-[11px] text-slate-400">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            SmartAR Desktop (my-doubtful-go) · 基于 MyGo + React 19 + Shadcn UI + Excelize v2 构建 · 遵循 MPL 2.0 开源协议
          </span>
          <span className="font-mono">
            MyGO!!!!! 五人预警色系：要乐奈(#77DD77) / 高松灯(#77BBDD) / 长崎素世(#FFDD88) / 椎名立希(#7777AA) / 千早爱音(#FF8899)
          </span>
        </div>
      </footer>
    </div>
  );
};
