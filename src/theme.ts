// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

export type PaletteMode = "soft" | "classic";

export interface RiskThemeItem {
  key: string;
  tierName: string;
  rangeText: string;
  rateText: string;
  name: string;
  classicName: string;
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
 * 5级应收账款风险预警等级色卡体系
 */
export const RISK_THEME_MAP: Record<string, RiskThemeItem> = {
  NORMAL: {
    key: "NORMAL",
    tierName: "1个月以内",
    rangeText: "0-30天",
    rateText: "1.0%",
    name: "正常",
    classicName: "无风险",
    color: "#77DD77",
    classicColor: "#64748B",
    softTint: "#F0FDF4",
    textColor: "#15803D",
    excelFill: "#E2F0D9",
    excelFont: "#385723",
    badgeClass:
      "bg-[#77DD77]/15 text-[#1b5e20] dark:text-[#86efac] border-[#77DD77]/40 hover:bg-[#77DD77]/25",
    classicBadgeClass:
      "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
    cardBorderClass: "border-l-4 border-l-[#77DD77]",
    metaphor: "资金流转顺畅，正常履约",
  },
  BLUE: {
    key: "BLUE",
    tierName: "1-3个月",
    rangeText: "31-90天",
    rateText: "5.0%",
    name: "关注",
    classicName: "蓝色预警",
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
    metaphor: "关注回款进度，常规跟催",
  },
  YELLOW: {
    key: "YELLOW",
    tierName: "3-6个月",
    rangeText: "91-180天",
    rateText: "20.0%",
    name: "审慎",
    classicName: "黄色预警",
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
    metaphor: "对账函证确认，关注资金状况",
  },
  PURPLE: {
    key: "PURPLE",
    tierName: "6-12个月",
    rangeText: "181-365天",
    rateText: "50.0%",
    name: "严控",
    classicName: "橙色预警",
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
    metaphor: "专人重点跟进，下调信用额度",
  },
  RED: {
    key: "RED",
    tierName: "1年以上",
    rangeText: "366天以上",
    rateText: "100.0%",
    name: "高危",
    classicName: "红色预警",
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
    metaphor: "评估诉讼时效与法务介入，全额计提",
  },
};

export const RISK_THEME_LIST: RiskThemeItem[] = [
  RISK_THEME_MAP.NORMAL!,
  RISK_THEME_MAP.BLUE!,
  RISK_THEME_MAP.YELLOW!,
  RISK_THEME_MAP.PURPLE!,
  RISK_THEME_MAP.RED!,
];

export function getThemeByTierOrLevel(tierOrLevel: string): RiskThemeItem {
  switch (tierOrLevel) {
    case "1个月以内":
    case "无":
    case "正常":
    case "无风险":
      return RISK_THEME_MAP.NORMAL!;
    case "1-3个月":
    case "蓝色":
    case "关注":
    case "蓝色预警":
      return RISK_THEME_MAP.BLUE!;
    case "3-6个月":
    case "黄色":
    case "审慎":
    case "黄色预警":
      return RISK_THEME_MAP.YELLOW!;
    case "6-12个月":
    case "橙色":
    case "严控":
    case "橙色预警":
      return RISK_THEME_MAP.PURPLE!;
    case "1年以上":
    case "红色":
    case "高危":
    case "红色预警":
    default:
      return RISK_THEME_MAP.RED!;
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

/**
 * 按照当前系统 locale 格式化日期字符串 (YYYY-MM-DD)
 */
export function formatSystemDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
  const date = new Date(y, m - 1, d);
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return dateStr;
  }
}

