# 智能应收账款账龄分析与坏账预警桌面系统 (SmartAR)
## 产品需求文档 (PRD - Product Requirements Document)

---

### 文档控制信息

| 属性 | 内容 |
| :--- | :--- |
| **产品名称** | 智能应收账款账龄分析与坏账预警桌面工作台 (SmartAR Desktop) |
| **当前版本** | V1.1.0 (跨平台与 MyGO 视觉扩展版) |
| **编制日期** | 2026-10-23 |
| **核心技术栈** | **MyGo (Go 1.22+ 跨平台内核) + React 18/19 + TypeScript + Shadcn UI + Excelize v2** |
| **目标平台** | **Windows (x64/arm64)、macOS (Intel/Apple Silicon)、Linux (x64, AppImage/deb)** |
| **构建与发布** | **GitHub Actions 矩阵式自动化流水线 (Matrix CI/CD)** |
| **视觉主题** | **Shadcn 财务高定风 + MyGO!!!!! 乐队五人代表色融合预警体系** |
| **产品定位** | 面向企业财务部、审计团队及高校智能财务实训的**全跨平台、零数据泄露、高保真动态公式 Excel 建模**智能分析工作台 |

---

## 1. 产品背景与业务目标

### 1.1 业务背景
在现代企业财务实践与高校智能财务实训中，从各类 ERP（用友 U8、金蝶云星空、SAP、Oracle）导出的“应收账款明细表”普遍存在以下痛点：
1. **数据结构混乱**：含多重表头、空白行、小计合计行、重复记录，无法直接透视；
2. **主数据口径不一**：客户简称、缩写、别名混杂，缺少规范的统一编码与信用档案；
3. **勾稽关系残缺**：账期缺失、金额平衡打破、日期推导断裂；
4. **异常项缺乏隔离**：超额回款、零余额死账、零星尾差未作审计分流，造成坏账计提基数失真；
5. **传统导出仅留“死数据”**：传统报表工具导出的 Excel 抹除了所有计算公式，外部审计师无法穿透复核勾稽链条；
6. **跨系统协同困难**：财务团队可能使用 Windows PC、MacBook 甚至 Linux 财务工作站，传统财务小工具多依赖 Windows 专用环境或巨型 Electron 包，缺乏轻量级跨平台解决方案。

### 1.2 产品核心目标
基于 **MyGo（github.com/egoist/mygo） + React + Shadcn UI** 打造轻量级全跨平台应用：
* **全平台原生级体验**：依托 MyGo 分别调用 Windows (WebView2)、macOS (WKWebView)、Linux (WebKitGTK)，免 CGo 纯 Go 编译，体积控制在 10MB~20MB；
* **GitHub Actions 自动化分发**：代码推送即可自动编译构建 Windows、macOS (dmg)、Linux (AppImage/deb) 安装包；
* **100% 离线本地优先 (Local-First)**：所有数据在本地内存完成清洗与测算，绝无任何外网传输，满足最严苛的财务机密合规；
* **MyGO!!!!! 角色特色预警体系**：打破传统沉闷的财务预警红黄蓝模式，创新融入 **MyGO!!!!! 乐队五人代表色**（千早爱音、长崎素世、高松灯、椎名立希、要乐奈），兼备严谨性与现代潮流视觉；
* **保留全套 Excel 动态公式**：导出的 Excel 工作簿中，所有未收余额、逾期天数、账龄分档、计提金额、多表汇总统计**百分之百保留 Excel 原生公式**，修改报表基准日全表动态重算。

---

## 2. 跨平台技术架构与系统分工

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SmartAR 跨平台桌面应用壳 (MyGo)                  │
├────────────────────────────────────────────────────────────────────────┤
│ 【前端交互与视觉展现层】(React 18/19 + TypeScript + Vite + Shadcn UI)    │
│  ├── 视觉层: Shadcn UI (Radix UI) + Tailwind CSS + Lucide Icons        │
│  ├── 状态层: Zustand (流水线步骤、数据流向、审计标记、筛选状态)           │
│  ├── 图表层: ECharts / Recharts (金字塔图、坏账占比环形图、区域雷达图)   │
│  ├── 主题层: MyGO!!!!! 五人色预警卡片与色谱标签 (可一键切换经典/角色主题) │
│  └── 通信层: MyGo 自动生成 TypeScript 强类型 RPC Client               │
├───────────────────────────────────▲────────────────────────────────────┤
│                                   │ JSON-RPC (In-Memory IPC Bridge)    │
├───────────────────────────────────▼────────────────────────────────────┤
│ 【核心计算与系统能力内核】(Pure Go 1.22+ / No CGo)                     │
│  ├── 跨平台原生 Webview 驱动:                                           │
│  │    • Windows: Microsoft Edge WebView2                              │
│  │    • macOS: Apple WebKit (WKWebView)                               │
│  │    • Linux: WebKitGTK 4.1                                          │
│  ├── 原生系统对话框: OpenFileDialog / SaveFileDialog 本地文件直存      │
│  ├── 结构探测与清洗引擎: 智能表头定位、空行过滤、小计合计剔除、哈希去重  │
│  ├── 主数据规范化中心: 客户别名字典匹配、区域与评级对齐、账期众数推算    │
│  ├── 财务勾稽与异常分流: 9 类异常检测、自动修补与 13 笔挂起异常隔离    │
│  ├── 账龄与坏账矩阵: 5 级账龄划分、阶梯坏账准备率、5 级预警规则         │
│  └── Excel 核心引擎 (Excelize v2):                                     │
│       • 注入原生公式 (IFS, SUMIF, COUNTIF, MAX, ROUND, VLOOKUP)        │
│       • MyGO 色系单元格高保真填充 (HEX 颜色、边框、字体、千分位格式)     │
│       • 5 大工作表 (Sheet) 批量装配与冻结窗格                          │
├────────────────────────────────────────────────────────────────────────┤
│ 【持续集成与分发体系】GitHub Actions 矩阵编译 (Windows / macOS / Linux) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 视觉创新：MyGO!!!!! 五人代表色与财务预警等级融合设计

为了赋予系统现代质感，并契合 MyGo 框架命名灵感，系统创新性地将 **MyGO!!!!! 乐队五位主角的代表色与性格特征**深度融入 5 级财务账龄预警体系中。系统同时保留“MyGO 潮流色卡”与“标准财务色卡”供用户自主切换。

### 3.1 代表色与预警阶梯映射哲学

```
[账龄区间]       [预警等级]    [代表角色]    [色卡 Hex]    [业务状态与性格隐喻]
0 - 30 天   ───  正常/无风险 ─── 要乐奈     #77DD77    自由随性、健康无碍，资金流转顺畅
31 - 90 天  ───  关注/蓝色   ─── 高松灯     #77BBDD    心怀忐忑、声声呼唤，需要跟催回款
91 - 180 天 ───  审慎/黄色   ─── 长崎素世   #FFDD88    试图维系、对账函证，关注资金链状态
181-365 天  ───  严控/紫蓝   ─── 椎名立希   #7777AA    压力骤增、严肃应对，专人重拳管控
366 天以上  ───  高危/粉红   ─── 千早爱音   #FF8899    醒目警报、法务出击，全额计提绝境破局
```

### 3.2 详细色卡数值与对比度工程（UI 与 Excel 双向适配）

财务报表对文字可读性要求极高。为防止浅色底导致文字看不清，系统设计了**柔和背景色（Soft Tint）**与**高对比文字色（Contrast Text）**方案：

| 账龄区间 | 风险等级 | 代表成员 | 基础原色 (HEX) | UI 柔和背景色 (5~10% tint) | UI 文字/边框色 | Excel 单元格填充色 | Excel 字体颜色 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1个月以内** | **正常 (无风险)** | **要乐奈** | `#77DD77` | `#F0FDF4` | `#15803D` (深翠绿) | `#E2F0D9` (淡嫩绿) | `#385723` (深绿加粗) |
| **1-3个月** | **蓝色预警 (关注)** | **高松灯** | `#77BBDD` | `#F0F9FF` | `#0369A1` (深天蓝) | `#DDEBF7` (浅冰蓝) | `#1F4E79` (深蓝加粗) |
| **3-6个月** | **黄色预警 (审慎)** | **长崎素世** | `#FFDD88` | `#FEFCE8` | `#A16207` (暖黄褐) | `#FFF2CC` (柔和鹅黄) | `#833C0C` (褐黄加粗) |
| **6-12个月**| **紫蓝预警 (严控)** | **椎名立希** | `#7777AA` | `#F5F3FF` | `#5B21B6` (深紫青) | `#E4DFEC` (冷紫灰) | `#3B3838` (冷灰紫加粗) |
| **1年以上** | **粉红预警 (高危)** | **千早爱音** | `#FF8899` | `#FFF1F2` | `#BE123C` (烈焰粉红) | `#FCE4D6` (警示浅粉) | `#C00000` (警示深红加粗) |

#### Shadcn UI 组件代码片段 (Tailwind CSS 类名映射)
```tsx
export const RISK_THEME_MYGO = {
  NORMAL: {
    name: "正常",
    character: "要乐奈",
    color: "#77DD77",
    badgeClass: "bg-[#77DD77]/15 text-[#1b5e20] border-[#77DD77]/30 hover:bg-[#77DD77]/25",
  },
  BLUE: {
    name: "关注",
    character: "高松灯",
    color: "#77BBDD",
    badgeClass: "bg-[#77BBDD]/15 text-[#0d47a1] border-[#77BBDD]/30 hover:bg-[#77BBDD]/25",
  },
  YELLOW: {
    name: "审慎",
    character: "长崎素世",
    color: "#FFDD88",
    badgeClass: "bg-[#FFDD88]/20 text-[#b78103] border-[#FFDD88]/40 hover:bg-[#FFDD88]/30",
  },
  PURPLE: {
    name: "严控",
    character: "椎名立希",
    color: "#7777AA",
    badgeClass: "bg-[#7777AA]/15 text-[#4a148c] border-[#7777AA]/30 hover:bg-[#7777AA]/25",
  },
  RED: {
    name: "高危",
    character: "千早爱音",
    color: "#FF8899",
    badgeClass: "bg-[#FF8899]/20 text-[#c2185b] border-[#FF8899]/40 font-bold hover:bg-[#FF8899]/30",
  },
};
```

---

## 4. 业务处理流水线与数据规范

### 4.1 五步管道处理流程
1. **Step 1: 上传与结构清洗**
   - 智能识别表头，自动滤除多余注释行、小计合计行与空白行；
   - 对核心四元组（客户、发票号、开票日、金额）进行去重。
2. **Step 2: 主数据映射与缺失值修补**
   - 20 家标准客户档案（CUST001~CUST020）别名模糊反查；
   - 信用等级补齐；账期缺失按客户历史众数（无则默认 60 天）填充；
   - 约定收款日、已收金额、未收余额按财务平衡推算。
3. **Step 3: 异常数据审计与分流**
   - 原地修复：负数金额取绝对值、公式不符重算；
   - 挂起隔离：3 笔零余额、3 笔超额回款、7 笔尾差（共 13 笔）分流至挂起清单。
4. **Step 4: 账龄测算与坏账计提**
   - 5 级区间划分，按 `1% / 5% / 20% / 50% / 100%` 计提坏账；
   - 赋予对应的预警等级与催收管控制度。
5. **Step 5: 动态公式 Excel 导出**
   - 生成具备完整公式链条的 5 工作表 Excel 报表。

---

## 5. 核心亮点：全量保留 Excel 原生动态公式规范

导出的 Excel 工作簿中，绝不出现硬编码的死数值，全量注入原生公式：

```
                    ┌──────────────────────────────────────────────┐
                    │ 全局动态参数：报表基准日                        │
                    │ 单元格：'坏账准备与预警分析表'!$B$1          │
                    │ 表达式：DATE(2026, 6, 30)                    │
                    └──────────────────────┬───────────────────────┘
                                           │ (全表级联动态关联)
         ┌─────────────────────────────────┴─────────────────────────────────┐
         ▼                                                                   ▼
┌────────────────────────────────────────┐   ┌─────────────────────────────────────────┐
│ Sheet 1: 应收账款明细(清洗后)           │   │ Sheet 2: 坏账准备与预警分析表            │
│ • 未收余额 (L列): =J{i}-K{i}           │   │ • 单据笔数 (D列): =COUNTIF(...)         │
│ • 约定收款 (N列): =G{i}+M{i}           │   │ • 笔数占比 (E列): =D3/$D$8              │
│ • 账龄天数 (O列): =$B$1-G{i}           │   │ • 未收总额 (F列): =SUMIF(...)           │
│ • 逾期天数 (P列): =MAX(0, $B$1-N{i})   │   │ • 金额占比 (G列): =F3/$F$8              │
│ • 是否逾期 (Q列): =IF(AND(..), "是")   │   │ • 坏账准备 (I列): =ROUND(F3*H3, 2)      │
│ • 账龄区间 (S列): =IFS(...)            │   │ • 综合计提 (H8):  =I8/F8                │
│ • 坏账准备 (U列): =ROUND(L{i}*T{i}, 2) │   │ • 汇总合计 (Row 8): =SUM(...)           │
└────────────────────────────────────────┘   └─────────────────────────────────────────┘
```

### 5.1 工作表一：`应收账款明细(清洗后)` 核心公式表
* **未收余额（L列）**: `=J{i}-K{i}`
* **约定收款日（N列）**: `=G{i}+M{i}`
* **账龄天数（O列）**: `='坏账准备与预警分析表'!$B$1-G{i}`
* **逾期天数（P列）**: `=MAX(0, '坏账准备与预警分析表'!$B$1-N{i})`
* **是否逾期（Q列）**: `=IF(AND(P{i}>0, L{i}>0), "是", "否")`
* **账龄区间（S列）**: `=IFS(O{i}<=30, "1个月以内", O{i}<=90, "1-3个月", O{i}<=180, "3-6个月", O{i}<=365, "6-12个月", TRUE, "1年以上")`
* **坏账计提比例（T列）**: `=IFS(O{i}<=30, 0.01, O{i}<=90, 0.05, O{i}<=180, 0.20, O{i}<=365, 0.50, TRUE, 1.00)`
* **坏账准备金额（U列）**: `=ROUND(L{i}*T{i}, 2)`
* **风险预警等级（V列）**: `=IFS(O{i}<=30, "无", O{i}<=90, "蓝色", O{i}<=180, "黄色", O{i}<=365, "橙色", TRUE, "红色")`
* **建议措施（W列）**: `=VLOOKUP(S{i}, '坏账准备与预警分析表'!$A$3:$J$7, 10, FALSE)`

### 5.2 工作表二：`坏账准备与预警分析表` 跨表透视公式
* **单据笔数（D列）**: `=COUNTIF('应收账款明细(清洗后)'!$S:$S, A3)`
* **笔数占比（E列）**: `=D3/$D$8`
* **未收余额合计（F列）**: `=SUMIF('应收账款明细(清洗后)'!$S:$S, A3, '应收账款明细(清洗后)'!$L:$L)`
* **金额占比（G列）**: `=F3/$F$8`
* **计提坏账准备（I列）**: `=ROUND(F3*H3, 2)`
* **合计行（第 8 行）**:
  - 总笔数: `=SUM(D3:D7)`
  - 未收总额: `=SUM(F3:F7)`
  - 坏账总额: `=SUM(I3:I7)`
  - 综合坏账率: `=I8/F8`

---

## 6. 持续集成与交付：GitHub Actions 跨平台构建规范

为了实现 **Windows + macOS + Linux** 三端无缝分发，系统配置 GitHub Actions 进行矩阵自动化构建打包。

### 6.1 构建矩阵配置表

| 平台 (OS) | Runner 环境 | 目标架构 | 依赖项 | 产出分发包格式 |
| :--- | :--- | :--- | :--- | :--- |
| **Windows** | `windows-latest` | `x64` / `arm64` | 系统预装 WebView2 | `.exe` (便携独立程序) / `.zip` |
| **macOS** | `macos-latest` | `Apple Silicon (arm64)` & `Intel (x64)` | Xcode 命令行工具 | `.dmg` (拖拽镜像) / `.app` |
| **Linux** | `ubuntu-22.04` | `x64` | `libwebkit2gtk-4.1-dev` | `.AppImage` (免安装双击运行) / `.deb` |

### 6.2 GitHub Actions 流水线定义 (`.github/workflows/release.yml`)

```yaml
name: Cross-Platform Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build:
    name: Build on ${{ matrix.os }} (${{ matrix.target }})
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        include:
          # Windows x64
          - os: windows-latest
            target: windows-x64
            output_name: SmartAR-windows-x64.exe
            asset_path: SmartAR-windows-x64.exe
          # macOS Universal / Apple Silicon
          - os: macos-latest
            target: macos-arm64
            output_name: SmartAR-macOS.dmg
            asset_path: SmartAR-macOS.dmg
          # Linux x64
          - os: ubuntu-22.04
            target: linux-x64
            output_name: SmartAR-linux-x64.AppImage
            asset_path: SmartAR-linux-x64.AppImage

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Go Runtime
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true

      - name: Setup Node.js Runtime
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Linux Build Dependencies (Ubuntu)
        if: runner.os == 'Linux'
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev

      - name: Install Frontend Dependencies
        run: |
          cd frontend
          npm ci

      - name: Build React Frontend
        run: |
          cd frontend
          npm run build

      - name: Build Application via MyGo CLI
        shell: bash
        run: |
          go install github.com/egoist/mygo/cmd/mygo@latest
          mygo build --target ${{ matrix.target }} -o ${{ matrix.output_name }}

      - name: Upload Release Asset
        uses: softprops/action-gh-release@v2
        if: startsWith(github.ref, 'refs/tags/')
        with:
          files: ${{ matrix.asset_path }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 7. UI/UX 规范与前端架构 (Shadcn UI)

### 7.1 组件选型与设计映射
* **整体色调**：Slate / Zinc 现代金融暗黑/浅色模式双色切换；
* **文件上传**：`Card` + `Progress` + 原生拖拽 API；
* **数据流转向导**：`Tabs` + `Separator` + 进度步骤条；
* **数据表格**：`Table` (集成 TanStack Table) 支持虚拟滚动、表头列排序、多列筛选；
* **异常项核查**：`Dialog` + `Alert` + `Badge` 支持单笔穿透与勾稽复核；
* **预警看板**：`Card` + `Badge`（采用 MyGO 乐队成员色卡）+ ECharts 联动分析。

---

## 8. 非功能性指标 (NFR)

1. **跨平台原生启动速度**：
   - Windows/macOS/Linux 首次冷启动时间 $\le 1.2\text{ s}$；
   - 内存占用在常驻状态下 $\le 60\text{ MB}$（复用系统自带 WebKit/WebView2 引擎）。
2. **离线与安全性**：
   - 100% 离线可用，代码中不含任何远程 CDN、外网 API 或远程字库加载；
   - 杜绝数据外传风险。
3. **计算吞吐量**：
   - 10,000 条明细数据完成清洗、异常判定与账龄测算 $\le 300\text{ ms}$；
   - 5-Sheet 高保真公式 Excel 导出 $\le 1.5\text{ s}$。
