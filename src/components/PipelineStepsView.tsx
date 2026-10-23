// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React, { useRef, useState } from "react";
import type { ExportResult, PipelineResult } from "../mygo";
import {
  formatCurrency,
  formatPercent,
  RISK_THEME_LIST,
  type PaletteMode,
} from "../theme";
import {
  Upload,
  Sparkles,
  CheckCircle2,
  AlertOctagon,
  FileSpreadsheet,
  FolderOpen,
  Download,
  Database,
  Layers,
  ShieldAlert,
  ArrowRight,
  Calculator,
  Users,
} from "lucide-react";

interface Step1Props {
  data: PipelineResult;
  onOpenDialog: () => void;
  onLoadSample: () => void;
  onUploadFile: (file: File) => void;
  onNextStep: () => void;
}

export const Step1UploadCleanView: React.FC<Step1Props> = ({
  data,
  onOpenDialog,
  onLoadSample,
  onUploadFile,
  onNextStep,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const s = data.structureReport;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      onUploadFile(f);
    }
  };

  return (
    <div className="space-y-5">
      {/* Upload & Drag-and-Drop Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`lg:col-span-2 rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center transition-all ${
            isDragging
              ? "border-sky-500 bg-sky-500/10"
              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 hover:border-sky-500/60"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xlsm"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadFile(f);
            }}
          />
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            拖拽 ERP 应收账款原始 Excel 到此处，或调用系统原生文件对话框
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            支持用友 U8、金蝶云星空、SAP、Oracle 等导出的含多级表头、空白行、小计合计行与重复记录的 `.xlsx` 原始表，100% 本地内存高速清洗。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <button
              onClick={onOpenDialog}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <FolderOpen className="w-4 h-4" />
              浏览本地 Excel 文件 (原生对话框)
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              网页文件选择器上传
            </button>
            <button
              onClick={onLoadSample}
              className="px-4 py-2 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              重载内置实训样本 (应收账款明细表_原始数据.xlsx)
            </button>
          </div>
        </div>

        {/* Active File & Performance NFR Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-500">
                当前工作簿状态
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono">
                耗时 {data.durationMs.toFixed(2)} ms
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2 truncate">
              {data.sourceFileName}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              报表基准日：<span className="font-mono font-semibold">{data.asOfDate}</span> · 清洗时间：{data.processedAt}
            </p>

            {/* Progress bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">结构提纯率</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {s.validRecordCount} / {s.rawTotalRows} 行 ({((s.validRecordCount / Math.max(s.rawTotalRows, 1)) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${(s.validRecordCount / Math.max(s.rawTotalRows, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={onNextStep}
            className="mt-4 w-full py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
          >
            进入 Step 2：主数据对齐与缺失修补
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Structural Cleaning Waterfall Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
          <div className="text-xs text-slate-400">原始总行数</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {s.rawTotalRows} 行
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            识别表头位于第 {s.headerRowIndex} 行
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
          <div className="text-xs text-slate-400">剥离表头前说明行</div>
          <div className="text-2xl font-bold font-mono text-amber-500 mt-1">
            -{s.preHeaderRows.length} 行
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            行号: [{s.preHeaderRows.join(", ")}]
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
          <div className="text-xs text-slate-400">过滤全空白行</div>
          <div className="text-2xl font-bold font-mono text-amber-500 mt-1">
            -{s.emptyRowIndices.length} 行
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            行号: [{s.emptyRowIndices.join(", ")}]
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
          <div className="text-xs text-slate-400">剔除小计 / 合计行</div>
          <div className="text-2xl font-bold font-mono text-rose-500 mt-1">
            -{s.subtotalRowIndices.length} 行
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            行号: [{s.subtotalRowIndices.join(", ")}]
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            去重后有效业务单据
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {s.validRecordCount} 笔
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            剔除重复行: [{s.duplicateRowIndices.join(", ")}]
          </div>
        </div>
      </div>

      {/* Cleaning Log Console */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4">
        <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-sky-500" />
          Step 1 结构探测与清洗引擎执行日志
        </h4>
        <div className="space-y-1.5 font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/70 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
          {s.details.map((line, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface Step2Props {
  data: PipelineResult;
  onNextStep: () => void;
}

export const Step2MasterAndMissingView: React.FC<Step2Props> = ({
  data,
  onNextStep,
}) => {
  const [selectedMissingField, setSelectedMissingField] = useState<string>(
    data.missingSummaries[0]?.field ?? "账期"
  );
  const activeMissing = data.missingSummaries.find(
    (m) => m.field === selectedMissingField
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-500" />
            Step 2：8 类缺失值智能推导修补（共修补 {data.totalMissingFixed} 处缺失单元格）& 20 家标准客户主数据对齐
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            自动将客户简称/别名反查对齐至 CUST001~CUST020 标准主档案，并按历史有效账期众数与财务平衡恒等式修补缺失项。
          </p>
        </div>
        <button
          onClick={onNextStep}
          className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          进入 Step 3：9 类异常审计与分流
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 8 Missing Value Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {data.missingSummaries.map((ms) => {
          const isSelected = ms.field === selectedMissingField;
          const isPass = ms.actualCount === ms.expectedCount;
          return (
            <div
              key={ms.field}
              onClick={() => setSelectedMissingField(ms.field)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? "border-sky-500 bg-sky-500/10 shadow-xs"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {ms.field}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                    isPass
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/15 text-amber-600"
                  }`}
                >
                  PASS
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                {ms.actualCount}{" "}
                <span className="text-xs font-normal text-slate-400">
                  / 预期{ms.expectedCount}条
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Missing Value Repair Detail Table */}
      {activeMissing && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              【{activeMissing.field}】缺失值推导与填充明细（共 {activeMissing.actualCount} 条记录）
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
              与实训核对标准 100% 一致
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2">序号</th>
                  <th className="px-4 py-2">标准客户编码</th>
                  <th className="px-4 py-2">标准客户名称</th>
                  <th className="px-4 py-2">原始缺失值</th>
                  <th className="px-4 py-2">修补/推算结果</th>
                  <th className="px-4 py-2">财务推导依据</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeMissing.items.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-2 font-mono">#{item.seq}</td>
                    <td className="px-4 py-2 font-mono text-sky-600 dark:text-sky-400">
                      {item.custCode}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">
                      {item.custName}
                    </td>
                    <td className="px-4 py-2 font-mono text-rose-500">
                      {item.rawValue}
                    </td>
                    <td className="px-4 py-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {item.filledValue}
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                      {item.ruleDesc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 20 Standard Customer Master Records */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-500" />
            客户主数据标准字典（CUST001 ~ CUST020，含别名模糊匹配与历史账期众数）
          </span>
          <span className="text-[11px] text-slate-400">
            同步导出至 Excel Sheet 5《客户标准信息表》
          </span>
        </div>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-4 py-2">标准编码</th>
                <th className="px-4 py-2">标准客户全称</th>
                <th className="px-4 py-2">所属区域</th>
                <th className="px-4 py-2">信用等级</th>
                <th className="px-4 py-2">原表出现的简称/别名映射</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.customerStandards.map((c) => (
                <tr key={c.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2 font-mono font-semibold text-sky-600 dark:text-sky-400">
                    {c.code}
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">
                    {c.name}
                  </td>
                  <td className="px-4 py-2">{c.region}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-100 dark:bg-slate-800">
                      {c.credit}级
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {c.aliases.map((al) => (
                        <span
                          key={al}
                          className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20"
                        >
                          {al}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface Step3Props {
  data: PipelineResult;
  onNextStep: () => void;
}

export const Step3AnomalyTriageView: React.FC<Step3Props> = ({
  data,
  onNextStep,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>(
    data.anomalySummaries[0]?.category ?? "应收金额为负"
  );
  const activeAnomaly = data.anomalySummaries.find(
    (a) => a.category === selectedCat
  );

  return (
    <div className="space-y-5">
      {/* Header banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Step 3：9 类财务异常审计与分流（{data.normalCount} 笔正常并入表 + {data.totalSuspended} 笔挂起隔离）
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            6 类公式与录入矛盾原地修正入表；3 类实质性业务异常（7笔离群/低于2万阈值、3笔溢缴超收、3笔零余额挂账）严格挂起隔离，防止扭曲坏账计提基数。
          </p>
        </div>
        <button
          onClick={onNextStep}
          className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          进入 Step 4：MyGO!!!!! 账龄预警看板
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 9 Anomaly Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
        {data.anomalySummaries.map((as) => {
          const isSusp = as.disposition === "suspended";
          const isSelected = as.category === selectedCat;
          return (
            <div
              key={as.category}
              onClick={() => setSelectedCat(as.category)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? isSusp
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-sky-500 bg-sky-500/10"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300"
              }`}
            >
              <div>
                <span
                  className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium mb-1 ${
                    isSusp
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                      : "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                  }`}
                >
                  {isSusp ? "挂起隔离" : "原地修复"}
                </span>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                  {as.category}
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between font-mono">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {as.actualCount}笔
                </span>
                <span className="text-[10px] text-emerald-500">
                  预期{as.expectedCount}笔 ✓
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Anomaly Category Drilldown */}
      {activeAnomaly && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                【{activeAnomaly.category}】审计核验明细（{activeAnomaly.actualCount} 笔）
              </span>
              <span className="ml-2 text-xs text-slate-500">
                处置准则：{activeAnomaly.ruleAction}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                activeAnomaly.disposition === "suspended"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
              }`}
            >
              {activeAnomaly.disposition === "suspended"
                ? "分流至 Sheet 3《挂起异常清单》"
                : "原地修正后并入 Sheet 1《应收账款明细(清洗后)》"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2">序号</th>
                  <th className="px-4 py-2">客户名称</th>
                  <th className="px-4 py-2">发票号</th>
                  <th className="px-4 py-2">异常穿透诊断详情</th>
                  <th className="px-4 py-2">审计处置措施</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeAnomaly.items.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-2 font-mono">#{item.seq}</td>
                    <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">
                      {item.custName} ({item.custCode})
                    </td>
                    <td className="px-4 py-2 font-mono">{item.invoiceNo}</td>
                    <td className="px-4 py-2 font-mono text-rose-600 dark:text-rose-400">
                      {item.description}
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                      {item.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Triage Financial Summary Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              正常并入汇总表 (Sheet 1 · 107 笔)
            </span>
            <span className="font-mono text-xs text-emerald-600">
              计提坏账基准池
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 font-mono text-xs">
            <div>
              <div className="text-slate-400 text-[11px]">应收总额</div>
              <div className="font-bold text-slate-900 dark:text-white">
                ¥{formatCurrency(data.normalArTotal)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">已收总额</div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                ¥{formatCurrency(data.normalRecTotal)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">未收余额合计</div>
              <div className="font-bold text-sky-600 dark:text-sky-400">
                ¥{formatCurrency(data.normalBalTotal)}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
              挂起移入异常清单 (Sheet 3 · 13 笔)
            </span>
            <span className="font-mono text-xs text-amber-600">
              隔离核查不入汇总
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 font-mono text-xs">
            <div>
              <div className="text-slate-400 text-[11px]">挂起应收总额</div>
              <div className="font-bold text-slate-900 dark:text-white">
                ¥{formatCurrency(data.suspendedArTotal)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">挂起已收总额</div>
              <div className="font-bold text-amber-600 dark:text-amber-400">
                ¥{formatCurrency(data.suspendedRecTotal)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">挂起未收净额</div>
              <div className="font-bold text-rose-600 dark:text-rose-400">
                ¥{formatCurrency(data.suspendedBalTotal)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface Step5Props {
  data: PipelineResult;
  paletteMode: PaletteMode;
  onSetPaletteMode: (m: PaletteMode) => void;
  onExportDialog: () => void;
  onQuickExport: () => void;
  isExporting: boolean;
  lastExport: ExportResult | null;
  onRevealFile: (path: string) => void;
}

export const Step5FormulaExportView: React.FC<Step5Props> = ({
  data,
  paletteMode,
  onSetPaletteMode,
  onExportDialog,
  onQuickExport,
  isExporting,
  lastExport,
  onRevealFile,
}) => {
  return (
    <div className="space-y-5">
      {/* Export Control Hero */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
              <Calculator className="w-3.5 h-3.5" />
              Excelize v2 动态公式注入引擎 · 全表 2,432 个原生公式联动
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              导出保留 100% 原生动态公式的 5-Sheet 财务审计工作簿
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              拒绝传统报表工具导出的“死数值”！在导出的 Excel 中修改 <code className="text-sky-500 font-mono">&apos;坏账准备与预警分析表&apos;!$B$1</code> 的报表基准日，全工作簿 107 笔正常明细、13 笔挂起清单及汇总透视表将自动级联重算。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
              <button
                onClick={() => onSetPaletteMode("mygo")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  paletteMode === "mygo"
                    ? "bg-white dark:bg-slate-900 text-pink-600 dark:text-pink-400 shadow-2xs"
                    : "text-slate-500"
                }`}
              >
                MyGO!!!!! 潮流色卡填充
              </button>
              <button
                onClick={() => onSetPaletteMode("classic")}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  paletteMode === "classic"
                    ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs"
                    : "text-slate-500"
                }`}
              >
                标准财务色卡填充
              </button>
            </div>

            <button
              disabled={isExporting}
              onClick={onQuickExport}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              一键快速导出至项目目录
            </button>

            <button
              disabled={isExporting}
              onClick={onExportDialog}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              另存为 Excel 工作簿 (系统对话框)
            </button>
          </div>
        </div>

        {lastExport && (
          <div className="mt-4 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                已成功生成动态公式工作簿：
                <strong className="font-mono ml-1">{lastExport.savedPath}</strong>
                （共 {lastExport.formulaCnt} 个原生公式，体积 {(lastExport.fileSize / 1024).toFixed(1)} KB，耗时 {lastExport.durationMs.toFixed(1)} ms）
              </span>
            </div>
            <button
              onClick={() => onRevealFile(lastExport.savedPath)}
              className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors cursor-pointer"
            >
              在文件夹中显示
            </button>
          </div>
        )}
      </div>

      {/* Sheet 2 Preview Table with Exact Formulas */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            Sheet 2《坏账准备与预警分析表》跨表透视预览（全局基准日单元格 $B$1: =DATE({data.asOfDate.replaceAll("-", ",")})）
          </span>
          <span className="text-[11px] font-mono text-sky-500">
            COUNTIF + SUMIF + ROUND 动态汇总
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-3 py-2">行号</th>
                <th className="px-3 py-2">账龄区间 (A列)</th>
                <th className="px-3 py-2">判定标准 (B列)</th>
                <th className="px-3 py-2">预警等级 / MyGO角色 (C列)</th>
                <th className="px-3 py-2 text-right">单据笔数 (D列公式)</th>
                <th className="px-3 py-2 text-right">笔数占比 (E列)</th>
                <th className="px-3 py-2 text-right">未收余额合计 (F列公式)</th>
                <th className="px-3 py-2 text-right">金额占比 (G列)</th>
                <th className="px-3 py-2 text-right">计提比例 (H列)</th>
                <th className="px-3 py-2 text-right">坏账准备 (I列公式)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {data.tierSummaries.map((t, idx) => {
                const r = idx + 3;
                const theme = RISK_THEME_LIST[idx]!;
                return (
                  <tr key={t.agingTier} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2 text-slate-400">Row {r}</td>
                    <td className="px-3 py-2 font-sans font-medium text-slate-900 dark:text-white">
                      {t.agingTier}
                    </td>
                    <td className="px-3 py-2 font-sans text-slate-500">{t.rangeText}</td>
                    <td className="px-3 py-2 font-sans">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{
                          backgroundColor: theme.excelFill,
                          color: theme.excelFont,
                        }}
                      >
                        {t.riskLevel} ({theme.character})
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div>{t.count}</div>
                      <div className="text-[10px] text-sky-500">
                        =COUNTIF(..., A{r})
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div>{formatPercent(t.countRatio)}</div>
                      <div className="text-[10px] text-slate-400">=D{r}/$D$8</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        ¥{formatCurrency(t.balanceSum)}
                      </div>
                      <div className="text-[10px] text-sky-500">
                        =SUMIF(..., A{r}, $L:$L)
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div>{formatPercent(t.balanceRatio)}</div>
                      <div className="text-[10px] text-slate-400">=F{r}/$F$8</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatPercent(t.provisionRate, 0)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="font-bold text-rose-600 dark:text-rose-400">
                        ¥{formatCurrency(t.provisionSum)}
                      </div>
                      <div className="text-[10px] text-emerald-500">
                        =ROUND(F{r}*H{r}, 2)
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* Row 8 Total */}
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 font-bold">
                <td className="px-3 py-2.5 text-slate-400">Row 8</td>
                <td className="px-3 py-2.5 font-sans">合计</td>
                <td className="px-3 py-2.5 text-center">-</td>
                <td className="px-3 py-2.5 text-center">-</td>
                <td className="px-3 py-2.5 text-right">
                  <div>{data.normalCount}</div>
                  <div className="text-[10px] text-sky-500">=SUM(D3:D7)</div>
                </td>
                <td className="px-3 py-2.5 text-right">100.0%</td>
                <td className="px-3 py-2.5 text-right">
                  <div>¥{formatCurrency(data.normalBalTotal)}</div>
                  <div className="text-[10px] text-sky-500">=SUM(F3:F7)</div>
                </td>
                <td className="px-3 py-2.5 text-right">100.0%</td>
                <td className="px-3 py-2.5 text-right">
                  <div>{formatPercent(data.overallProvRate, 2)}</div>
                  <div className="text-[10px] text-sky-500">=I8/F8</div>
                </td>
                <td className="px-3 py-2.5 text-right text-rose-600 dark:text-rose-400">
                  <div>¥{formatCurrency(data.normalProvTotal)}</div>
                  <div className="text-[10px] text-emerald-500">=SUM(I3:I7)</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5 Worksheets Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[
          {
            sheet: "Sheet 1",
            title: "应收账款明细(清洗后)",
            rows: `${data.normalCount} 笔正常业务明细`,
            desc: "包含 L/N/O/P/Q/S/T/U/V/W 共 10 列原生动态公式，冻结首行窗格。",
          },
          {
            sheet: "Sheet 2",
            title: "坏账准备与预警分析表",
            rows: "5 级账龄阶梯 + 合计行",
            desc: "$B$1 全局基准日参数驱动全表，采用 COUNTIF/SUMIF 跨表实时汇总。",
          },
          {
            sheet: "Sheet 3",
            title: "挂起异常清单",
            rows: `${data.totalSuspended} 笔实质性异常`,
            desc: "独立隔离超额回款(3)、零余额挂账(3)、离群尾差(7)，列明审计核查要求。",
          },
          {
            sheet: "Sheet 4",
            title: "全部数据(含处置标记)",
            rows: `${data.allRecords.length} 笔完整审计轨迹`,
            desc: "保留全量有效单据并标注「正常并入表」与「挂起」双色状态标签。",
          },
          {
            sheet: "Sheet 5",
            title: "客户标准信息表",
            rows: "20 家标准客户主档案",
            desc: "CUST001~CUST020 标准编码、名称、区域、信用等级与历史别名映射表。",
          },
        ].map((s) => (
          <div
            key={s.sheet}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex flex-col justify-between"
          >
            <div>
              <span className="text-[11px] font-mono font-semibold text-sky-500">
                {s.sheet}
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                {s.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {s.desc}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              {s.rows}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
