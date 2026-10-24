// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React, { useState } from "react";
import {
  X,
  FileText,
  Copy,
  Check,
  Download,
  RotateCw,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useSmartARStore } from "../store";
import { MarkdownViewer } from "./MarkdownViewer";

export const AuditReportModal: React.FC = () => {
  const {
    isReportModalOpen,
    closeReportModal,
    auditReport,
    isGeneratingReport,
    generateAuditReport,
    pipelineData,
  } = useSmartARStore();

  const [copied, setCopied] = useState<boolean>(false);

  if (!isReportModalOpen) return null;

  const handleCopy = async () => {
    if (!auditReport?.markdownContent) return;
    try {
      await navigator.clipboard.writeText(auditReport.markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (!auditReport?.markdownContent) return;
    const blob = new Blob([auditReport.markdownContent], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = pipelineData?.asOfDate?.replace(/-/g, "") || "report";
    link.href = url;
    link.download = `应收账款资产质量治理与信用风险审计管理报告_${dateStr}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl h-[88vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  应收账款资产质量治理与信用风险审计管理报告
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  Eino Graph智能综合管报
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                依据《企业会计准则第22号——金融工具确认和计量》（ECL坏账准备模型）全自动多步综合生成
              </p>
            </div>
          </div>
          <button
            onClick={closeReportModal}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar & KPI Banner */}
        <div className="px-6 py-2.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <span className="text-zinc-500 dark:text-zinc-400 mr-1.5">基准日:</span>
              <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                {pipelineData?.asOfDate || "未设定"}
              </span>
            </div>
            <div className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <span className="text-zinc-500 dark:text-zinc-400 mr-1.5">未收敞口:</span>
              <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                ¥{pipelineData?.normalBalTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <span className="text-zinc-500 dark:text-zinc-400 mr-1.5">坏账准备:</span>
              <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                ¥{pipelineData?.normalProvTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => generateAuditReport("comprehensive")}
              disabled={isGeneratingReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50"
              title="重新运行多步编排撰写报告"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isGeneratingReport ? "animate-spin" : ""}`} />
              重新生成
            </button>
            <button
              onClick={handleCopy}
              disabled={!auditReport?.markdownContent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "已复制全文" : "复制Markdown"}
            </button>
            <button
              onClick={handleDownload}
              disabled={!auditReport?.markdownContent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white/90 transition-colors shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              导出.md文件
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-zinc-900">
          {isGeneratingReport && !auditReport?.markdownContent && (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-900 dark:text-zinc-100" />
              <div className="text-xs font-medium">工作流正在聚合财务数据并撰写报告...</div>
              <div className="text-[11px] text-zinc-400">
                涵盖账龄迁徙分析、客户集中度穿透、实质性异常调账与五级催收行动方案
              </div>
            </div>
          )}

          {auditReport?.markdownContent ? (
            <div className="max-w-3xl mx-auto">
              <MarkdownViewer content={auditReport.markdownContent} />
              {isGeneratingReport && (
                <div className="flex items-center gap-2 mt-4 text-xs text-zinc-400 italic">
                  <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" />
                  大模型正在流式补充后续章节...
                </div>
              )}
            </div>
          ) : !isGeneratingReport ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-zinc-500">
              <Sparkles className="w-8 h-8 text-zinc-400" />
              <div className="text-xs font-medium">暂无生成的报告</div>
              <button
                onClick={() => generateAuditReport("comprehensive")}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white/90 transition-colors"
              >
                立即一键生成管理层审计管报
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
