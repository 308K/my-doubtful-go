// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { create } from "zustand";
import { isMyGo, Channel } from "mygo-runtime";
import {
  SmartARService,
  type AIConfig,
  type ARRecord,
  type ChatMessage,
  type CustomerStandard,
  type ExportResult,
  type ImputationConfig,
  type PipelineOptions,
  type PipelineResult,
  type ReportResult,
  type RuleConfigPackage,
  type RuleUpdateProposal,
  type StreamChunk,
  type SystemInfo,
  type TierConfig,
} from "./mygo";
import type { PaletteMode } from "./theme";

export type ActiveStep = 1 | 2 | 3 | 4 | 5;

interface SmartARState {
  activeStep: ActiveStep;
  pipelineData: PipelineResult | null;
  systemInfo: SystemInfo | null;
  isLoading: boolean;
  isExporting: boolean;
  error: string | null;
  toastMessage: string | null;
  asOfDate: string;
  paletteMode: PaletteMode;
  darkMode: boolean;
  isRuleModalOpen: boolean;

  // AI Assistant States
  isAIPanelOpen: boolean;
  isAISettingsOpen: boolean;
  isReportModalOpen: boolean;
  aiConfig: AIConfig | null;
  chatMessages: ChatMessage[];
  isAIGenerating: boolean;
  aiCurrentTool: string | null;
  auditReport: ReportResult | null;
  isGeneratingReport: boolean;

  // Table & Dashboard filter states
  searchQuery: string;
  tierFilter: string;
  regionFilter: string;
  datasetScope: "normal" | "suspended" | "all";
  selectedRecord: ARRecord | null;
  lastExport: ExportResult | null;

  // Actions
  setActiveStep: (step: ActiveStep) => void;
  setPaletteMode: (mode: PaletteMode) => void;
  togglePaletteMode: () => void;
  toggleDarkMode: () => void;
  openRuleModal: () => void;
  closeRuleModal: () => void;
  openAIPanel: () => void;
  closeAIPanel: () => void;
  toggleAIPanel: () => void;
  openAISettings: () => void;
  closeAISettings: () => void;
  openReportModal: () => void;
  closeReportModal: () => void;
  setSearchQuery: (q: string) => void;
  setTierFilter: (tier: string) => void;
  setRegionFilter: (region: string) => void;
  setDatasetScope: (scope: "normal" | "suspended" | "all") => void;
  setSelectedRecord: (rec: ARRecord | null) => void;
  clearToast: () => void;

  initApp: () => Promise<void>;
  loadSampleData: () => Promise<void>;
  openFileWithDialog: () => Promise<void>;
  loadFromFilePath: (filePath: string) => Promise<void>;
  loadFromBrowserFile: (file: File) => Promise<void>;
  changeAsOfDate: (newDate: string) => Promise<void>;
  applyCustomRules: (rules: {
    imputationRules: ImputationConfig;
    customerStandards: CustomerStandard[];
    tierConfigs: TierConfig[];
  }) => Promise<void>;
  resetCustomRules: () => Promise<void>;
  exportWorkbook: (quickMode?: boolean) => Promise<void>;
  revealExportedFile: (filePath: string) => Promise<void>;

  // AI Actions
  fetchAIConfig: () => Promise<void>;
  saveAIConfig: (cfg: AIConfig) => Promise<void>;
  fetchModels: () => Promise<string[]>;
  addCustomModel: (modelName: string) => Promise<void>;
  removeCustomModel: (modelName: string) => Promise<void>;
  setActiveModel: (model: string) => Promise<void>;
  setReasoningEffort: (effort: string) => Promise<void>;
  openStandaloneWindow: () => Promise<void>;
  syncChatHistory: () => Promise<void>;
  sendChatMessage: (content: string) => Promise<void>;
  withdrawChatMessage: (index: number) => Promise<void>;
  clearChat: () => void;
  generateAuditReport: (focus?: string) => Promise<void>;
  approveProposal: (proposalId: string) => Promise<void>;
  rejectProposal: (proposalId: string) => Promise<void>;
}

export const getInitialDarkMode = (): boolean => {
  if (typeof window === "undefined") return true;
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("dark")) {
    return urlParams.get("dark") === "1";
  }
  const saved = localStorage.getItem("smartar-dark-mode");
  if (saved !== null) {
    return saved === "1";
  }
  return true;
};

export const applyDarkModeDOM = (isDark: boolean) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  try {
    localStorage.setItem("smartar-dark-mode", isDark ? "1" : "0");
  } catch {
    // ignore
  }
};

export const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "您好！我是SmartAR智能财务与信用审计专家助手。\n\n我可以协助您进行**应收账款全局资产指标问答**、**5级账龄区间与坏账准备测算穿透**、**大客户集中度与逾期风险审计**，以及**自然语言规则配置（人机协同审核）**。\n\n您可以点击下方快捷提示词或直接输入问题，也可以点击右上角生成《管理层审计分析管报》。",
  createdAt: new Date().toLocaleTimeString(),
};

export const getInitialChatMessages = (): ChatMessage[] => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("smartar_chat_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return [DEFAULT_WELCOME_MESSAGE];
};

const persistChatHistory = (messages: ChatMessage[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("smartar_chat_history", JSON.stringify(messages));
    } catch {
      // ignore
    }
  }
  if (isMyGo()) {
    SmartARService.saveChatHistory(messages).catch(() => {});
  }
};

export const useSmartARStore = create<SmartARState>((set, get) => ({
  activeStep: 1,
  pipelineData: null,
  systemInfo: null,
  isLoading: false,
  isExporting: false,
  error: null,
  toastMessage: null,
  asOfDate: "2026-06-30",
  paletteMode: "classic",
  darkMode: getInitialDarkMode(),
  isRuleModalOpen: false,

  // AI Assistant States
  isAIPanelOpen: false,
  isAISettingsOpen: false,
  isReportModalOpen: false,
  aiConfig: null,
  chatMessages: getInitialChatMessages(),
  isAIGenerating: false,
  aiCurrentTool: null,
  auditReport: null,
  isGeneratingReport: false,

  searchQuery: "",
  tierFilter: "ALL",
  regionFilter: "ALL",
  datasetScope: "normal",
  selectedRecord: null,
  lastExport: null,

  setActiveStep: (step) => set({ activeStep: step }),
  setPaletteMode: (mode) => set({ paletteMode: mode }),
  togglePaletteMode: () =>
    set((s) => ({
      paletteMode: s.paletteMode === "soft" ? "classic" : "soft",
      toastMessage:
        s.paletteMode === "soft"
          ? "已切换为「经典财务预警色」模式"
          : "已切换为「柔和预警色」模式",
    })),
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode;
      applyDarkModeDOM(next);
      return { darkMode: next };
    }),
  openRuleModal: () => set({ isRuleModalOpen: true }),
  closeRuleModal: () => set({ isRuleModalOpen: false }),
  openAIPanel: () => {
    void get().syncChatHistory();
    set({ isAIPanelOpen: true });
  },
  closeAIPanel: () => set({ isAIPanelOpen: false }),
  toggleAIPanel: () => {
    const next = !get().isAIPanelOpen;
    if (next) {
      void get().syncChatHistory();
    }
    set({ isAIPanelOpen: next });
  },
  openAISettings: () => set({ isAISettingsOpen: true }),
  closeAISettings: () => set({ isAISettingsOpen: false }),
  openReportModal: () => set({ isReportModalOpen: true }),
  closeReportModal: () => set({ isReportModalOpen: false }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTierFilter: (tierFilter) => set({ tierFilter }),
  setRegionFilter: (regionFilter) => set({ regionFilter }),
  setDatasetScope: (datasetScope) => set({ datasetScope }),
  setSelectedRecord: (selectedRecord) => set({ selectedRecord }),
  clearToast: () => set({ toastMessage: null }),

  initApp: async () => {
    const isDark = getInitialDarkMode();
    applyDarkModeDOM(isDark);
    set({ darkMode: isDark });
    if (!isMyGo()) {
      set({
        error: "当前运行在浏览器预览模式，请通过桌面端运行以启用Go内核计算能力。",
      });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      let data = await SmartARService.getCurrentPipelineResult();
      if (!data) {
        data = await SmartARService.loadBuiltInSample(get().asOfDate);
      }
      const sys = await SmartARService.getSystemInfo();
      set({
        systemInfo: sys,
        pipelineData: data,
        isLoading: false,
      });
      void get().fetchAIConfig();
      void get().syncChatHistory();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },

  loadSampleData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await SmartARService.loadBuiltInSample(get().asOfDate);
      set({
        pipelineData: data,
        isLoading: false,
        toastMessage: `已载入内置样本《应收账款明细表_原始数据.xlsx》（耗时${data?.durationMs.toFixed(1)}ms）`,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },

  openFileWithDialog: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await SmartARService.openAndProcessFile(get().asOfDate);
      if (data) {
        set({
          pipelineData: data,
          isLoading: false,
          toastMessage: `已导入并完成5步清洗《${data.sourceFileName}》（耗时${data.durationMs.toFixed(1)}ms）`,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },

  loadFromFilePath: async (filePath: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await SmartARService.processFileFromPath(filePath, get().asOfDate);
      if (data) {
        set({
          pipelineData: data,
          isLoading: false,
          toastMessage: `拖拽导入成功：《${data.sourceFileName}》（有效明细${data.normalCount}笔+挂起${data.totalSuspended}笔）`,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },

  loadFromBrowserFile: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const b64 = btoa(binary);
      const data = await SmartARService.processFileFromBase64(file.name, b64, get().asOfDate);
      if (data) {
        set({
          pipelineData: data,
          isLoading: false,
          toastMessage: `已解析并清洗《${data.sourceFileName}》（耗时${data.durationMs.toFixed(1)}ms）`,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },

  changeAsOfDate: async (newDate: string) => {
    set({ asOfDate: newDate, isLoading: true, error: null });
    try {
      const data = await SmartARService.recalculateWithDate(newDate);
      if (data) {
        set({
          pipelineData: data,
          isLoading: false,
          toastMessage: `已按新基准日[${newDate}]重算账龄与坏账准备（耗时${data.durationMs.toFixed(1)}ms）`,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },

  applyCustomRules: async (rules) => {
    set({ isLoading: true, error: null });
    try {
      const data = await SmartARService.recomputeWithCustomRules({
        asOfDate: get().asOfDate,
        imputationRules: rules.imputationRules,
        customerStandards: rules.customerStandards,
        tierConfigs: rules.tierConfigs,
      });
      if (data) {
        set({
          pipelineData: data,
          isLoading: false,
          isRuleModalOpen: false,
          toastMessage: `已应用自定义规则重算全表（耗时${data.durationMs.toFixed(1)}ms）`,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },

  resetCustomRules: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await SmartARService.resetToDefaultRules(get().asOfDate);
      if (data) {
        set({
          pipelineData: data,
          isLoading: false,
          isRuleModalOpen: false,
          toastMessage: "已恢复实训默认规则标准并完成重算",
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },

  exportWorkbook: async (quickMode = false) => {
    set({ isExporting: true, error: null });
    try {
      const { paletteMode, asOfDate } = get();
      const res = quickMode
        ? await SmartARService.quickExportToWorkspace(paletteMode, asOfDate)
        : await SmartARService.exportExcelReport(paletteMode, asOfDate);
      if (res) {
        set({
          lastExport: res,
          isExporting: false,
          toastMessage: `导出成功：${res.fileName}（共注入${res.formulaCnt}个Excel原生公式，耗时${res.durationMs.toFixed(1)}ms）`,
        });
      } else {
        set({ isExporting: false });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isExporting: false,
      });
    }
  },

  revealExportedFile: async (filePath: string) => {
    try {
      await SmartARService.revealFileInFolder(filePath);
    } catch {
      // ignore
    }
  },

  fetchAIConfig: async () => {
    try {
      const cfg = await SmartARService.getAIConfig();
      if (cfg) set({ aiConfig: cfg });
    } catch {
      // ignore
    }
  },

  saveAIConfig: async (cfg: AIConfig) => {
    try {
      await SmartARService.saveAIConfig(cfg);
      const reloaded = await SmartARService.getAIConfig();
      set({ aiConfig: reloaded || { ...cfg, apiKey: "", hasApiKey: true }, toastMessage: "AI模型配置已成功保存" });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  fetchModels: async () => {
    const cfg = get().aiConfig;
    if (!cfg) return [];
    try {
      const list = await SmartARService.fetchAIModels(cfg);
      return list || [];
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
      return [];
    }
  },

  addCustomModel: async (modelName: string) => {
    const trimmed = modelName.trim();
    if (!trimmed) return;
    const cfg = get().aiConfig;
    if (!cfg) return;
    const currentList = cfg.savedModels || [];
    if (!currentList.includes(trimmed)) {
      const updatedList = [...currentList, trimmed];
      const newCfg: AIConfig = { ...cfg, savedModels: updatedList, model: trimmed };
      await get().saveAIConfig(newCfg);
    } else {
      const newCfg: AIConfig = { ...cfg, model: trimmed };
      await get().saveAIConfig(newCfg);
    }
  },

  removeCustomModel: async (modelName: string) => {
    const cfg = get().aiConfig;
    if (!cfg) return;
    const currentList = cfg.savedModels || [];
    const updatedList = currentList.filter((m) => m !== modelName);
    let nextActiveModel = cfg.model;
    if (nextActiveModel === modelName) {
      nextActiveModel = updatedList[0] || "deepseek-chat";
    }
    const newCfg: AIConfig = { ...cfg, savedModels: updatedList, model: nextActiveModel };
    await get().saveAIConfig(newCfg);
  },

  setActiveModel: async (model: string) => {
    const cfg = get().aiConfig;
    if (!cfg) return;
    const newCfg: AIConfig = { ...cfg, model };
    await get().saveAIConfig(newCfg);
  },

  setReasoningEffort: async (effort: string) => {
    const cfg = get().aiConfig;
    if (!cfg) return;
    const newCfg: AIConfig = { ...cfg, reasoningEffort: effort };
    await get().saveAIConfig(newCfg);
  },

  openStandaloneWindow: async () => {
    try {
      const msgs = get().chatMessages;
      persistChatHistory(msgs);
      if (isMyGo()) {
        await SmartARService.saveChatHistory(msgs);
        await SmartARService.openStandaloneAIWindow(get().darkMode);
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  syncChatHistory: async () => {
    if (isMyGo()) {
      try {
        const backendHistory = await SmartARService.getChatHistory();
        if (backendHistory && backendHistory.length > 0) {
          set({ chatMessages: backendHistory });
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("smartar_chat_history", JSON.stringify(backendHistory));
            } catch {
              // ignore
            }
          }
          return;
        }
      } catch {
        // fallback
      }
    }
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("smartar_chat_history");
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            set({ chatMessages: parsed });
            if (isMyGo()) {
              SmartARService.saveChatHistory(parsed).catch(() => {});
            }
          }
        }
      } catch {
        // ignore
      }
    }
  },

  sendChatMessage: async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || get().isAIGenerating) return;

    const currentData = get().pipelineData;
    const slimSnapshot = currentData
      ? ({
          asOfDate: currentData.asOfDate,
          imputationRules: currentData.imputationRules,
          customerStandards: currentData.customerStandards,
          tierConfigs: currentData.tierConfigs,
        } as PipelineResult)
      : undefined;

    const userMsg: ChatMessage = {
      role: "user",
      content: trimmed,
      createdAt: new Date().toLocaleTimeString(),
      pipelineSnapshot: slimSnapshot,
    };

    const assistantMsgPlaceholder: ChatMessage = {
      role: "assistant",
      content: "",
      reasoningContent: "",
      createdAt: new Date().toLocaleTimeString(),
    };

    const newMsgs = [...get().chatMessages, userMsg, assistantMsgPlaceholder];
    set({
      chatMessages: newMsgs,
      isAIGenerating: true,
      aiCurrentTool: null,
    });
    persistChatHistory(newMsgs);

    try {
      const historyToSend = get().chatMessages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const ch = new Channel<StreamChunk>((chunk) => {
        if (!chunk) return;
        set((s) => {
          const msgs = [...s.chatMessages];
          const target = msgs[msgs.length - 1];
          if (!target || target.role !== "assistant") return s;

          if (chunk.type === "token" && chunk.content) {
            target.content += chunk.content;
          } else if (chunk.type === "reasoning" && chunk.content) {
            target.reasoningContent = (target.reasoningContent || "") + chunk.content;
          } else if (chunk.type === "tool_start") {
            return { chatMessages: msgs, aiCurrentTool: chunk.content || "正在调用财务工具..." };
          } else if (chunk.type === "tool_end") {
            return { chatMessages: msgs, aiCurrentTool: null };
          } else if (chunk.type === "proposal" && chunk.proposal) {
            target.proposal = chunk.proposal;
          } else if (chunk.type === "error" && chunk.content) {
            target.content += `\n\n> **执行提示**：${chunk.content}`;
          }
          return { chatMessages: msgs };
        });
      });

      await SmartARService.streamAIChat(historyToSend, ch);
    } catch (err) {
      set((s) => {
        const msgs = [...s.chatMessages];
        const target = msgs[msgs.length - 1];
        if (target && target.role === "assistant") {
          target.content += `\n\n> **请求异常**：${err instanceof Error ? err.message : String(err)}`;
        }
        return { chatMessages: msgs };
      });
    } finally {
      set({ isAIGenerating: false, aiCurrentTool: null });
      persistChatHistory(get().chatMessages);
    }
  },

  clearChat: () => {
    const defaultMsg: ChatMessage[] = [DEFAULT_WELCOME_MESSAGE];
    set({ chatMessages: defaultMsg });
    persistChatHistory(defaultMsg);
    if (isMyGo()) {
      SmartARService.clearChatHistory().catch(() => {});
    }
  },

  withdrawChatMessage: async (index: number) => {
    const msgs = get().chatMessages;
    if (index < 0 || index >= msgs.length) return;
    const targetMsg = msgs[index];
    if (!targetMsg) return;
    const newMsgs = msgs.slice(0, index);
    if (newMsgs.length === 0) {
      newMsgs.push(DEFAULT_WELCOME_MESSAGE);
    }

    if (targetMsg.pipelineSnapshot) {
      const snap = targetMsg.pipelineSnapshot;
      const current = get().pipelineData;
      const rulesChanged =
        !current ||
        JSON.stringify(snap.tierConfigs) !== JSON.stringify(current.tierConfigs) ||
        JSON.stringify(snap.imputationRules) !== JSON.stringify(current.imputationRules) ||
        JSON.stringify(snap.customerStandards) !== JSON.stringify(current.customerStandards);

      if (rulesChanged) {
        set({ isLoading: true });
        try {
          const opts: PipelineOptions = {
            asOfDate: snap.asOfDate,
            imputationRules: snap.imputationRules,
            customerStandards: snap.customerStandards,
            tierConfigs: snap.tierConfigs,
          };
          const recomputed = await SmartARService.recomputeWithCustomRules(opts);
          set({
            chatMessages: newMsgs,
            pipelineData: recomputed || snap,
            isLoading: false,
            toastMessage: "已撤回至该指令前，并已恢复财务治理规则与测算结果",
          });
          persistChatHistory(newMsgs);
          return;
        } catch (err) {
          console.error("Failed to rollback rules:", err);
        }
      }
    }

    set({
      chatMessages: newMsgs,
      toastMessage: "已撤回至该指令发送前状态",
    });
    persistChatHistory(newMsgs);
  },

  generateAuditReport: async (focus = "comprehensive") => {
    set({ isGeneratingReport: true, isReportModalOpen: true, error: null });
    let liveMarkdown = "";

    try {
      const ch = new Channel<StreamChunk>((chunk) => {
        if (!chunk) return;
        if (chunk.type === "token" && chunk.content) {
          liveMarkdown += chunk.content;
          set({
            auditReport: {
              markdownContent: liveMarkdown,
              executiveSummary: "正在实时流式撰写审计管理报告...",
              createdAt: new Date().toLocaleTimeString(),
            },
          });
        }
      });

      const res = await SmartARService.streamAuditReport(
        { focus, includeRecommendations: true },
        ch
      );
      if (res) {
        set({ auditReport: res, isGeneratingReport: false });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isGeneratingReport: false,
      });
    } finally {
      set({ isGeneratingReport: false });
    }
  },

  approveProposal: async (proposalId: string) => {
    set({ isLoading: true });
    try {
      const res = await SmartARService.applyAIProposal(proposalId);
      if (res) {
        set((s) => {
          const updatedMessages = s.chatMessages.map((m) => {
            if (m.proposal && m.proposal.proposalId === proposalId) {
              return {
                ...m,
                proposal: { ...m.proposal, status: "approved" },
              };
            }
            return m;
          });
          persistChatHistory(updatedMessages);
          return {
            pipelineData: res,
            chatMessages: updatedMessages,
            isLoading: false,
            toastMessage: "已成功批准并应用AI规则提案，全表已完成重新测算",
          };
        });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      });
    }
  },

  rejectProposal: async (proposalId: string) => {
    try {
      await SmartARService.rejectAIProposal(proposalId);
      set((s) => {
        const updatedMessages = s.chatMessages.map((m) => {
          if (m.proposal && m.proposal.proposalId === proposalId) {
            return {
              ...m,
              proposal: { ...m.proposal, status: "rejected" },
            };
          }
          return m;
        });
        persistChatHistory(updatedMessages);
        return {
          chatMessages: updatedMessages,
          toastMessage: "已放弃该规则变更提案。",
        };
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },
}));

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "smartar-dark-mode" && e.newValue !== null) {
      const isDark = e.newValue === "1";
      applyDarkModeDOM(isDark);
      useSmartARStore.setState({ darkMode: isDark });
    } else if (e.key === "smartar_chat_history" && e.newValue) {
      try {
        const msgs = JSON.parse(e.newValue);
        if (Array.isArray(msgs) && msgs.length > 0) {
          if (!useSmartARStore.getState().isAIGenerating) {
            useSmartARStore.setState({ chatMessages: msgs });
          }
        }
      } catch {
        // ignore
      }
    }
  });
}
