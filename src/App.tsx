// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React, { useEffect } from "react";
import clsx from "clsx";
import { isMyGo, onFileDrop } from "mygo-runtime";
import { SmartARService } from "./mygo";
import { useSmartARStore, type ActiveStep } from "./store";
import {
  formatCurrency,
  formatPercent,
  formatSystemDate,
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
import { RuleSettingsModal } from "./components/RuleSettingsModal";
import { AIAssistantDrawer } from "./components/AIAssistantDrawer";
import { AISettingsModal } from "./components/AISettingsModal";
import { AuditReportModal } from "./components/AuditReportModal";
import { OpenSourceLicensesModal } from "./components/OpenSourceLicensesModal";
import {
  FolderOpen,
  Download,
  Calendar,
  Palette,
  Sun,
  Moon,
  Sparkles,
  AlertTriangle,
  Layers,
  Database,
  ShieldAlert,
  BarChart3,
  FileSpreadsheet,
  CheckCircle2,
  Cpu,
  SlidersHorizontal,
  FileText,
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
    title: "Step 4: 账龄预警看板",
    subtitle: "五级阶梯计提与风险联动",
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
    openRuleModal,
    isAIPanelOpen,
    toggleAIPanel,
    generateAuditReport,
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

  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const [isLicensesOpen, setIsLicensesOpen] = React.useState(false);

  const handleOpenDatePicker = () => {
    if (dateInputRef.current) {
      try {
        if (typeof dateInputRef.current.showPicker === "function") {
          dateInputRef.current.showPicker();
          return;
        }
      } catch {
        // Fallback for environments where showPicker may throw or not exist
      }
      dateInputRef.current.focus();
      dateInputRef.current.click();
    }
  };

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
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "F12" || (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i"))) {
          e.preventDefault();
          void SmartARService.toggleDevTools();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        off();
        window.removeEventListener("keydown", handleKeyDown);
      };
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

  const isStandaloneAI =
    typeof window !== "undefined" &&
    window.location.search.includes("mode=ai-standalone");

  if (isStandaloneAI) {
    return (
      <div
        className={clsx(
          "h-screen w-screen overflow-hidden flex flex-col font-sans",
          darkMode ? "dark bg-zinc-900 text-zinc-100" : "bg-white text-zinc-900"
        )}
      >
        <AIAssistantDrawer isStandalone={true} />
        <AISettingsModal />
        <AuditReportModal />

      {/* Open Source Licenses & Third-Party Notices Modal */}
      <OpenSourceLicensesModal
        isOpen={isLicensesOpen}
        onClose={() => setIsLicensesOpen(false)}
      />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Top Executive Navigation Bar - Shadcn Monochromatic Theme */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-5 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand Title (Removed the circled icon badge and removed '100% 本地内存计算 · 零外网传输') */}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                SmartAR智能应收账款账龄分析与坏账预警系统
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                V2.1.0
              </span>
            </div>
            {systemInfo && (
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                {systemInfo.os}/{systemInfo.arch} · {systemInfo.goVersion}
              </div>
            )}
          </div>

          {/* Global Controls: Base Date + Palette Switch + Import/Export */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Report As-Of Date Selector (Formatted per system locale) */}
            <div
              onClick={handleOpenDatePicker}
              className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer select-none"
              title="点击弹出日历调整报表基准日"
            >
              <Calendar className="w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <span className="text-zinc-500 dark:text-zinc-400 pointer-events-none">
                基准日:
              </span>
              <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100 pointer-events-none">
                {formatSystemDate(asOfDate)}
              </span>
              <input
                ref={dateInputRef}
                type="date"
                value={asOfDate}
                onChange={(e) => {
                  if (e.target.value) {
                    void changeAsOfDate(e.target.value);
                  }
                }}
                onClick={(e) => {
                  try {
                    if (typeof e.currentTarget.showPicker === "function") {
                      e.currentTarget.showPicker();
                    }
                  } catch {
                    // Fallback
                  }
                }}
                className="date-picker-overlay absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                aria-label="选择基准日"
              />
            </div>

            {/* Warning Palette Toggle */}
            <button
              onClick={togglePaletteMode}
              className="px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="切换五级预警阶梯色彩样式"
            >
              <Palette className="w-3.5 h-3.5 text-zinc-400" />
              <span>{paletteMode === "soft" ? "柔和预警色" : "经典预警色"}</span>
              <span className="flex items-center gap-0.5 ml-0.5">
                {RISK_THEME_LIST.map((t) => (
                  <span
                    key={t.key}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        paletteMode === "soft" ? t.color : t.classicColor,
                    }}
                  />
                ))}
              </span>
            </button>

            {/* Rules and Master Data Configuration */}
            <button
              onClick={openRuleModal}
              className="px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="自定义缺失值填充规则、客户主数据字典与坏账预警标准"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              <span>规则配置</span>
            </button>

            {/* AI Financial Copilot Toggle */}
            <button
              onClick={toggleAIPanel}
              className={clsx(
                "px-2.5 py-1.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs",
                isAIPanelOpen
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-white"
                  : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
              )}
              title="打开AI财务治理助手 (CloudWeGo Eino驱动)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI助手</span>
            </button>

            {/* Management Audit Report Trigger */}
            <button
              onClick={() => void generateAuditReport("comprehensive")}
              className="px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="一键多步编排生成管理层应收账款审计分析管报"
            >
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>审计管报</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="切换深色/浅色模式"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-zinc-300" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-700" />
              )}
            </button>

            {/* Import File Button */}
            <button
              onClick={() => void openFileWithDialog()}
              className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
              导入Excel
            </button>

            {/* Primary Export Dynamic Formula Excel Button (Shadcn Black/White) */}
            <button
              disabled={isExporting}
              onClick={() => void exportWorkbook(false)}
              className="px-3.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              导出动态公式Excel
            </button>
          </div>
        </div>

        {/* 5-Step Pipeline Wizard Navigation Bar */}
        <div className="max-w-[1600px] mx-auto mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PIPELINE_STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = activeStep === s.step;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors cursor-pointer ${
                  isActive
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
                    : "border-transparent bg-zinc-50/70 dark:bg-zinc-900/40 text-zinc-500 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{s.title}</div>
                  <div className="text-[10px] text-zinc-400 truncate">
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
          <div className="px-3.5 py-2 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={clearToast}
              className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="max-w-[1600px] w-full mx-auto px-5 pt-3">
          <div className="px-3.5 py-2.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-rose-500/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-5 py-4 space-y-4">
        {isLoading && !pipelineData ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Sparkles className="w-7 h-7 animate-spin text-zinc-500" />
            <p className="text-xs">
              正在执行应收账款结构清洗与账龄测算...
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      未收应收账款余额合计({pipelineData.normalCount}笔正常)
                    </div>
                    <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-1">
                      ¥{formatCurrency(pipelineData.normalBalTotal)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <span>应收总额: ¥{(pipelineData.normalArTotal / 10000).toFixed(2)}万</span>
                      <span>已回款: ¥{(pipelineData.normalRecTotal / 10000).toFixed(2)}万</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>阶梯计提坏账准备总额</span>
                      <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold">
                        综合计提率{formatPercent(pipelineData.overallProvRate, 2)}
                      </span>
                    </div>
                    <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-1">
                      ¥{formatCurrency(pipelineData.normalProvTotal)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <span>五级阶梯: 1%/5%/20%/50%/100%</span>
                      <span>账面净值: ¥{((pipelineData.normalBalTotal - pipelineData.normalProvTotal) / 10000).toFixed(2)}万</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>已逾期单据敞口</span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">
                        笔数占比{formatPercent(pipelineData.overdueCount / Math.max(pipelineData.normalCount, 1))}
                      </span>
                    </div>
                    <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-1">
                      ¥{formatCurrency(pipelineData.overdueBalTotal)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <span>逾期单据: {pipelineData.overdueCount}笔 / {pipelineData.normalCount}笔</span>
                      <span>基准日: {formatSystemDate(pipelineData.asOfDate)}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      数据治理与异常分流统计
                    </div>
                    <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-1">
                      {pipelineData.totalSuspended}笔挂起
                      <span className="text-xs font-normal text-zinc-400 ml-1">
                        / {pipelineData.totalMissingFixed + pipelineData.totalInPlaceFixed}处修复
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <button
                        onClick={() => setActiveStep(3)}
                        className="text-zinc-700 dark:text-zinc-300 hover:underline cursor-pointer"
                      >
                        查看异常详情 →
                      </button>
                      <button
                        onClick={() => setActiveStep(5)}
                        className="text-zinc-700 dark:text-zinc-300 hover:underline cursor-pointer"
                      >
                        预览动态公式 →
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. 5-Tier Warning Matrix Cards (No character names, clean shadcn style) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {pipelineData.tierSummaries.map((tier) => {
                    const theme = getThemeByTierOrLevel(tier.agingTier);
                    const isSelected = tierFilter === tier.agingTier;
                    const accentColor =
                      paletteMode === "soft" ? theme.color : theme.classicColor;

                    return (
                      <div
                        key={tier.agingTier}
                        onClick={() =>
                          setTierFilter(isSelected ? "ALL" : tier.agingTier)
                        }
                        style={{
                          borderTopWidth: "3px",
                          borderTopColor: accentColor,
                        }}
                        className={`rounded-lg border p-3.5 cursor-pointer transition-colors ${
                          isSelected
                            ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100/70 dark:bg-zinc-900"
                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: accentColor }}
                            />
                            {tier.riskLevel}
                          </span>
                          <span className="font-mono text-xs text-zinc-500">
                            计提{(tier.provisionRate * 100).toFixed(0)}%
                          </span>
                        </div>

                        <div className="mt-2 flex items-baseline justify-between">
                          <div>
                            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              {tier.agingTier} ({tier.rangeText})
                            </div>
                            <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-0.5">
                              ¥{formatCurrency(tier.balanceSum)}
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              {tier.count}笔
                            </span>
                            <div className="text-[10px] text-zinc-400">
                              占比{formatPercent(tier.balanceRatio)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400 truncate max-w-[130px]">
                            {tier.suggestedAction}
                          </span>
                          <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300 shrink-0">
                            坏账: ¥{(tier.provisionSum / 10000).toFixed(2)}万
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 3. Interactive Visual Charts */}
                <ChartsPanel
                  data={pipelineData}
                  paletteMode={paletteMode}
                  activeTier={tierFilter}
                  onSelectTier={setTierFilter}
                  activeRegion={regionFilter}
                  onSelectRegion={setRegionFilter}
                />

                {/* 4. TanStack Interactive Data Table */}
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

      {/* Footer - Clean Monochromatic Centered */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-5 py-2.5 text-[11px] text-zinc-500">
        <div className="max-w-[1600px] mx-auto flex items-center justify-center text-center gap-1.5">
          <span>
            SmartAR Desktop · 基于桌面运行时+React 19+shadcn/ui+Excelize v2构建 ·
          </span>
          <button
            onClick={() => setIsLicensesOpen(true)}
            className="underline hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            遵循MPL-2.0开源协议与第三方声明
          </button>
        </div>
      </footer>

      {/* Business Rules & Master Data Configuration Modal */}
      <RuleSettingsModal />

      {/* AI Financial Copilot Drawer (Eino ReAct Agent) */}
      <AIAssistantDrawer />

      {/* AI Model & Endpoint Settings Modal */}
      <AISettingsModal />

      {/* Full Audit Management Report Viewer Modal (Eino Graph) */}
      <AuditReportModal />

      {/* Open Source Licenses & Third-Party Notices Modal */}
      <OpenSourceLicensesModal
        isOpen={isLicensesOpen}
        onClose={() => setIsLicensesOpen(false)}
      />
    </div>
  );
};
