// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React, { useEffect, useState } from "react";
import {
  X,
  Bot,
  Key,
  Globe,
  Cpu,
  Shield,
  Check,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { useSmartARStore } from "../store";
import { SmartARService, type AIConfig } from "../mygo";

const PROVIDER_PRESETS: Record<
  string,
  { name: string; baseUrl: string; model: string }
> = {
  deepseek: {
    name: "DeepSeek (深度求索 · 推荐)",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  },
  volcengine: {
    name: "火山方舟 (Volcengine Ark)",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    model: "doubao-1.5-pro-32k",
  },
  ollama: {
    name: "Ollama (本地离线私有化部署)",
    baseUrl: "http://localhost:11434/v1",
    model: "qwen2.5:7b",
  },
  qwen: {
    name: "通义千问 (阿里云DashScope)",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
  },
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  custom: {
    name: "自定义OpenAI兼容接口",
    baseUrl: "http://localhost:8000/v1",
    model: "custom-model",
  },
};

export const AISettingsModal: React.FC = () => {
  const { isAISettingsOpen, closeAISettings, aiConfig, saveAIConfig, fetchModels } =
    useSmartARStore();

  const [provider, setProvider] = useState<string>("deepseek");
  const [baseUrl, setBaseUrl] = useState<string>("https://api.deepseek.com/v1");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [model, setModel] = useState<string>("deepseek-chat");
  const [savedModels, setSavedModels] = useState<string[]>([
    "deepseek-chat",
    "deepseek-reasoner",
  ]);
  const [newModelInput, setNewModelInput] = useState<string>("");
  const [modelSearch, setModelSearch] = useState<string>("");
  const [isFetchingModels, setIsFetchingModels] = useState<boolean>(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [anonymize, setAnonymize] = useState<boolean>(false);


  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    msg: string;
  } | null>(null);

  useEffect(() => {
    if (aiConfig) {
      setProvider(aiConfig.provider || "deepseek");
      setBaseUrl(aiConfig.baseUrl || "https://api.deepseek.com/v1");
      setApiKeyInput("");
      setModel(aiConfig.model || "deepseek-chat");
      setSavedModels(
        aiConfig.savedModels && aiConfig.savedModels.length > 0
          ? aiConfig.savedModels
          : ["deepseek-chat", "deepseek-reasoner"]
      );
      setAnonymize(!!aiConfig.anonymize);
      setTestResult(null);
    }
  }, [aiConfig, isAISettingsOpen]);

  if (!isAISettingsOpen) return null;

  const handleProviderChange = (p: string) => {
    setProvider(p);
    const preset = PROVIDER_PRESETS[p];
    if (preset) {
      setBaseUrl(preset.baseUrl);
      setModel(preset.model);
      if (!savedModels.includes(preset.model)) {
        setSavedModels((prev) => [preset.model, ...prev]);
      }
    }
    setTestResult(null);
  };

  const handleFetchModels = async () => {
    setIsFetchingModels(true);
    setTestResult(null);
    try {
      const probeCfg: AIConfig = {
        provider,
        baseUrl: baseUrl.trim(),
        apiKey: apiKeyInput.trim(),
        hasApiKey: !!aiConfig?.hasApiKey,
        model: model.trim(),
        reasoningEffort: aiConfig?.reasoningEffort || "medium",
        savedModels,
        anonymize,
      };
      const models = await SmartARService.fetchAIModels(probeCfg);
      if (models && models.length > 0) {
        setFetchedModels(models);
        // Merge into saved models
        const combined = Array.from(new Set([...savedModels, ...models]));
        setSavedModels(combined);
        setTestResult({
          success: true,
          msg: `成功获取到${models.length}个可用模型`,
        });
      } else {
        setTestResult({
          success: false,
          msg: "未返回任何可用模型，请手动输入添加",
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        msg: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleAddCustomModel = () => {
    const trimmed = newModelInput.trim();
    if (!trimmed) return;
    if (!savedModels.includes(trimmed)) {
      setSavedModels((prev) => [...prev, trimmed]);
    }
    setModel(trimmed);
    setNewModelInput("");
  };

  const handleRemoveModel = (m: string) => {
    const filtered = savedModels.filter((item) => item !== m);
    setSavedModels(filtered);
    if (model === m) {
      setModel(filtered[0] || "");
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const cfg: AIConfig = {
        provider,
        baseUrl: baseUrl.trim(),
        apiKey: apiKeyInput.trim(),
        hasApiKey: !!aiConfig?.hasApiKey,
        model: model.trim(),
        reasoningEffort: aiConfig?.reasoningEffort || "medium",
        savedModels,
        anonymize,
      };
      const res = await SmartARService.testAIConnection(cfg);
      setTestResult({ success: true, msg: res });
    } catch (err) {
      setTestResult({
        success: false,
        msg: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    const currentList = Array.from(new Set([...savedModels, model.trim()])).filter(Boolean);
    await saveAIConfig({
      provider,
      baseUrl: baseUrl.trim(),
      apiKey: apiKeyInput.trim(),
      hasApiKey: !!aiConfig?.hasApiKey || !!apiKeyInput.trim(),
      model: model.trim(),
      reasoningEffort: aiConfig?.reasoningEffort || "medium",
      savedModels: currentList,
      anonymize,
    });
    closeAISettings();
  };

  const displayedModels = savedModels.filter((m) =>
    m.toLowerCase().includes(modelSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                AI大模型服务与密钥配置
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                配置所连接的大模型端点、思考参数与脱敏保护规则
              </p>
            </div>
          </div>
          <button
            onClick={closeAISettings}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Provider Preset */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              模型服务商与预设 (Provider)
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all"
            >
              {Object.entries(PROVIDER_PRESETS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Base URL */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              API基础接口地址 (Base URL)
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.deepseek.com/v1"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-zinc-400" />
                API访问密钥 (API Key)
              </span>
              <span className="text-[11px] font-normal text-zinc-400">
                {provider === "ollama" ? "本地部署无需填写" : "保存在本机专属目录"}
              </span>
            </label>
            <div>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={
                  aiConfig?.hasApiKey
                    ? "已安全保存 (输入新Key以覆盖更新)"
                    : provider === "ollama"
                    ? "ollama (选填)"
                    : "输入API Key，如sk-..."
                }
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all"
              />
              {aiConfig?.hasApiKey ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>凭据已安全保存在本地（已脱敏隐藏，不可回显）</span>
                </div>
              ) : (
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                  {provider === "ollama"
                    ? "本地模型服务通常无需API Key认证"
                    : "初次使用请输入服务商提供的API Key进行鉴权"}
                </div>
              )}
            </div>
          </div>

          {/* Model Management */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                当前生效模型 (Active Model)
              </label>
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={isFetchingModels}
                className="flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isFetchingModels ? "animate-spin" : ""}`} />
                从API获取模型列表
              </button>
            </div>

            {/* Current Selected Model Display & Selection */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="输入或选择模型标识，如deepseek-chat"
                className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all"
              />
            </div>

            {/* Model List & Search Box */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>可用模型库 ({savedModels.length})</span>
                <div className="relative w-36">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="过滤模型..."
                    className="w-full pl-6 pr-2 py-1 text-[11px] font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Scrollable Model Chips */}
              <div className="max-h-28 overflow-y-auto flex flex-wrap gap-1.5 p-1">
                {displayedModels.map((m) => {
                  const isSelected = model === m;
                  return (
                    <div
                      key={m}
                      onClick={() => setModel(m)}
                      className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs"
                          : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500"
                      }`}
                    >
                      <span>{m}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveModel(m);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity ml-1"
                        title="删除该模型"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Model Row */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-200 dark:border-zinc-700/60">
                <input
                  type="text"
                  value={newModelInput}
                  onChange={(e) => setNewModelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomModel();
                    }
                  }}
                  placeholder="手动添加新模型标识，如ep-20250220-xxxx"
                  className="flex-1 px-2.5 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomModel}
                  disabled={!newModelInput.trim()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 transition-colors disabled:opacity-40"
                >
                  <Plus className="w-3 h-3" />
                  添加
                </button>
              </div>
            </div>
          </div>

          {/* Data Privacy Toggle */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div
              onClick={() => setAnonymize(!anonymize)}
              className="flex items-center justify-between cursor-pointer p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100/80 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    客户全称脱敏 (Data Anonymization)
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    向外部大模型发送前自动将真实客户名称掩码为虚拟代码，结果在本地还原
                  </div>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={anonymize}
                onClick={(e) => {
                  e.stopPropagation();
                  setAnonymize(!anonymize);
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  anonymize
                    ? "bg-zinc-900 dark:bg-zinc-100"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-sm ring-0 transition duration-200 ease-in-out ${
                    anonymize
                      ? "translate-x-4 bg-white dark:bg-zinc-900"
                      : "translate-x-0 bg-white dark:bg-zinc-400"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Connectivity Test Feedback Banner */}
          {testResult && (
            <div
              className={`flex items-start gap-2.5 p-3 rounded-lg text-xs border ${
                testResult.success
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-mono break-all leading-relaxed">{testResult.msg}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
            {isTesting ? "正在测试连通性..." : "测试连接并测速"}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeAISettings}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
