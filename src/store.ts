// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import { create } from "zustand";
import { isMyGo } from "mygo-runtime";
import {
  SmartARService,
  type ARRecord,
  type ExportResult,
  type PipelineResult,
  type SystemInfo,
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
  exportWorkbook: (quickMode?: boolean) => Promise<void>;
  revealExportedFile: (filePath: string) => Promise<void>;
}

export const useSmartARStore = create<SmartARState>((set, get) => ({
  activeStep: 4,
  pipelineData: null,
  systemInfo: null,
  isLoading: false,
  isExporting: false,
  error: null,
  toastMessage: null,
  asOfDate: "2026-06-30",
  paletteMode: "mygo",
  darkMode: true,

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
      paletteMode: s.paletteMode === "mygo" ? "classic" : "mygo",
      toastMessage:
        s.paletteMode === "mygo"
          ? "已切换为「标准财务色卡」模式"
          : "已切换为「MyGO!!!!! 乐队五人代表色」潮流预警模式",
    })),
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode;
      document.documentElement.classList.toggle("dark", next);
      return { darkMode: next };
    }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTierFilter: (tierFilter) => set({ tierFilter }),
  setRegionFilter: (regionFilter) => set({ regionFilter }),
  setDatasetScope: (datasetScope) => set({ datasetScope }),
  setSelectedRecord: (selectedRecord) => set({ selectedRecord }),
  clearToast: () => set({ toastMessage: null }),

  initApp: async () => {
    document.documentElement.classList.add("dark");
    if (!isMyGo()) {
      set({
        error: "当前运行在浏览器预览模式，请通过 mygo dev 或编译后的桌面端运行以启用 Go 内核计算能力。",
      });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const [sys, data] = await Promise.all([
        SmartARService.getSystemInfo(),
        SmartARService.loadBuiltInSample(get().asOfDate),
      ]);
      set({
        systemInfo: sys,
        pipelineData: data,
        isLoading: false,
      });
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
        toastMessage: `已加载实训标准样本《应收账款明细表_原始数据.xlsx》（耗时 ${data?.durationMs.toFixed(1)} ms）`,
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
          toastMessage: `已导入并完成 5 步清洗《${data.sourceFileName}》（耗时 ${data.durationMs.toFixed(1)} ms）`,
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
          toastMessage: `拖拽导入成功：《${data.sourceFileName}》（有效明细 ${data.normalCount} 笔 + 挂起 ${data.totalSuspended} 笔）`,
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
          toastMessage: `已解析并清洗《${data.sourceFileName}》（耗时 ${data.durationMs.toFixed(1)} ms）`,
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
          toastMessage: `已按新基准日 [${newDate}] 全量重算账龄与坏账准备（耗时 ${data.durationMs.toFixed(1)} ms）`,
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
          toastMessage: `导出成功：${res.fileName}（共注入 ${res.formulaCnt} 个 Excel 原生公式，耗时 ${res.durationMs.toFixed(1)} ms）`,
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
}));
