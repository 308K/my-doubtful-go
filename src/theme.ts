// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

export type PaletteMode = "mygo" | "classic";

export interface RiskThemeItem {
  key: string;
  tierName: string;
  rangeText: string;
  rateText: string;
  name: string;
  classicName: string;
  character: string;
  roleTitle: string;
  instrument: string;
  color: string;
  classicColor: string;
  softTint: string;
  textColor: string;
  excelFill: string;
  excelFont: string;
  badgeClass: string;
  classicBadgeClass: string;
  cardBorderClass: string;
  metaphor: string;
}

/**
 * PRD Section 3.2: MyGO!!!!! 五人代表色与财务预警等级融合设计
 */
export const RISK_THEME_MYGO: Record<string, RiskThemeItem> = {
  NORMAL: {
    key: "NORMAL",
    tierName: "1个月以内",
    rangeText: "0 - 30 天",
    rateText: "1.0%",
    name: "正常",
    classicName: "无风险",
    character: "要乐奈",
    roleTitle: "Raana Kaname · 抹茶猫猫",
    instrument: "Lead Guitar",
    color: "#77DD77",
    classicColor: "#64748B",
    softTint: "#F0FDF4",
    textColor: "#15803D",
    excelFill: "#E2F0D9",
    excelFont: "#385723",
    badgeClass:
      "bg-[#77DD77]/15 text-[#1b5e20] dark:text-[#86efac] border-[#77DD77]/40 hover:bg-[#77DD77]/25",
    classicBadgeClass:
      "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
    cardBorderClass: "border-l-4 border-l-[#77DD77]",
    metaphor: "自由随性、健康无碍，资金流转顺畅",
  },
  BLUE: {
    key: "BLUE",
    tierName: "1-3个月",
    rangeText: "31 - 90 天",
    rateText: "5.0%",
    name: "关注",
    classicName: "蓝色预警",
    character: "高松灯",
    roleTitle: "Tomori Takamatsu · 创可贴主唱",
    instrument: "Vocal",
    color: "#77BBDD",
    classicColor: "#0284C7",
    softTint: "#F0F9FF",
    textColor: "#0369A1",
    excelFill: "#DDEBF7",
    excelFont: "#1F4E79",
    badgeClass:
      "bg-[#77BBDD]/15 text-[#0d47a1] dark:text-[#7dd3fc] border-[#77BBDD]/40 hover:bg-[#77BBDD]/25",
    classicBadgeClass:
      "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    cardBorderClass: "border-l-4 border-l-[#77BBDD]",
    metaphor: "心怀忐忑、声声呼唤，需要跟催回款",
  },
  YELLOW: {
    key: "YELLOW",
    tierName: "3-6个月",
    rangeText: "91 - 180 天",
    rateText: "20.0%",
    name: "审慎",
    classicName: "黄色预警",
    character: "长崎素世",
    roleTitle: "Soyo Nagasaki · 温柔贝斯",
    instrument: "Bass",
    color: "#FFDD88",
    classicColor: "#D97706",
    softTint: "#FEFCE8",
    textColor: "#A16207",
    excelFill: "#FFF2CC",
    excelFont: "#833C0C",
    badgeClass:
      "bg-[#FFDD88]/25 text-[#92400e] dark:text-[#fde047] border-[#FFDD88]/50 hover:bg-[#FFDD88]/35",
    classicBadgeClass:
      "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
    cardBorderClass: "border-l-4 border-l-[#FFDD88]",
    metaphor: "试图维系、对账函证，关注资金链状态",
  },
  PURPLE: {
    key: "PURPLE",
    tierName: "6-12个月",
    rangeText: "181 - 365 天",
    rateText: "50.0%",
    name: "严控",
    classicName: "橙色预警",
    character: "椎名立希",
    roleTitle: "Taki Shiina · 铁血鼓手",
    instrument: "Drums",
    color: "#7777AA",
    classicColor: "#EA580C",
    softTint: "#F5F3FF",
    textColor: "#5B21B6",
    excelFill: "#E4DFEC",
    excelFont: "#3B3838",
    badgeClass:
      "bg-[#7777AA]/20 text-[#4a148c] dark:text-[#c4b5fd] border-[#7777AA]/40 hover:bg-[#7777AA]/30",
    classicBadgeClass:
      "bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30",
    cardBorderClass: "border-l-4 border-l-[#7777AA]",
    metaphor: "压力骤增、严肃应对，专人重拳管控",
  },
  RED: {
    key: "RED",
    tierName: "1年以上",
    rangeText: "366 天以上",
    rateText: "100.0%",
    name: "高危",
    classicName: "红色预警",
    character: "千早爱音",
    roleTitle: "Anon Chihaya · 粉红焦点",
    instrument: "Rhythm Guitar",
    color: "#FF8899",
    classicColor: "#DC2626",
    softTint: "#FFF1F2",
    textColor: "#BE123C",
    excelFill: "#FCE4D6",
    excelFont: "#C00000",
    badgeClass:
      "bg-[#FF8899]/20 text-[#c2185b] dark:text-[#fda4af] border-[#FF8899]/50 font-bold hover:bg-[#FF8899]/30",
    classicBadgeClass:
      "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 font-bold",
    cardBorderClass: "border-l-4 border-l-[#FF8899]",
    metaphor: "醒目警报、法务出击，全额计提绝境破局",
  },
};

export const RISK_THEME_LIST: RiskThemeItem[] = [
  RISK_THEME_MYGO.NORMAL!,
  RISK_THEME_MYGO.BLUE!,
  RISK_THEME_MYGO.YELLOW!,
  RISK_THEME_MYGO.PURPLE!,
  RISK_THEME_MYGO.RED!,
];

export function getThemeByTierOrLevel(tierOrLevel: string): RiskThemeItem {
  switch (tierOrLevel) {
    case "1个月以内":
    case "无":
    case "正常":
      return RISK_THEME_MYGO.NORMAL!;
    case "1-3个月":
    case "蓝色":
    case "关注":
      return RISK_THEME_MYGO.BLUE!;
    case "3-6个月":
    case "黄色":
    case "审慎":
      return RISK_THEME_MYGO.YELLOW!;
    case "6-12个月":
    case "橙色":
    case "严控":
      return RISK_THEME_MYGO.PURPLE!;
    case "1年以上":
    case "红色":
    case "高危":
    default:
      return RISK_THEME_MYGO.RED!;
  }
}

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}
