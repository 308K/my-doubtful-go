// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

import React, { useState } from "react";
import { X, ShieldCheck, ExternalLink, Code2, Layers } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface DepItem {
  name: string;
  category: "Go后端" | "前端与UI";
  license: string;
  copyright: string;
  url: string;
}

const DEPENDENCIES: DepItem[] = [
  { name: "github.com/openai/openai-go", category: "Go后端", license: "Apache-2.0", copyright: "Copyright (c) 2024 OpenAI", url: "https://github.com/openai/openai-go" },
  { name: "github.com/xuri/excelize/v2", category: "Go后端", license: "BSD-3-Clause", copyright: "Copyright (c) 2016-2026 The Excelize Authors", url: "https://github.com/xuri/excelize" },
  { name: "github.com/tidwall/gjson", category: "Go后端", license: "MIT", copyright: "Copyright (c) 2016-2026 Josh Baker", url: "https://github.com/tidwall/gjson" },
  { name: "github.com/ebitengine/purego", category: "Go后端", license: "Apache-2.0", copyright: "Copyright 2022 Ebitengine Authors", url: "https://github.com/ebitengine/purego" },
  { name: "github.com/tiendc/go-deepcopy", category: "Go后端", license: "Apache-2.0", copyright: "Copyright (c) 2023 Tien Do", url: "https://github.com/tiendc/go-deepcopy" },
  { name: "github.com/richardlehane/mscfb", category: "Go后端", license: "BSD-3-Clause", copyright: "Copyright (c) 2014 Richard Lehane", url: "https://github.com/richardlehane/mscfb" },
  { name: "golang.org/x/crypto", category: "Go后端", license: "BSD-3-Clause", copyright: "Copyright (c) 2009 The Go Authors", url: "https://go.dev" },
  { name: "React / React DOM", category: "前端与UI", license: "MIT", copyright: "Copyright (c) Meta Platforms, Inc. and affiliates", url: "https://react.dev" },
  { name: "@tanstack/react-table", category: "前端与UI", license: "MIT", copyright: "Copyright (c) 2016-present Tanner Linsley", url: "https://tanstack.com/table" },
  { name: "lucide-react", category: "前端与UI", license: "ISC", copyright: "Copyright (c) 2022-present Lucide Contributors", url: "https://lucide.dev" },
  { name: "tailwindcss", category: "前端与UI", license: "MIT", copyright: "Copyright (c) Tailwind Labs, Inc.", url: "https://tailwindcss.com" },
  { name: "zustand", category: "前端与UI", license: "MIT", copyright: "Copyright (c) 2019 Paul Henschel", url: "https://github.com/pmndrs/zustand" },
  { name: "TypeScript", category: "前端与UI", license: "Apache-2.0", copyright: "Copyright (c) Microsoft Corporation", url: "https://www.typescriptlang.org" },
  { name: "Vite", category: "前端与UI", license: "MIT", copyright: "Copyright (c) 2019-present Evan You & Vite Contributors", url: "https://vitejs.dev" },
];

export const OpenSourceLicensesModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"deps" | "texts">("deps");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                开源许可证与第三方声明
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                SmartAR 遵循 MPL-2.0 开源协议，并严格遵从所有第三方依赖的开源授权条款
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
          <button
            onClick={() => setActiveTab("deps")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "deps"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            第三方依赖清单 ({DEPENDENCIES.length})
          </button>
          <button
            onClick={() => setActiveTab("texts")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "texts"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            许可证核心条款 (MPL-2.0 / Apache-2.0 / BSD / MIT)
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "deps" ? (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                本项目采用完全开放且合规的开源工程标准，在此对所有为开源社区做出贡献的作者与团队致以崇高敬意。以下为软件构建与运行时所引用的核心第三方开源模块：
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                {DEPENDENCIES.map((dep, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white dark:bg-zinc-900 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {dep.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                          {dep.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                        {dep.copyright}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200">
                        {dep.license}
                      </span>
                      <a
                        href={dep.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                        title="访问源码仓库"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-1.5">
                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                  Mozilla Public License Version 2.0 (MPL-2.0)
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                  本项目主程序基于 MPL-2.0 授权。任何对本仓库现有源文件的直接修改与再分发均须以 MPL-2.0 开源并保留原作者版权声明；与其它模块组合时允许作为较大工程进行分发。
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-1.5">
                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                  Apache License Version 2.0
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                  适用于 openai-go、purego、TypeScript 等组件。允许商业使用、修改与分发，分发时保留原著作权声明、许可证副本及修改说明。
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-1.5">
                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                  BSD 3-Clause License
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                  适用于 excelize/v2 及其底层套件。在源码与二进制分发时，必须完整重现版权所有者声明、条件列表及免责声明，且不得擅自使用版权方名义进行背书。
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-1.5">
                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                  MIT / ISC License
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                  适用于 React、TanStack Table、Lucide、Tailwind CSS、Zustand、gjson 等基础组件。允许任何目的的使用与修改，分发时保留版权声明即可。
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            完整协议声明见仓库根目录 OPEN_SOURCE_LICENSES.md
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
