// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import type { ARRecord } from "../mygo";
import {
  formatCurrency,
  formatSystemDate,
  getThemeByTierOrLevel,
  type PaletteMode,
} from "../theme";
import {
  ArrowUpDown,
  Search,
  Filter,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react";

interface ARDataTableProps {
  records: ARRecord[];
  paletteMode: PaletteMode;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  tierFilter: string;
  onTierFilterChange: (tier: string) => void;
  regionFilter: string;
  onRegionFilterChange: (reg: string) => void;
  datasetScope: "normal" | "suspended" | "all";
  onScopeChange: (scope: "normal" | "suspended" | "all") => void;
  counts: { normal: number; suspended: number; all: number };
}

const columnHelper = createColumnHelper<ARRecord>();

export const ARDataTable: React.FC<ARDataTableProps> = ({
  records,
  paletteMode,
  searchQuery,
  onSearchChange,
  tierFilter,
  onTierFilterChange,
  regionFilter,
  onRegionFilterChange,
  datasetScope,
  onScopeChange,
  counts,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [inspectRecord, setInspectRecord] = useState<{
    record: ARRecord;
    excelRow: number;
  } | null>(null);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (tierFilter !== "ALL" && r.agingTier !== tierFilter) return false;
      if (regionFilter !== "ALL" && r.region !== regionFilter) return false;
      if (!q) return true;
      return (
        r.custName.toLowerCase().includes(q) ||
        r.custCode.toLowerCase().includes(q) ||
        r.invoiceNo.toLowerCase().includes(q) ||
        r.contractNo.toLowerCase().includes(q) ||
        r.salesperson.toLowerCase().includes(q) ||
        r.region.toLowerCase().includes(q) ||
        String(r.seq).includes(q)
      );
    });
  }, [records, searchQuery, tierFilter, regionFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("seq", {
        header: "序号",
        cell: (info) => (
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            #{info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("custName", {
        header: "标准客户名称 / 编码",
        cell: (info) => {
          const row = info.row.original;
          const aliasFixed = row.rawCustName !== row.custName;
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-zinc-900 dark:text-zinc-100 text-xs">
                  {row.custName}
                </span>
                {aliasFixed && (
                  <span
                    className="px-1 py-0.2 text-[10px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                    title={`原表简称: ${row.rawCustName}`}
                  >
                    已对齐标准名
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                {row.custCode} · {row.region} · 信用{row.creditLevel}级 ·{" "}
                {row.salesperson}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("invoiceNo", {
        header: "发票号 / 开票日",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex flex-col font-mono text-xs">
              <span className="text-zinc-800 dark:text-zinc-200">
                {row.invoiceNo}
              </span>
              <span className="text-[11px] text-zinc-400">
                开票:{formatSystemDate(row.invoiceDate)} (账期{row.creditTermDays}天)
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("arAmount", {
        header: "应收金额(元)",
        cell: (info) => (
          <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
            ¥{formatCurrency(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("receivedAmount", {
        header: "已收金额(元)",
        cell: (info) => (
          <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
            ¥{formatCurrency(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("balanceAmount", {
        header: "未收余额(元)",
        cell: (info) => (
          <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-white">
            ¥{formatCurrency(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("ageDays", {
        header: "账龄 / 逾期",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex flex-col font-mono text-xs">
              <span className="text-zinc-800 dark:text-zinc-200">
                {row.ageDays}天
              </span>
              <span
                className={`text-[11px] ${
                  row.overdueDays > 0
                    ? "text-amber-600 dark:text-amber-400 font-medium"
                    : "text-zinc-400"
                }`}
              >
                {row.overdueDays > 0
                  ? `逾期${row.overdueDays}天`
                  : "未逾期"}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("agingTier", {
        header: "账龄分档 & 预警等级",
        cell: (info) => {
          const row = info.row.original;
          const theme = getThemeByTierOrLevel(row.agingTier);
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  paletteMode === "soft"
                    ? theme.badgeClass
                    : theme.classicBadgeClass
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      paletteMode === "soft" ? theme.color : theme.classicColor,
                  }}
                />
                {paletteMode === "soft" ? theme.name : theme.classicName}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {row.agingTier}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor("provisionAmount", {
        header: "坏账准备(计提)",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex flex-col text-right font-mono">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                ¥{formatCurrency(row.provisionAmount)}
              </span>
              <span className="text-[10px] text-zinc-400">
                比例{(row.provisionRate * 100).toFixed(0)}%
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "auditStatus",
        header: "勾稽审计状态",
        cell: (info) => {
          const row = info.row.original;
          const hasRepairs =
            row.repairedFields.length > 0 || row.anomalyTags.length > 0;
          return (
            <div className="flex items-center justify-between gap-2">
              {row.isSuspended ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-400 border border-zinc-200 dark:border-zinc-700 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  {row.suspendType}
                </span>
              ) : hasRepairs ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  <Sparkles className="w-3 h-3" />
                  已修补({row.repairedFields.length + row.anomalyTags.length}项)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  <CheckCircle2 className="w-3 h-3" />
                  正常入表
                </span>
              )}
              <button
                onClick={() =>
                  setInspectRecord({
                    record: row,
                    excelRow: info.row.index + 2,
                  })
                }
                className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-300 transition-colors"
                title="穿透复核单笔勾稽与Excel公式链"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        },
      }),
    ],
    [paletteMode]
  );

  const table = useReactTable({
    data: filteredRecords,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs overflow-hidden">
      {/* Toolbar */}
      <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg">
          <button
            onClick={() => onScopeChange("normal")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              datasetScope === "normal"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            正常入表明细({counts.normal}笔)
          </button>
          <button
            onClick={() => onScopeChange("suspended")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              datasetScope === "suspended"
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            挂起异常清单({counts.suspended}笔)
          </button>
          <button
            onClick={() => onScopeChange("all")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              datasetScope === "all"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-2xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            全量数据({counts.all}笔)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索客户/发票号/销售员/区域..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white w-56"
            />
          </div>

          {/* Aging tier filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={tierFilter}
              onChange={(e) => onTierFilterChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
            >
              <option value="ALL">全部账龄区间</option>
              <option value="1个月以内">1个月以内 (正常 · 0-30天)</option>
              <option value="1-3个月">1-3个月 (关注 · 31-90天)</option>
              <option value="3-6个月">3-6个月 (审慎 · 91-180天)</option>
              <option value="6-12个月">6-12个月 (严控 · 181-365天)</option>
              <option value="1年以上">1年以上 (高危 · 365天以上)</option>
            </select>
          </div>

          {/* Region filter */}
          <select
            value={regionFilter}
            onChange={(e) => onRegionFilterChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200 text-xs focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
          >
            <option value="ALL">全部区域</option>
            <option value="华东">华东</option>
            <option value="华北">华北</option>
            <option value="华南">华南</option>
            <option value="华中">华中</option>
            <option value="西南">西南</option>
            <option value="东北">东北</option>
            <option value="西北">西北</option>
          </select>

          {(tierFilter !== "ALL" || regionFilter !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                onTierFilterChange("ALL");
                onRegionFilterChange("ALL");
                onSearchChange("");
              }}
              className="px-2 py-1 text-xs text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors"
            >
              重置筛选
            </button>
          )}
        </div>
      </div>

      {/* Table container */}
      <div className="max-h-[440px] overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur-xs border-b border-zinc-200 dark:border-zinc-800">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-3 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 select-none cursor-pointer hover:text-zinc-900 dark:hover:text-white whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/70">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() =>
                  setInspectRecord({
                    record: row.original,
                    excelRow: row.index + 2,
                  })
                }
                className="hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-xs text-zinc-400"
                >
                  未找到符合当前筛选条件的应收账款记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer status bar */}
      <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          当前显示<strong>{filteredRecords.length}</strong>笔记录（点击任意行可穿透查看勾稽关系与Excel原生公式）
        </span>
        <span className="font-mono">
          当前筛选未收余额合计：¥
          {formatCurrency(
            filteredRecords.reduce((acc, r) => acc + r.balanceAmount, 0)
          )}
          {" "}| 坏账准备合计：¥
          {formatCurrency(
            filteredRecords.reduce((acc, r) => acc + r.provisionAmount, 0)
          )}
        </span>
      </div>

      {/* Single-Record Penetration Audit Dialog (PRD 7.1 Dialog + Alert + Badge) */}
      {inspectRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setInspectRecord(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const r = inspectRecord.record;
              const i = inspectRecord.excelRow;
              const theme = getThemeByTierOrLevel(r.agingTier);
              return (
                <>
                  <div
                    className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between"
                    style={{
                      borderLeftWidth: "6px",
                      borderLeftColor:
                        paletteMode === "soft"
                          ? theme.color
                          : theme.classicColor,
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          序号 #{r.seq} (原表第{r.origRow}行)
                        </span>
                        <span className={theme.badgeClass + " px-2.5 py-0.5 rounded-full text-xs border"}>
                          {theme.name} ({r.agingTier})
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-1">
                        {r.custName} ({r.custCode})
                      </h3>
                    </div>
                    <button
                      onClick={() => setInspectRecord(null)}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                    {/* Basic Financial Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60">
                        <div className="text-zinc-400">发票号 / 合同号</div>
                        <div className="font-mono font-semibold text-zinc-900 dark:text-white mt-0.5">
                          {r.invoiceNo} / {r.contractNo}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60">
                        <div className="text-zinc-400">开票日 / 约定收款日</div>
                        <div className="font-mono font-semibold text-zinc-900 dark:text-white mt-0.5">
                          {formatSystemDate(r.invoiceDate)} → {formatSystemDate(r.dueDate)}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60">
                        <div className="text-zinc-400">账龄 / 逾期天数</div>
                        <div className="font-mono font-semibold text-zinc-900 dark:text-white mt-0.5">
                          {r.ageDays}天 / 逾期{r.overdueDays}天
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60">
                        <div className="text-zinc-400">坏账计提比例 & 金额</div>
                        <div className="font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                          {(r.provisionRate * 100).toFixed(0)}% · ¥
                          {formatCurrency(r.provisionAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Audit & Imputation Trail */}
                    {(r.repairedFields.length > 0 ||
                      r.anomalyTags.length > 0 ||
                      r.rawCustName !== r.custName) && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1.5">
                        <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          数据治理与勾稽审计轨迹
                        </div>
                        {r.rawCustName !== r.custName && (
                          <div className="text-zinc-600 dark:text-zinc-300">
                            • <strong>客户主数据对齐</strong>：原表录入「
                            {r.rawCustName} ({r.rawCustCode})」→ 映射标准档案「
                            {r.custName} ({r.custCode})」
                          </div>
                        )}
                        {r.repairedFields.length > 0 && (
                          <div className="text-zinc-600 dark:text-zinc-300">
                            • <strong>缺失值智能修补字段</strong>：
                            {r.repairedFields.join("、")}
                          </div>
                        )}
                        {r.anomalyTags.length > 0 && (
                          <div className="text-zinc-600 dark:text-zinc-300">
                            • <strong>异常识别与处置标签</strong>：
                            {r.anomalyTags.join("、")}（{r.dataStatus}）
                          </div>
                        )}
                      </div>
                    )}

                    {/* Excel Native Formula Penetration Preview */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-3.5 space-y-2">
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-zinc-500" />
                        该笔记录导出至Excel时的原生动态公式链（第{i}行）
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                        <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
                          <span className="text-zinc-400">未收余额 (L{i}): </span>
                          <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
                            =J{i}-K{i}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
                          <span className="text-zinc-400">约定收款日 (N{i}): </span>
                          <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
                            =G{i}+M{i}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
                          <span className="text-zinc-400">账龄天数 (O{i}): </span>
                          <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
                            =&apos;坏账准备与预警分析表&apos;!$B$1-G{i}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
                          <span className="text-zinc-400">逾期天数 (P{i}): </span>
                          <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
                            =MAX(0, &apos;坏账准备与预警分析表&apos;!$B$1-N{i})
                          </span>
                        </div>
                        <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 sm:col-span-2">
                          <span className="text-zinc-400">坏账准备 (U{i}): </span>
                          <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
                            =ROUND(L{i}*T{i}, 2)
                          </span>
                          <span className="text-zinc-400 ml-3">建议措施 (W{i}): </span>
                          <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
                            =VLOOKUP(S{i}, &apos;坏账准备与预警分析表&apos;!$A$3:$J$7, 10, FALSE)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Suggested Management Action */}
                    <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-zinc-400 text-[11px]">
                          催收与信用管控制度建议 ({theme.name} · {theme.metaphor})
                        </div>
                        <div className="font-medium text-zinc-900 dark:text-white mt-0.5">
                          {r.suggestedAction}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
