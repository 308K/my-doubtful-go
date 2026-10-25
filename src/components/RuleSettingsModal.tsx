// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React, { useState, useEffect } from "react";
import { useSmartARStore } from "../store";
import { SmartARService } from "../mygo";
import type { CustomerStandard, ImputationConfig, TierConfig } from "../mygo";
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Search,
  FileText,
  Users,
  ShieldCheck,
} from "lucide-react";

export const RuleSettingsModal: React.FC = () => {
  const {
    isRuleModalOpen,
    closeRuleModal,
    pipelineData,
    applyCustomRules,
    resetCustomRules,
    isLoading,
  } = useSmartARStore();

  const [activeTab, setActiveTab] = useState<"imputation" | "customers" | "tiers">("imputation");

  // Local editing states
  const [imputation, setImputation] = useState<ImputationConfig>({
    termStrategy: "mode",
    termFallbackDays: 60,
    defaultCreditLevel: "B",
    overdueGraceDays: 0,
    lowAmountOutlierThreshold: 20000,
  });

  const [customers, setCustomers] = useState<CustomerStandard[]>([]);
  const [custSearch, setCustSearch] = useState("");

  const [tiers, setTiers] = useState<TierConfig[]>([]);

  // Sync from pipelineData when modal opens
  useEffect(() => {
    if (isRuleModalOpen) {
      if (pipelineData?.imputationRules) {
        setImputation({ ...pipelineData.imputationRules });
      }
      if (pipelineData?.customerStandards) {
        setCustomers(pipelineData.customerStandards.map((c) => ({ ...c, aliases: [...c.aliases] })));
      }
      if (pipelineData?.tierConfigs) {
        setTiers(pipelineData.tierConfigs.map((t) => ({ ...t })));
      }
    }
  }, [isRuleModalOpen, pipelineData]);

  if (!isRuleModalOpen) return null;

  // Filtered customer list
  const filteredCustomers = customers.filter((c) => {
    const q = custSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q) ||
      c.credit.toLowerCase().includes(q) ||
      c.aliases.some((a) => a.toLowerCase().includes(q))
    );
  });

  // Reset to default baseline from Go backend
  const handleResetToBaseline = async () => {
    try {
      const def = await SmartARService.getDefaultRulePackage();
      setImputation(def.imputationRules);
      setCustomers(def.customerStandards.map((c) => ({ ...c, aliases: [...c.aliases] })));
      setTiers(def.tierConfigs.map((t) => ({ ...t })));
    } catch {
      // Fallback
    }
  };

  // Customer handlers
  const handleAddCustomer = () => {
    const newCode = `CUST${String(customers.length + 1).padStart(3, "0")}`;
    setCustomers([
      ...customers,
      {
        code: newCode,
        name: "新客户名称",
        region: "华东区",
        credit: "B",
        aliases: [],
      },
    ]);
  };

  const handleUpdateCustomer = (index: number, patch: Partial<CustomerStandard>) => {
    setCustomers(customers.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const handleDeleteCustomer = (index: number) => {
    setCustomers(customers.filter((_, i) => i !== index));
  };

  // Tier handlers
  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const maxDays = lastTier ? lastTier.maxDays + 90 : 30;
    const newTier: TierConfig = {
      name: `${maxDays}天以上`,
      minDays: lastTier ? lastTier.maxDays + 1 : 0,
      maxDays: maxDays,
      rangeText: `> ${maxDays}天`,
      rate: 0.1,
      classicLevel: "黄色",
      mygoLevel: "审慎",
      character: lastTier?.character ?? "灯",
      colorHex: lastTier?.colorHex ?? "#EAB308",
      softTintHex: lastTier?.softTintHex ?? "#FEF08A",
      textColorHex: lastTier?.textColorHex ?? "#854D0E",
      excelFillHex: lastTier?.excelFillHex ?? "FFF9E6",
      excelFontHex: lastTier?.excelFontHex ?? "B28900",
      metaphor: "审慎评估",
      suggestedAction: "重点跟进催收",
    };
    setTiers([...tiers, newTier]);
  };

  const handleUpdateTier = (index: number, patch: Partial<TierConfig>) => {
    setTiers(tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const handleDeleteTier = (index: number) => {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleSaveAndRecompute = async () => {
    await applyCustomRules({
      imputationRules: imputation,
      customerStandards: customers,
      tierConfigs: tiers,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <SlidersHorizontal className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                业务规则与主数据配置
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                自定义缺失值填充策略、客户主数据字典映射、坏账计提比例与五级风险预警标准
              </p>
            </div>
          </div>
          <button
            onClick={closeRuleModal}
            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 gap-6 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            onClick={() => setActiveTab("imputation")}
            className={`py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "imputation"
                ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            缺失值填充与离群规则
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "customers"
                ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Users className="w-4 h-4" />
            客户主数据字典 ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab("tiers")}
            className={`py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "tiers"
                ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            坏账计提与预警阶梯 ({tiers.length}档)
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-zinc-900">
          {/* TAB 1: 缺失值填充与离群规则 */}
          {activeTab === "imputation" && (
            <div className="space-y-6 max-w-3xl">
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  账期缺失推导策略 (Credit Term Imputation)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                      imputation.termStrategy === "mode"
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800/90"
                        : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/30 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="termStrategy"
                      checked={imputation.termStrategy === "mode"}
                      onChange={() => setImputation({ ...imputation, termStrategy: "mode" })}
                      className="mt-0.5 accent-zinc-900 dark:accent-zinc-100"
                    />
                    <div>
                      <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        众数统计优先 (推荐)
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        自动提取当前有效明细表中出现频次最高的账期值（实训样本为60天）填补缺失；如未收敛则使用保底天数。
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                      imputation.termStrategy === "fixed"
                        ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800/90"
                        : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/30 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="termStrategy"
                      checked={imputation.termStrategy === "fixed"}
                      onChange={() => setImputation({ ...imputation, termStrategy: "fixed" })}
                      className="mt-0.5 accent-zinc-900 dark:accent-zinc-100"
                    />
                    <div>
                      <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        固定默认账期
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        无论数据分布如何，凡是账期为空的记录，一律按右侧保底天数直接强制赋值。
                      </div>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      保底缺省账期 (天)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={3650}
                      value={imputation.termFallbackDays}
                      onChange={(e) =>
                        setImputation({
                          ...imputation,
                          termFallbackDays: Math.max(1, parseInt(e.target.value, 10) || 60),
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                    />
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">行业基准通常为30天、60天或90天</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      逾期判定宽限期 (天)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={imputation.overdueGraceDays}
                      onChange={(e) =>
                        setImputation({
                          ...imputation,
                          overdueGraceDays: Math.max(0, parseInt(e.target.value, 10) || 0),
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                    />
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">宽限期内即使逾期仍视为正常（实训要求0天）</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  信用等级与异常隔离阈值 (Credit & Anomaly Thresholds)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      默认兜底信用等级
                    </label>
                    <select
                      value={imputation.defaultCreditLevel}
                      onChange={(e) =>
                        setImputation({
                          ...imputation,
                          defaultCreditLevel: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                    >
                      <option value="A" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">A级 (优质/极低违约风险)</option>
                      <option value="B" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">B级 (良好/标准商业信用 - 实训默认)</option>
                      <option value="C" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">C级 (一般/审慎管控)</option>
                      <option value="D" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">D级 (较差/高危预警)</option>
                    </select>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">主数据字典与明细表均缺失时采用的兜底信用</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      离群小额异常隔离阈值 (元)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      min={0}
                      value={imputation.lowAmountOutlierThreshold}
                      onChange={(e) =>
                        setImputation({
                          ...imputation,
                          lowAmountOutlierThreshold: Math.max(0, parseFloat(e.target.value) || 20000),
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                    />
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      未收余额低于该金额的离群异常将被单独隔离至挂起清单（实训标准20,000元）
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 客户主数据字典 */}
          {activeTab === "customers" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="按编码、名称、区域、别名检索..."
                    value={custSearch}
                    onChange={(e) => setCustSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddCustomer}
                    className="px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加标准客户
                  </button>
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-700">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold w-24">标准编码</th>
                        <th className="px-3 py-2.5 font-semibold w-64">标准客户名称</th>
                        <th className="px-3 py-2.5 font-semibold w-28">所属区域</th>
                        <th className="px-3 py-2.5 font-semibold w-24">信用等级</th>
                        <th className="px-3 py-2.5 font-semibold">历史别名/原始表写法 (逗号或顿号隔开)</th>
                        <th className="px-3 py-2.5 font-semibold w-14 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-900 dark:text-zinc-100">
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-zinc-400 dark:text-zinc-500">
                            未找到匹配的标准客户记录
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((cust, idx) => {
                          const realIdx = customers.findIndex((c) => c.code === cust.code);
                          return (
                            <tr key={cust.code || idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={cust.code}
                                  onChange={(e) => handleUpdateCustomer(realIdx, { code: e.target.value })}
                                  className="w-full px-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white font-mono text-xs bg-transparent text-zinc-900 dark:text-zinc-100"
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={cust.name}
                                  onChange={(e) => handleUpdateCustomer(realIdx, { name: e.target.value })}
                                  className="w-full px-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white font-medium text-xs bg-transparent text-zinc-900 dark:text-zinc-100"
                                />
                              </td>
                              <td className="p-1.5">
                                <select
                                  value={cust.region}
                                  onChange={(e) => handleUpdateCustomer(realIdx, { region: e.target.value })}
                                  className="w-full px-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white text-xs bg-transparent text-zinc-900 dark:text-zinc-100"
                                >
                                  <option value="华东区" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">华东区</option>
                                  <option value="华南区" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">华南区</option>
                                  <option value="华北区" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">华北区</option>
                                  <option value="西南区" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">西南区</option>
                                  <option value="华中区" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">华中区</option>
                                  <option value="西北区" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">西北区</option>
                                  <option value="东北区" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">东北区</option>
                                </select>
                              </td>
                              <td className="p-1.5">
                                <select
                                  value={cust.credit}
                                  onChange={(e) => handleUpdateCustomer(realIdx, { credit: e.target.value })}
                                  className="w-full px-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white text-xs font-mono font-semibold bg-transparent text-zinc-900 dark:text-zinc-100"
                                >
                                  <option value="A" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">A</option>
                                  <option value="B" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">B</option>
                                  <option value="C" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">C</option>
                                  <option value="D" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">D</option>
                                </select>
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={cust.aliases.join("、")}
                                  placeholder="如: 华东数控、华东机床"
                                  onChange={(e) =>
                                    handleUpdateCustomer(realIdx, {
                                      aliases: e.target.value
                                        .split(/[,，、]/)
                                        .map((s) => s.trim())
                                        .filter(Boolean),
                                    })
                                  }
                                  className="w-full px-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white text-xs text-zinc-700 dark:text-zinc-300 bg-transparent"
                                />
                              </td>
                              <td className="p-1.5 text-center">
                                <button
                                  onClick={() => handleDeleteCustomer(realIdx)}
                                  className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                  title="删除此客户"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 坏账计提与预警阶梯 */}
          {activeTab === "tiers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  支持自定义各账龄天数门槛、计提比例、双色卡预警等级与管控处置建议。导出Excel将自动注入匹配的嵌套IF与VLOOKUP公式。
                </p>
                <button
                  onClick={handleAddTier}
                  className="px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加账龄档位
                </button>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-700">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold w-28">区间名称</th>
                        <th className="px-3 py-2.5 font-semibold w-24">上限天数</th>
                        <th className="px-3 py-2.5 font-semibold w-28">范围说明</th>
                        <th className="px-3 py-2.5 font-semibold w-24">计提比例(%)</th>
                        <th className="px-3 py-2.5 font-semibold w-24">经典预警色</th>
                        <th className="px-3 py-2.5 font-semibold w-24">柔和预警色</th>
                        <th className="px-3 py-2.5 font-semibold">建议管控措施</th>
                        <th className="px-3 py-2.5 font-semibold w-14 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-900 dark:text-zinc-100">
                      {tiers.map((tc, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={tc.name}
                              onChange={(e) => handleUpdateTier(idx, { name: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white font-medium text-xs bg-transparent text-zinc-900 dark:text-zinc-100"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="number"
                              value={tc.maxDays}
                              onChange={(e) => handleUpdateTier(idx, { maxDays: parseInt(e.target.value, 10) || 0 })}
                              className="w-full px-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white font-mono text-xs bg-transparent text-zinc-900 dark:text-zinc-100"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={tc.rangeText}
                              onChange={(e) => handleUpdateTier(idx, { rangeText: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white text-xs bg-transparent text-zinc-900 dark:text-zinc-100"
                            />
                          </td>
                          <td className="p-1.5">
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={(tc.rate * 100).toFixed(1)}
                                onChange={(e) => handleUpdateTier(idx, { rate: (parseFloat(e.target.value) || 0) / 100 })}
                                className="w-full pr-5 pl-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white font-mono text-xs bg-transparent text-zinc-900 dark:text-zinc-100"
                              />
                              <span className="absolute right-2 text-zinc-400 dark:text-zinc-500 text-[11px] pointer-events-none">%</span>
                            </div>
                          </td>
                          <td className="p-1.5">
                            <select
                              value={tc.classicLevel}
                              onChange={(e) => handleUpdateTier(idx, { classicLevel: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white text-xs bg-transparent text-zinc-900 dark:text-zinc-100"
                            >
                              <option value="无" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">无</option>
                              <option value="蓝色" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">蓝色</option>
                              <option value="黄色" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">黄色</option>
                              <option value="橙色" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">橙色</option>
                              <option value="红色" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">红色</option>
                            </select>
                          </td>
                          <td className="p-1.5">
                            <select
                              value={tc.mygoLevel}
                              onChange={(e) => handleUpdateTier(idx, { mygoLevel: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white text-xs bg-transparent text-zinc-900 dark:text-zinc-100"
                            >
                              <option value="正常" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">正常</option>
                              <option value="关注" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">关注</option>
                              <option value="审慎" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">审慎</option>
                              <option value="严控" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">严控</option>
                              <option value="高危" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">高危</option>
                            </select>
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={tc.suggestedAction}
                              onChange={(e) => handleUpdateTier(idx, { suggestedAction: e.target.value })}
                              className="w-full px-2 py-1 rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white text-xs text-zinc-700 dark:text-zinc-300 bg-transparent"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              onClick={() => handleDeleteTier(idx)}
                              disabled={tiers.length <= 1}
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                tiers.length <= 1
                                  ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                                  : "text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              }`}
                              title="删除此阶梯"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
          <button
            onClick={handleResetToBaseline}
            className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重置为实训基准标准
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={closeRuleModal}
              className="px-4 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              disabled={isLoading}
              onClick={() => void handleSaveAndRecompute()}
              className="px-4 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              保存并重新计算全表
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
