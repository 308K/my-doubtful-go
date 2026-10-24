// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Sparkles,
  Trash2,
  Settings2,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowUp,
  Wrench,
  Loader2,
  SlidersHorizontal,
  ExternalLink,
  Brain,
  BarChart3,
  Building2,
  AlertTriangle,
  Plus,
  Search,
  Sun,
  Moon,
  Copy,
  RotateCcw,
  Layers,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useSmartARStore } from "../store";
import { MarkdownViewer } from "./MarkdownViewer";
import type { RuleUpdateProposal } from "../mygo";

const EFFORT_OPTIONS = [
  { value: "minimal", label: "极低", percent: 0 },
  { value: "low", label: "低", percent: 25 },
  { value: "medium", label: "适中", percent: 50 },
  { value: "high", label: "高", percent: 75 },
  { value: "max", label: "最高", percent: 100 },
] as const;

type EffortValue = (typeof EFFORT_OPTIONS)[number]["value"];

const QUICK_PROMPTS = [
  {
    icon: BarChart3,
    label: "坏账风险与拨备测算",
    prompt: "请结合当前应收账款全局汇总指标与5级账龄区间分布，全面评估当前坏账准备计提充分性及风险敞口主力分布。",
  },
  {
    icon: Building2,
    label: "大客户穿透与信用排查",
    prompt: "请穿透分析欠款未收余额最高的前5位大客户，指出其初始信用评级、基准账期、最大逾期天数及违约风险传导。",
  },
  {
    icon: AlertTriangle,
    label: "审查挂起异常隔离单据",
    prompt: "请全面审查Step 3隔离挂起的实质性风险单据（包括已收大于应收、离群小额、0余额挂账等），并针对发票红冲与调账处理给出合规建议。",
  },
  {
    icon: SlidersHorizontal,
    label: "提案：调高审慎档坏账率",
    prompt: "下半年外部宏观信用风险增加，帮我把3-6个月（审慎档）的坏账计提比例从20%上调至25%，生成审核提案卡片并解释理由。",
  },
  {
    icon: Layers,
    label: "提案：调整账期与宽限策略",
    prompt: "为强化逾期催收考核，请生成治理规则调整提案：将账期推导策略保持众数优先，但将缺省账期调整为45天，并将逾期宽限期调整为5天。",
  },
  {
    icon: ShieldAlert,
    label: "提案：上调小额离群值阈值",
    prompt: "业务规模扩大后小额单据增多，请帮我生成提案：将离群小额异常金额判定阈值从20000元提高到50000元，并测算其对隔离单据数量的影响。",
  },
  {
    icon: Users,
    label: "提案：维护客户信用与主数据",
    prompt: "客户KH001近期经营状况改善并通过了增信审查，请生成提案将该客户的信用等级从B上调至AA，并归属华东大区。",
  },
  {
    icon: FileText,
    label: "撰写综合管理审计管报",
    prompt: "请根据当前应收账款全流程清洗与计提底稿，为管理层起草一份结构化、权威的《应收账款资产质量治理与信用风险审计管理报告》。",
  },
];

interface AIAssistantDrawerProps {
  isStandalone?: boolean;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isStandalone = false,
}) => {
  const {
    isAIPanelOpen,
    closeAIPanel,
    openAISettings,
    openReportModal,
    generateAuditReport,
    chatMessages,
    isAIGenerating,
    aiCurrentTool,
    sendChatMessage,
    withdrawChatMessage,
    clearChat,
    approveProposal,
    rejectProposal,
    aiConfig,
    setActiveModel,
    setReasoningEffort,
    addCustomModel,
    openStandaloneWindow,
    darkMode,
    toggleDarkMode,
  } = useSmartARStore();

  const [input, setInput] = useState<string>("");
  const [drawerRatio, setDrawerRatio] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smartar-drawer-ratio");
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.2 && parsed <= 0.6) {
          return parsed;
        }
      }
    }
    return 0.3; // Default 30% of main window
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [modelSearch, setModelSearch] = useState<string>("");
  const [newModelName, setNewModelName] = useState<string>("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopyMessage = async (idx: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => {
        setCopiedIdx(null);
      }, 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleWithdrawMessage = async (idx: number) => {
    const msg = chatMessages[idx];
    if (!msg) return;
    const textToRestore = msg.content;
    await withdrawChatMessage(idx);
    setInput(textToRestore);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSelectQuickPrompt = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isAIPanelOpen || isStandalone) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isAIGenerating, isAIPanelOpen, aiCurrentTool, isStandalone]);

  // Focus input when opened
  useEffect(() => {
    if (isAIPanelOpen || isStandalone) {
      inputRef.current?.focus();
    }
  }, [isAIPanelOpen, isStandalone]);

  // Outside click to close model popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsPopoverOpen(false);
      }
    };
    if (isPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPopoverOpen]);

  // Keyboard shortcut Ctrl+T to cycle reasoning effort
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "t") {
        e.preventDefault();
        const currentEffort = (aiConfig?.reasoningEffort || "medium") as EffortValue;
        const currentIndex = EFFORT_OPTIONS.findIndex((opt) => opt.value === currentEffort);
        const nextIndex = (currentIndex + 1) % EFFORT_OPTIONS.length;
        const nextEffort = EFFORT_OPTIONS[nextIndex]!.value;
        void setReasoningEffort(nextEffort);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aiConfig?.reasoningEffort, setReasoningEffort]);

  // Persist drawer ratio when changed
  useEffect(() => {
    try {
      localStorage.setItem("smartar-drawer-ratio", drawerRatio.toString());
    } catch {
      // ignore
    }
  }, [drawerRatio]);

  // Drag handle for width resizing (20% to 60% of window width)
  const handleMouseDownResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = window.innerWidth - moveEvent.clientX;
      const ratio = newWidth / window.innerWidth;
      const clampedRatio = Math.min(Math.max(ratio, 0.2), 0.6);
      setDrawerRatio(clampedRatio);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  if (!isAIPanelOpen && !isStandalone) return null;

  const handleSend = async () => {
    if (!input.trim() || isAIGenerating) return;
    const text = input;
    setInput("");
    await sendChatMessage(text);
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleDetachWindow = async () => {
    closeAIPanel();
    await openStandaloneWindow();
  };

  const currentEffort = (aiConfig?.reasoningEffort || "medium") as EffortValue;
  const currentEffortObj =
    EFFORT_OPTIONS.find((opt) => opt.value === currentEffort) || EFFORT_OPTIONS[2]!;
  const currentModelName = aiConfig?.model || "deepseek-chat";
  const savedModelList =
    aiConfig?.savedModels && aiConfig.savedModels.length > 0
      ? aiConfig.savedModels
      : ["deepseek-chat", "deepseek-reasoner"];

  const filteredModels = savedModelList.filter((m) =>
    m.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const closest = EFFORT_OPTIONS.reduce((prev, curr) => {
      return Math.abs(curr.percent / 100 - ratio) < Math.abs(prev.percent / 100 - ratio)
        ? curr
        : prev;
    });
    void setReasoningEffort(closest.value);
  };

  const handleAddCustomModelSubmit = () => {
    const trimmed = newModelName.trim();
    if (!trimmed) return;
    void addCustomModel(trimmed);
    setNewModelName("");
  };

  const drawerClass = isStandalone
    ? "h-full w-full flex flex-col bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-sans"
    : "fixed inset-y-0 right-0 z-40 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col font-sans transition-all";

  return (
    <div
      style={!isStandalone ? { width: `${(drawerRatio * 100).toFixed(1)}%` } : undefined}
      className={drawerClass}
    >
      {/* Resizing Edge Handle */}
      {!isStandalone && (
        <div
          onMouseDown={handleMouseDownResize}
          className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-zinc-400/40 active:bg-zinc-500/60 transition-colors z-50 ${
            isResizing ? "bg-zinc-500/50" : ""
          }`}
          title="按住拖拽调整侧边栏宽度 (20%至60%)"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                AI财务治理助手
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 max-w-[130px] truncate">
                {currentModelName}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              OpenAI Go SDK原生驱动 · 支持多轮工具调用与协同审核
            </p>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={darkMode ? "切换为浅色模式" : "切换为深色模式"}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600" />
            )}
          </button>
          <button
            onClick={() => generateAuditReport("comprehensive")}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="一键生成管理层综合审计管报"
          >
            <FileText className="w-4 h-4" />
          </button>
          {!isStandalone && (
            <button
              onClick={handleDetachWindow}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="拆分为独立窗口"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={openAISettings}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="配置大模型提供商与API Key"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={clearChat}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="清空当前会话"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {!isStandalone && (
            <button
              onClick={closeAIPanel}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="关闭侧边栏"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 px-4 py-3 overflow-y-auto space-y-4">
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`group relative flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* Role Header & Timestamp & Action Buttons */}
            {msg.role === "user" ? (
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 mb-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none">
                <div className="flex items-center gap-1">
                  <span>财务用户</span>
                  {msg.createdAt && <span>· {msg.createdAt}</span>}
                </div>
                <div className="flex items-center gap-1 ml-1 text-zinc-400">
                  <button
                    type="button"
                    onClick={() => void handleCopyMessage(idx, msg.content)}
                    title="复制文本"
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    {copiedIdx === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>复制</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleWithdrawMessage(idx)}
                    disabled={isAIGenerating}
                    title="撤回到此消息前并填回输入框"
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>撤回</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 mb-1 px-1 select-none">
                <span>SmartAR审计专家</span>
                {msg.createdAt && <span>· {msg.createdAt}</span>}
              </div>
            )}

            {/* Bubble */}
            {msg.role === "user" ? (
              <div className="max-w-[85%] rounded-2xl rounded-tr-xs px-3.5 py-2 text-xs bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs selection:bg-blue-600 selection:text-white dark:selection:bg-blue-600 dark:selection:text-white">
                {msg.content}
              </div>
            ) : (
              <div className="max-w-[95%] space-y-2">
                {/* Reasoning Collapse Box */}
                {msg.reasoningContent && (
                  <ReasoningBox text={msg.reasoningContent} />
                )}

                {/* Content Bubble */}
                <div className="rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-xs selection:bg-blue-600 selection:text-white dark:selection:bg-blue-600 dark:selection:text-white">
                  <MarkdownViewer content={msg.content || "..."} />
                </div>

                {/* Interactive Rule Proposal Card */}
                {msg.proposal && (
                  <ProposalCard
                    proposal={msg.proposal}
                    onApprove={() => approveProposal(msg.proposal!.proposalId)}
                    onReject={() => rejectProposal(msg.proposal!.proposalId)}
                  />
                )}
              </div>
            )}
          </div>
        ))}

        {/* Real-time Tool Activity Indicator */}
        {isAIGenerating && aiCurrentTool && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs animate-pulse">
            <Wrench className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            <span>{aiCurrentTool}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel */}
      <div className="px-3.5 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 shrink-0">
        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400 mb-1.5">
          <span>快捷财务分析指令 (点击填入输入框)</span>
          <span className="text-[10px] text-zinc-500 font-mono">共{QUICK_PROMPTS.length}项Agent指令</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto pr-0.5">
          {QUICK_PROMPTS.map((qp, idx) => {
            const IconComp = qp.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectQuickPrompt(qp.prompt)}
                disabled={isAIGenerating}
                className="text-left flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] transition-colors truncate disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <IconComp className="w-3.5 h-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
                <span className="truncate">{qp.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Input Area with Integrated Model & Reasoning-Effort Popover */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 relative">
        {/* Model & Reasoning Effort Popover (Matching Images 3 & 4) */}
        {isPopoverOpen && (
          <div
            ref={popoverRef}
            className="absolute right-3 bottom-14 z-50 w-72 rounded-xl border border-zinc-700/80 bg-zinc-900 text-zinc-100 shadow-2xl p-3 text-xs animate-in fade-in-0 zoom-in-95 duration-100"
          >
            {/* Model Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
                <span>模型</span>
                <span className="text-[10px] text-zinc-500 font-mono">共{savedModelList.length}个</span>
              </div>

              {/* Model Search Box if > 3 */}
              {savedModelList.length > 3 && (
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="搜索模型..."
                    className="w-full pl-6 pr-2 py-1 text-[11px] font-mono rounded border border-zinc-700 bg-zinc-800/80 text-zinc-100 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              )}

              {/* Scrollable Model List */}
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {filteredModels.map((m) => {
                  const isSelected = currentModelName === m;
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        void setActiveModel(m);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors text-left ${
                        isSelected
                          ? "bg-zinc-800 text-zinc-100 font-semibold"
                          : "text-zinc-300 hover:bg-zinc-800/60"
                      }`}
                    >
                      <span className="truncate">{m}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-zinc-100 shrink-0 ml-1.5" />}
                    </button>
                  );
                })}
              </div>

              {/* Quick Add Model Input */}
              <div className="flex items-center gap-1 pt-1 border-t border-zinc-800">
                <input
                  type="text"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomModelSubmit();
                    }
                  }}
                  placeholder="添加新模型名称..."
                  className="flex-1 px-2 py-1 text-[11px] font-mono rounded border border-zinc-700 bg-zinc-800/60 text-zinc-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomModelSubmit}
                  disabled={!newModelName.trim()}
                  className="px-2 py-1 rounded text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors disabled:opacity-40"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-700/60 my-2.5" />

            {/* Reasoning Effort Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300">
                  思考强度 <span className="font-semibold text-zinc-100">{currentEffortObj.label}</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Ctrl+T
                </span>
              </div>

              {/* Sleek Gradient Slider (Matching Image 4) */}
              <div
                onClick={handleSliderClick}
                className="relative h-3 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-500 cursor-pointer shadow-inner"
              >
                {/* Thumb Knob */}
                <div
                  style={{ left: `calc(${currentEffortObj.percent}% - 10px)` }}
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-md border border-zinc-300 transition-all cursor-grab active:cursor-grabbing hover:scale-105"
                />
              </div>

              {/* Effort Notch Labels */}
              <div className="flex justify-between text-[10px] text-zinc-400 px-0.5 pt-0.5">
                {EFFORT_OPTIONS.map((opt) => (
                  <span
                    key={opt.value}
                    onClick={() => void setReasoningEffort(opt.value)}
                    className={`cursor-pointer transition-colors ${
                      opt.value === currentEffort ? "text-zinc-100 font-semibold" : "hover:text-zinc-300"
                    }`}
                  >
                    {opt.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 focus-within:border-zinc-900 dark:focus-within:border-white focus-within:ring-1 focus-within:ring-zinc-900 dark:focus-within:ring-white transition-all">
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDownInput}
            placeholder="提问应收账款指标、逾期异常或输入规则变更要求... (Enter发送)"
            className="w-full px-3 py-2 text-xs bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none resize-none"
          />

          {/* Bottom Bar inside Input Box */}
          <div className="flex items-center justify-between px-2.5 pb-2 pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50">
            <span className="text-[10px] text-zinc-400">
              Shift+Enter换行
            </span>

            {/* Model & Effort Trigger + Send Button (Matching Images 3 & 4) */}
            <div className="flex items-center gap-1.5">
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono border border-zinc-300/80 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
                title="选择模型与思考强度"
              >
                <span className="max-w-[110px] truncate">{currentModelName}</span>
                <span className="text-zinc-500 dark:text-zinc-400">{currentEffortObj.label}</span>
                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isPopoverOpen ? "rotate-180" : ""}`} />
              </button>

              <button
                onClick={handleSend}
                disabled={!input.trim() || isAIGenerating}
                className="p-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white/90 disabled:opacity-40 transition-colors shadow-xs"
                title="发送 (Enter)"
              >
                {isAIGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowUp className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/** DeepSeek-R1 / thinking models reasoning drop-down box */
const ReasoningBox: React.FC<{ text: string }> = ({ text }) => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/90 overflow-hidden text-xs">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-[11px]"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Brain className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          <span>深度思考过程 ({text.length}字)</span>
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="px-3 py-2 text-[11px] font-mono leading-relaxed text-zinc-600 dark:text-zinc-300 bg-zinc-100/50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-700 max-h-48 overflow-y-auto whitespace-pre-wrap">
          {text}
        </div>
      )}
    </div>
  );
};

/** Interactive Proposal Review Card with Human-in-the-Loop approval */
const ProposalCard: React.FC<{
  proposal: RuleUpdateProposal;
  onApprove: () => void;
  onReject: () => void;
}> = ({ proposal, onApprove, onReject }) => {
  const isPending = proposal.status === "pending";
  const isApproved = proposal.status === "approved";

  return (
    <div className="rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/20 p-3.5 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200 text-xs">
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>规则调整提案 ({proposal.category === "tier" ? "坏账计提标准" : proposal.category === "customer" ? "客户主数据" : "缺失值填充"})</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
            isPending
              ? "bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200"
              : isApproved
              ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300"
              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {isPending ? "待审核" : isApproved ? "已批准生效" : "已放弃"}
        </span>
      </div>

      <div className="text-zinc-700 dark:text-zinc-300 text-xs">
        {proposal.summary}
      </div>

      <div className="p-2 rounded bg-white/80 dark:bg-zinc-900/80 border border-amber-200 dark:border-amber-900/40 font-mono text-[11px] text-zinc-900 dark:text-zinc-100">
        {proposal.diffDescription}
      </div>

      {isPending && (
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onReject}
            className="px-2.5 py-1 rounded text-xs text-zinc-600 dark:text-zinc-400 hover:bg-amber-100/50 dark:hover:bg-zinc-800 transition-colors"
          >
            放弃
          </button>
          <button
            onClick={onApprove}
            className="flex items-center gap-1 px-3 py-1 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white/90 text-xs font-medium transition-colors shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            一键批准并应用
          </button>
        </div>
      )}

      {isApproved && (
        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
          <Check className="w-3.5 h-3.5" />
          该提案已成功应用于财务流水线，全表已完成实时重新测算。
        </div>
      )}
    </div>
  );
};
