// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

package ar

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
)

// buildTierNameFormula generates a nested IF formula for aging tier name based on custom tiers.
func buildTierNameFormula(tiers []TierConfig, row int) string {
	n := len(tiers)
	if n == 0 {
		return `"1个月以内"`
	}
	if n == 1 {
		return fmt.Sprintf(`"%s"`, tiers[0].Name)
	}
	var b strings.Builder
	for i := 0; i < n-1; i++ {
		b.WriteString(fmt.Sprintf(`IF(O%d<=%d, "%s", `, row, tiers[i].MaxDays, tiers[i].Name))
	}
	b.WriteString(fmt.Sprintf(`"%s"`, tiers[n-1].Name))
	for i := 0; i < n-1; i++ {
		b.WriteString(")")
	}
	return b.String()
}

// buildTierRateFormula generates a nested IF formula for bad debt provision rate based on custom tiers.
func buildTierRateFormula(tiers []TierConfig, row int) string {
	n := len(tiers)
	if n == 0 {
		return "0.01"
	}
	if n == 1 {
		return fmt.Sprintf("%g", tiers[0].Rate)
	}
	var b strings.Builder
	for i := 0; i < n-1; i++ {
		b.WriteString(fmt.Sprintf(`IF(O%d<=%d, %g, `, row, tiers[i].MaxDays, tiers[i].Rate))
	}
	b.WriteString(fmt.Sprintf(`%g`, tiers[n-1].Rate))
	for i := 0; i < n-1; i++ {
		b.WriteString(")")
	}
	return b.String()
}

// buildTierLevelFormula generates a nested IF formula for warning level based on custom tiers.
func buildTierLevelFormula(tiers []TierConfig, row int, themeMode string) string {
	n := len(tiers)
	if n == 0 {
		return `"无"`
	}
	getLevel := func(tc TierConfig) string {
		if themeMode == "soft" || themeMode == "mygo" {
			return tc.MyGoLevel
		}
		return tc.ClassicLevel
	}
	if n == 1 {
		return fmt.Sprintf(`"%s"`, getLevel(tiers[0]))
	}
	var b strings.Builder
	for i := 0; i < n-1; i++ {
		b.WriteString(fmt.Sprintf(`IF(O%d<=%d, "%s", `, row, tiers[i].MaxDays, getLevel(tiers[i])))
	}
	b.WriteString(fmt.Sprintf(`"%s"`, getLevel(tiers[n-1])))
	for i := 0; i < n-1; i++ {
		b.WriteString(")")
	}
	return b.String()
}

// ExportWorkbook generates the 5-sheet Excel workbook with 100% native Excel formulas and MyGO/Classic styling.
func ExportWorkbook(res *PipelineResult, opts ExportOptions) (*ExportResult, error) {
	start := time.Now()
	if res == nil {
		return nil, fmt.Errorf("请先加载并清洗应收账款数据后再导出")
	}

	asOfDate := time.Date(2026, 6, 30, 0, 0, 0, 0, time.UTC)
	if opts.AsOfDate != "" {
		if parsed, ok := parseDate(opts.AsOfDate); ok {
			asOfDate = parsed
		}
	} else if res.AsOfDate != "" {
		if parsed, ok := parseDate(res.AsOfDate); ok {
			asOfDate = parsed
		}
	}

	useMyGoTheme := opts.ThemeMode == "soft" || opts.ThemeMode == "mygo"

	f := excelize.NewFile()
	defer f.Close()

	sheetMain := "应收账款明细(清洗后)"
	sheetSummary := "坏账准备与预警分析表"
	sheetSuspended := "挂起异常清单"
	sheetAll := "全部数据(含处置标记)"
	sheetCust := "客户标准信息表"

	f.SetSheetName("Sheet1", sheetMain)
	f.NewSheet(sheetSummary)
	f.NewSheet(sheetSuspended)
	f.NewSheet(sheetAll)
	f.NewSheet(sheetCust)

	borderThin := []excelize.Border{
		{Type: "left", Color: "D9D9D9", Style: 1},
		{Type: "right", Color: "D9D9D9", Style: 1},
		{Type: "top", Color: "D9D9D9", Style: 1},
		{Type: "bottom", Color: "D9D9D9", Style: 1},
	}
	borderTotal := []excelize.Border{
		{Type: "left", Color: "D9D9D9", Style: 1},
		{Type: "right", Color: "D9D9D9", Style: 1},
		{Type: "top", Color: "595959", Style: 1},
		{Type: "bottom", Color: "595959", Style: 6},
	}

	makeHeaderStyle := func(bgHex string) int {
		st, _ := f.NewStyle(&excelize.Style{
			Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Bold: true, Color: "FFFFFF"},
			Fill:      excelize.Fill{Type: "pattern", Color: []string{bgHex}, Pattern: 1},
			Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
			Border:    borderThin,
		})
		return st
	}

	hdrMainColor := "C00000"
	hdrSumColor := "1F4E79"
	hdrSuspColor := "ED7D31"
	hdrAllColor := "333F48"
	if useMyGoTheme {
		hdrMainColor = "3B4252" // Slate dark
		hdrSumColor = "1E3A5F"  // Deep blue
		hdrSuspColor = "B45309" // Amber warning
		hdrAllColor = "3730A3"  // Indigo
	}

	stHeaderMain := makeHeaderStyle(hdrMainColor)
	stHeaderSum := makeHeaderStyle(hdrSumColor)
	stHeaderSusp := makeHeaderStyle(hdrSuspColor)
	stHeaderAll := makeHeaderStyle(hdrAllColor)
	stHeaderCust := makeHeaderStyle("1F4E79")

	stCenter, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border:    borderThin,
	})
	stLeft, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center"},
		Border:    borderThin,
	})
	stInt, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border:    borderThin,
		NumFmt:    3, // #,##0
	})
	stIntRight, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "right", Vertical: "center"},
		Border:    borderThin,
		NumFmt:    3, // #,##0
	})
	stMoney, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Color: "000000"},
		Alignment: &excelize.Alignment{Horizontal: "right", Vertical: "center"},
		Border:    borderThin,
		NumFmt:    4, // #,##0.00
	})
	pctFmt := "0.0%"
	stPctCenter, _ := f.NewStyle(&excelize.Style{
		Font:         &excelize.Font{Family: "微软雅黑", Size: 10, Color: "000000"},
		Alignment:    &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border:       borderThin,
		CustomNumFmt: &pctFmt,
	})
	stPctRight, _ := f.NewStyle(&excelize.Style{
		Font:         &excelize.Font{Family: "微软雅黑", Size: 10, Color: "000000"},
		Alignment:    &excelize.Alignment{Horizontal: "right", Vertical: "center"},
		Border:       borderThin,
		CustomNumFmt: &pctFmt,
	})
	dateFmt := "yyyy-mm-dd"
	stDate, _ := f.NewStyle(&excelize.Style{
		Font:         &excelize.Font{Family: "微软雅黑", Size: 10, Color: "000000"},
		Alignment:    &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border:       borderThin,
		CustomNumFmt: &dateFmt,
	})
	stDateParam, _ := f.NewStyle(&excelize.Style{
		Font:         &excelize.Font{Family: "微软雅黑", Size: 11, Bold: true, Color: "C00000"},
		Fill:         excelize.Fill{Type: "pattern", Color: []string{"FFF2CC"}, Pattern: 1},
		Alignment:    &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border:       borderThin,
		CustomNumFmt: &dateFmt,
	})
	stParamLabel, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Bold: true, Color: "1F4E79"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"DDEBF7"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border:    borderThin,
	})
	stTitle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "微软雅黑", Size: 13, Bold: true, Color: "1F4E79"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})

	// Level styles (Soft vs Classic)
	levelStyles := make(map[string]int)
	if useMyGoTheme {
		// Soft Excel cell fills & fonts
		softExcelPalette := map[string]struct{ fill, font string }{
			"正常": {"E2F0D9", "385723"},
			"关注": {"DDEBF7", "1F4E79"},
			"审慎": {"FFF2CC", "833C0C"},
			"严控": {"E4DFEC", "3B3838"},
			"高危": {"FCE4D6", "C00000"},
			"无":  {"E2F0D9", "385723"},
			"蓝色": {"DDEBF7", "1F4E79"},
			"黄色": {"FFF2CC", "833C0C"},
			"橙色": {"E4DFEC", "3B3838"},
			"红色": {"FCE4D6", "C00000"},
		}
		for lvl, c := range softExcelPalette {
			st, _ := f.NewStyle(&excelize.Style{
				Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Bold: true, Color: c.font},
				Fill:      excelize.Fill{Type: "pattern", Color: []string{c.fill}, Pattern: 1},
				Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
				Border:    borderThin,
			})
			levelStyles[lvl] = st
		}
	} else {
		classicPalette := map[string]struct {
			fill, font string
			bold       bool
		}{
			"无":  {"F2F2F2", "595959", false},
			"蓝色": {"DDEBF7", "2E75B6", true},
			"黄色": {"FFF9E6", "B28900", true},
			"橙色": {"FFF2CC", "ED7D31", true},
			"红色": {"FCE4D6", "C00000", true},
			"正常": {"F2F2F2", "595959", false},
			"关注": {"DDEBF7", "2E75B6", true},
			"审慎": {"FFF9E6", "B28900", true},
			"严控": {"FFF2CC", "ED7D31", true},
			"高危": {"FCE4D6", "C00000", true},
		}
		for lvl, c := range classicPalette {
			st, _ := f.NewStyle(&excelize.Style{
				Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Bold: c.bold, Color: c.font},
				Fill:      excelize.Fill{Type: "pattern", Color: []string{c.fill}, Pattern: 1},
				Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
				Border:    borderThin,
			})
			levelStyles[lvl] = st
		}
	}

	stSuspType, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Bold: true, Color: "C00000"},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border:    borderThin,
	})
	stStatusNormal, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Color: "375623"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"E2EFDA"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border:    borderThin,
	})
	stStatusSusp, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Bold: true, Color: "C65911"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"FCE4D6"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border:    borderThin,
	})

	stTotalCenter, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Bold: true, Color: "000000"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"D9E1F2"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border:    borderTotal,
	})
	stTotalLeft, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Bold: true, Color: "000000"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"D9E1F2"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center"},
		Border:    borderTotal,
	})
	stTotalInt, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Bold: true, Color: "000000"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"D9E1F2"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "right", Vertical: "center"},
		Border:    borderTotal,
		NumFmt:    3,
	})
	stTotalMoney, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Family: "微软雅黑", Size: 10, Bold: true, Color: "000000"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"D9E1F2"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "right", Vertical: "center"},
		Border:    borderTotal,
		NumFmt:    4,
	})
	stTotalPct, _ := f.NewStyle(&excelize.Style{
		Font:         &excelize.Font{Family: "微软雅黑", Size: 10, Bold: true, Color: "000000"},
		Fill:         excelize.Fill{Type: "pattern", Color: []string{"D9E1F2"}, Pattern: 1},
		Alignment:    &excelize.Alignment{Horizontal: "right", Vertical: "center"},
		Border:       borderTotal,
		CustomNumFmt: &pctFmt,
	})

	formulaCount := 0

	// =========================================================================
	// Sheet 2: 坏账准备与预警分析表 (Build first so $B$1 exists)
	// =========================================================================
	f.SetRowHeight(sheetSummary, 1, 34)
	f.SetCellValue(sheetSummary, "A1", "报表基准日")
	f.SetCellStyle(sheetSummary, "A1", "A1", stParamLabel)

	dateFormula := fmt.Sprintf("DATE(%d,%d,%d)", asOfDate.Year(), int(asOfDate.Month()), asOfDate.Day())
	f.SetCellFormula(sheetSummary, "B1", dateFormula)
	f.SetCellStyle(sheetSummary, "B1", "B1", stDateParam)
	formulaCount++

	f.MergeCell(sheetSummary, "C1", "J1")
	titleStr := fmt.Sprintf("应收账款账龄分析、坏账准备计提与风险预警汇总表（截至 %s）", asOfDate.Format("2006-01-02"))
	f.SetCellValue(sheetSummary, "C1", titleStr)
	f.SetCellStyle(sheetSummary, "C1", "J1", stTitle)

	sumHeaders := []string{
		"账龄区间", "判定标准(账龄天数)", "风险预警等级", "单据笔数", "笔数占比",
		"未收余额合计（元）", "金额占比", "坏账计提比例", "计提坏账准备（元）", "建议管控措施",
	}
	f.SetRowHeight(sheetSummary, 2, 26)
	for i, h := range sumHeaders {
		cell, _ := excelize.CoordinatesToCellName(i+1, 2)
		f.SetCellValue(sheetSummary, cell, h)
		f.SetCellStyle(sheetSummary, cell, cell, stHeaderSum)
	}

	tiers := res.TierConfigs
	if len(tiers) == 0 {
		tiers = DefaultTierConfigs
	}
	nTiers := len(tiers)
	totalRow := 3 + nTiers
	lastDataRow := 2 + nTiers

	for idx, tc := range tiers {
		r := idx + 3 // Rows 3..2+nTiers
		f.SetRowHeight(sheetSummary, r, 22)

		cA := fmt.Sprintf("A%d", r)
		cB := fmt.Sprintf("B%d", r)
		cC := fmt.Sprintf("C%d", r)
		cD := fmt.Sprintf("D%d", r)
		cE := fmt.Sprintf("E%d", r)
		cF := fmt.Sprintf("F%d", r)
		cG := fmt.Sprintf("G%d", r)
		cH := fmt.Sprintf("H%d", r)
		cI := fmt.Sprintf("I%d", r)
		cJ := fmt.Sprintf("J%d", r)

		f.SetCellValue(sheetSummary, cA, tc.Name)
		f.SetCellStyle(sheetSummary, cA, cA, stCenter)

		f.SetCellValue(sheetSummary, cB, tc.RangeText)
		f.SetCellStyle(sheetSummary, cB, cB, stCenter)

		lvl := tc.ClassicLevel
		if useMyGoTheme {
			lvl = tc.MyGoLevel
		}
		f.SetCellValue(sheetSummary, cC, lvl)
		if st, ok := levelStyles[lvl]; ok {
			f.SetCellStyle(sheetSummary, cC, cC, st)
		} else {
			f.SetCellStyle(sheetSummary, cC, cC, stCenter)
		}

		// PRD 5.2: 单据笔数 (D列) =COUNTIF('应收账款明细(清洗后)'!$S:$S, A{r})
		f.SetCellFormula(sheetSummary, cD, fmt.Sprintf("COUNTIF('%s'!$S:$S, A%d)", sheetMain, r))
		f.SetCellStyle(sheetSummary, cD, cD, stIntRight)
		formulaCount++

		// PRD 5.2: 笔数占比 (E列) =D{r}/$D${totalRow}
		f.SetCellFormula(sheetSummary, cE, fmt.Sprintf("D%d/$D$%d", r, totalRow))
		f.SetCellStyle(sheetSummary, cE, cE, stPctRight)
		formulaCount++

		// PRD 5.2: 未收余额合计 (F列) =SUMIF('应收账款明细(清洗后)'!$S:$S, A{r}, '应收账款明细(清洗后)'!$L:$L)
		f.SetCellFormula(sheetSummary, cF, fmt.Sprintf("SUMIF('%s'!$S:$S, A%d, '%s'!$L:$L)", sheetMain, r, sheetMain))
		f.SetCellStyle(sheetSummary, cF, cF, stMoney)
		formulaCount++

		// PRD 5.2: 金额占比 (G列) =F{r}/$F${totalRow}
		f.SetCellFormula(sheetSummary, cG, fmt.Sprintf("F%d/$F$%d", r, totalRow))
		f.SetCellStyle(sheetSummary, cG, cG, stPctRight)
		formulaCount++

		// H列: 坏账计提比例
		f.SetCellValue(sheetSummary, cH, tc.Rate)
		f.SetCellStyle(sheetSummary, cH, cH, stPctRight)

		// PRD 5.2: 计提坏账准备 (I列) =ROUND(F{r}*H{r}, 2)
		f.SetCellFormula(sheetSummary, cI, fmt.Sprintf("ROUND(F%d*H%d, 2)", r, r))
		f.SetCellStyle(sheetSummary, cI, cI, stMoney)
		formulaCount++

		// J列: 建议管控措施
		f.SetCellValue(sheetSummary, cJ, tc.SuggestedAction)
		f.SetCellStyle(sheetSummary, cJ, cJ, stLeft)
	}

	// 合计行 (Row totalRow)
	f.SetRowHeight(sheetSummary, totalRow, 25)
	cTotA := fmt.Sprintf("A%d", totalRow)
	cTotB := fmt.Sprintf("B%d", totalRow)
	cTotC := fmt.Sprintf("C%d", totalRow)
	cTotD := fmt.Sprintf("D%d", totalRow)
	cTotE := fmt.Sprintf("E%d", totalRow)
	cTotF := fmt.Sprintf("F%d", totalRow)
	cTotG := fmt.Sprintf("G%d", totalRow)
	cTotH := fmt.Sprintf("H%d", totalRow)
	cTotI := fmt.Sprintf("I%d", totalRow)
	cTotJ := fmt.Sprintf("J%d", totalRow)

	f.SetCellValue(sheetSummary, cTotA, "合计")
	f.SetCellStyle(sheetSummary, cTotA, cTotA, stTotalCenter)
	f.SetCellValue(sheetSummary, cTotB, "-")
	f.SetCellStyle(sheetSummary, cTotB, cTotB, stTotalCenter)
	f.SetCellValue(sheetSummary, cTotC, "-")
	f.SetCellStyle(sheetSummary, cTotC, cTotC, stTotalCenter)

	f.SetCellFormula(sheetSummary, cTotD, fmt.Sprintf("SUM(D3:D%d)", lastDataRow))
	f.SetCellStyle(sheetSummary, cTotD, cTotD, stTotalInt)
	f.SetCellFormula(sheetSummary, cTotE, fmt.Sprintf("SUM(E3:E%d)", lastDataRow))
	f.SetCellStyle(sheetSummary, cTotE, cTotE, stTotalPct)
	f.SetCellFormula(sheetSummary, cTotF, fmt.Sprintf("SUM(F3:F%d)", lastDataRow))
	f.SetCellStyle(sheetSummary, cTotF, cTotF, stTotalMoney)
	f.SetCellFormula(sheetSummary, cTotG, fmt.Sprintf("SUM(G3:G%d)", lastDataRow))
	f.SetCellStyle(sheetSummary, cTotG, cTotG, stTotalPct)
	f.SetCellFormula(sheetSummary, cTotH, fmt.Sprintf("I%d/F%d", totalRow, totalRow))
	f.SetCellStyle(sheetSummary, cTotH, cTotH, stTotalPct)
	f.SetCellFormula(sheetSummary, cTotI, fmt.Sprintf("SUM(I3:I%d)", lastDataRow))
	f.SetCellStyle(sheetSummary, cTotI, cTotI, stTotalMoney)
	f.SetCellValue(sheetSummary, cTotJ, "全表综合管控")
	f.SetCellStyle(sheetSummary, cTotJ, cTotJ, stTotalLeft)
	formulaCount += 6

	sumWidths := map[string]float64{
		"A": 14, "B": 18, "C": 14, "D": 12, "E": 12,
		"F": 20, "G": 12, "H": 14, "I": 20, "J": 48,
	}
	for col, w := range sumWidths {
		f.SetColWidth(sheetSummary, col, col, w)
	}

	// =========================================================================
	// Helper to write base 18 columns + dynamic formulas
	// =========================================================================
	headers18 := []string{
		"序号", "客户编码", "客户名称", "销售员", "所属区域", "信用等级",
		"开票日期", "发票号", "销售合同号", "应收金额（元）", "已收金额（元）", "未收余额（元）",
		"账期(天)", "约定收款日", "账龄天数", "逾期天数", "是否逾期", "备注",
	}
	agingCols := []string{"账龄区间", "坏账计提比例", "坏账准备（元）", "风险预警等级", "建议措施"}

	writeRecordBaseAndFormulas := func(sheet string, r int, rec ARRecord, agingStartCol int) {
		f.SetRowHeight(sheet, r, 20)

		invDateVal, _ := parseDate(rec.InvoiceDate)

		f.SetCellValue(sheet, fmt.Sprintf("A%d", r), rec.Seq)
		f.SetCellStyle(sheet, fmt.Sprintf("A%d", r), fmt.Sprintf("A%d", r), stInt)

		f.SetCellValue(sheet, fmt.Sprintf("B%d", r), rec.CustCode)
		f.SetCellStyle(sheet, fmt.Sprintf("B%d", r), fmt.Sprintf("B%d", r), stCenter)

		f.SetCellValue(sheet, fmt.Sprintf("C%d", r), rec.CustName)
		f.SetCellStyle(sheet, fmt.Sprintf("C%d", r), fmt.Sprintf("C%d", r), stLeft)

		f.SetCellValue(sheet, fmt.Sprintf("D%d", r), rec.Salesperson)
		f.SetCellStyle(sheet, fmt.Sprintf("D%d", r), fmt.Sprintf("D%d", r), stCenter)

		f.SetCellValue(sheet, fmt.Sprintf("E%d", r), rec.Region)
		f.SetCellStyle(sheet, fmt.Sprintf("E%d", r), fmt.Sprintf("E%d", r), stCenter)

		f.SetCellValue(sheet, fmt.Sprintf("F%d", r), rec.CreditLevel)
		f.SetCellStyle(sheet, fmt.Sprintf("F%d", r), fmt.Sprintf("F%d", r), stCenter)

		f.SetCellValue(sheet, fmt.Sprintf("G%d", r), invDateVal)
		f.SetCellStyle(sheet, fmt.Sprintf("G%d", r), fmt.Sprintf("G%d", r), stDate)

		f.SetCellValue(sheet, fmt.Sprintf("H%d", r), rec.InvoiceNo)
		f.SetCellStyle(sheet, fmt.Sprintf("H%d", r), fmt.Sprintf("H%d", r), stCenter)

		f.SetCellValue(sheet, fmt.Sprintf("I%d", r), rec.ContractNo)
		f.SetCellStyle(sheet, fmt.Sprintf("I%d", r), fmt.Sprintf("I%d", r), stCenter)

		f.SetCellValue(sheet, fmt.Sprintf("J%d", r), rec.ARAmount)
		f.SetCellStyle(sheet, fmt.Sprintf("J%d", r), fmt.Sprintf("J%d", r), stMoney)

		f.SetCellValue(sheet, fmt.Sprintf("K%d", r), rec.ReceivedAmount)
		f.SetCellStyle(sheet, fmt.Sprintf("K%d", r), fmt.Sprintf("K%d", r), stMoney)

		// PRD 5.1: 未收余额（L列） =J{i}-K{i}
		f.SetCellFormula(sheet, fmt.Sprintf("L%d", r), fmt.Sprintf("J%d-K%d", r, r))
		f.SetCellStyle(sheet, fmt.Sprintf("L%d", r), fmt.Sprintf("L%d", r), stMoney)
		formulaCount++

		f.SetCellValue(sheet, fmt.Sprintf("M%d", r), rec.CreditTermDays)
		f.SetCellStyle(sheet, fmt.Sprintf("M%d", r), fmt.Sprintf("M%d", r), stInt)

		// PRD 5.1: 约定收款日（N列） =G{i}+M{i}
		f.SetCellFormula(sheet, fmt.Sprintf("N%d", r), fmt.Sprintf("G%d+M%d", r, r))
		f.SetCellStyle(sheet, fmt.Sprintf("N%d", r), fmt.Sprintf("N%d", r), stDate)
		formulaCount++

		// PRD 5.1: 账龄天数（O列） ='坏账准备与预警分析表'!$B$1-G{i}
		f.SetCellFormula(sheet, fmt.Sprintf("O%d", r), fmt.Sprintf("'%s'!$B$1-G%d", sheetSummary, r))
		f.SetCellStyle(sheet, fmt.Sprintf("O%d", r), fmt.Sprintf("O%d", r), stInt)
		formulaCount++

		// PRD 5.1: 逾期天数（P列） =MAX(0, '坏账准备与预警分析表'!$B$1-N{i})
		f.SetCellFormula(sheet, fmt.Sprintf("P%d", r), fmt.Sprintf("MAX(0, '%s'!$B$1-N%d)", sheetSummary, r))
		f.SetCellStyle(sheet, fmt.Sprintf("P%d", r), fmt.Sprintf("P%d", r), stInt)
		formulaCount++

		// PRD 5.1: 是否逾期（Q列） =IF(AND(P{i}>0, L{i}>0), "是", "否")
		f.SetCellFormula(sheet, fmt.Sprintf("Q%d", r), fmt.Sprintf(`IF(AND(P%d>0, L%d>0), "是", "否")`, r, r))
		f.SetCellStyle(sheet, fmt.Sprintf("Q%d", r), fmt.Sprintf("Q%d", r), stCenter)
		formulaCount++

		if rec.Memo != "" {
			f.SetCellValue(sheet, fmt.Sprintf("R%d", r), rec.Memo)
		}
		f.SetCellStyle(sheet, fmt.Sprintf("R%d", r), fmt.Sprintf("R%d", r), stLeft)

		// Aging 5 columns starting at agingStartCol
		colTier, _ := excelize.ColumnNumberToName(agingStartCol)
		colRate, _ := excelize.ColumnNumberToName(agingStartCol + 1)
		colProv, _ := excelize.ColumnNumberToName(agingStartCol + 2)
		colLvl, _ := excelize.ColumnNumberToName(agingStartCol + 3)
		colAct, _ := excelize.ColumnNumberToName(agingStartCol + 4)

		cTier := fmt.Sprintf("%s%d", colTier, r)
		cRate := fmt.Sprintf("%s%d", colRate, r)
		cProv := fmt.Sprintf("%s%d", colProv, r)
		cLvl := fmt.Sprintf("%s%d", colLvl, r)
		cAct := fmt.Sprintf("%s%d", colAct, r)

		// PRD 5.1: 账龄区间
		f.SetCellFormula(sheet, cTier, buildTierNameFormula(tiers, r))
		f.SetCellStyle(sheet, cTier, cTier, stCenter)
		formulaCount++

		// PRD 5.1: 坏账计提比例
		f.SetCellFormula(sheet, cRate, buildTierRateFormula(tiers, r))
		f.SetCellStyle(sheet, cRate, cRate, stPctCenter)
		formulaCount++

		// PRD 5.1: 坏账准备金额 =ROUND(L{i}*T{i}, 2) (for suspended records, guard negative balance with MAX(0, L{i}))
		if sheet == sheetMain {
			f.SetCellFormula(sheet, cProv, fmt.Sprintf("ROUND(L%d*%s%d, 2)", r, colRate, r))
		} else {
			f.SetCellFormula(sheet, cProv, fmt.Sprintf("ROUND(MAX(0, L%d)*%s%d, 2)", r, colRate, r))
		}
		f.SetCellStyle(sheet, cProv, cProv, stMoney)
		formulaCount++

		// PRD 5.1: 风险预警等级
		lvlTheme := "classic"
		if useMyGoTheme {
			lvlTheme = "soft"
		}
		f.SetCellFormula(sheet, cLvl, buildTierLevelFormula(tiers, r, lvlTheme))
		if st, ok := levelStyles[rec.RiskLevel]; ok {
			f.SetCellStyle(sheet, cLvl, cLvl, st)
		} else {
			f.SetCellStyle(sheet, cLvl, cLvl, stCenter)
		}
		formulaCount++

		// PRD 5.1: 建议措施 =VLOOKUP(S{i}, '坏账准备与预警分析表'!$A$3:$J${lastDataRow}, 10, FALSE)
		f.SetCellFormula(sheet, cAct, fmt.Sprintf("VLOOKUP(%s%d, '%s'!$A$3:$J$%d, 10, FALSE)", colTier, r, sheetSummary, lastDataRow))
		f.SetCellStyle(sheet, cAct, cAct, stLeft)
		formulaCount++
	}

	baseWidths := map[string]float64{
		"A": 8, "B": 12, "C": 30, "D": 10, "E": 10, "F": 10,
		"G": 14, "H": 18, "I": 16, "J": 16, "K": 16, "L": 16,
		"M": 10, "N": 14, "O": 10, "P": 10, "Q": 10, "R": 18,
	}

	// =========================================================================
	// Sheet 1: 应收账款明细(清洗后) (107 normal records)
	// =========================================================================
	headersMain := append(append([]string{}, headers18...), agingCols...)
	f.SetRowHeight(sheetMain, 1, 26)
	for i, h := range headersMain {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetMain, cell, h)
		f.SetCellStyle(sheetMain, cell, cell, stHeaderMain)
	}
	for idx, rec := range res.NormalRecords {
		writeRecordBaseAndFormulas(sheetMain, idx+2, rec, 19)
	}
	for col, w := range baseWidths {
		f.SetColWidth(sheetMain, col, col, w)
	}
	f.SetColWidth(sheetMain, "S", "T", 14)
	f.SetColWidth(sheetMain, "U", "U", 16)
	f.SetColWidth(sheetMain, "V", "V", 14)
	f.SetColWidth(sheetMain, "W", "W", 40)

	// =========================================================================
	// Sheet 3: 挂起异常清单 (13 suspended records)
	// =========================================================================
	headersSusp := append(append([]string{}, headers18...), "异常类型", "处置方式与核实要求")
	headersSusp = append(headersSusp, agingCols...)
	f.SetRowHeight(sheetSuspended, 1, 26)
	for i, h := range headersSusp {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetSuspended, cell, h)
		f.SetCellStyle(sheetSuspended, cell, cell, stHeaderSusp)
	}
	for idx, rec := range res.SuspendedRecords {
		r := idx + 2
		writeRecordBaseAndFormulas(sheetSuspended, r, rec, 21)
		f.SetCellValue(sheetSuspended, fmt.Sprintf("S%d", r), rec.SuspendType)
		f.SetCellStyle(sheetSuspended, fmt.Sprintf("S%d", r), fmt.Sprintf("S%d", r), stSuspType)
		f.SetCellValue(sheetSuspended, fmt.Sprintf("T%d", r), rec.SuspendAction)
		f.SetCellStyle(sheetSuspended, fmt.Sprintf("T%d", r), fmt.Sprintf("T%d", r), stLeft)
	}
	for col, w := range baseWidths {
		f.SetColWidth(sheetSuspended, col, col, w)
	}
	f.SetColWidth(sheetSuspended, "S", "S", 24)
	f.SetColWidth(sheetSuspended, "T", "T", 36)
	f.SetColWidth(sheetSuspended, "U", "V", 14)
	f.SetColWidth(sheetSuspended, "W", "W", 16)
	f.SetColWidth(sheetSuspended, "X", "X", 14)
	f.SetColWidth(sheetSuspended, "Y", "Y", 40)

	// =========================================================================
	// Sheet 4: 全部数据(含处置标记) (120 all records)
	// =========================================================================
	headersAll := append(append([]string{}, headers18...), "数据状态")
	headersAll = append(headersAll, agingCols...)
	f.SetRowHeight(sheetAll, 1, 26)
	for i, h := range headersAll {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetAll, cell, h)
		f.SetCellStyle(sheetAll, cell, cell, stHeaderAll)
	}
	for idx, rec := range res.AllRecords {
		r := idx + 2
		writeRecordBaseAndFormulas(sheetAll, r, rec, 20)
		f.SetCellValue(sheetAll, fmt.Sprintf("S%d", r), rec.DataStatus)
		if rec.IsSuspended {
			f.SetCellStyle(sheetAll, fmt.Sprintf("S%d", r), fmt.Sprintf("S%d", r), stStatusSusp)
		} else {
			f.SetCellStyle(sheetAll, fmt.Sprintf("S%d", r), fmt.Sprintf("S%d", r), stStatusNormal)
		}
	}
	for col, w := range baseWidths {
		f.SetColWidth(sheetAll, col, col, w)
	}
	f.SetColWidth(sheetAll, "S", "S", 28)
	f.SetColWidth(sheetAll, "T", "U", 14)
	f.SetColWidth(sheetAll, "V", "V", 16)
	f.SetColWidth(sheetAll, "W", "W", 14)
	f.SetColWidth(sheetAll, "X", "X", 40)

	// =========================================================================
	// Sheet 5: 客户标准信息表 (20 standard customers)
	// =========================================================================
	custHeaders := []string{"标准编码", "标准名称", "所属区域", "信用等级", "原始表中出现的其他写法"}
	f.SetRowHeight(sheetCust, 1, 25)
	for i, h := range custHeaders {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetCust, cell, h)
		f.SetCellStyle(sheetCust, cell, cell, stHeaderCust)
	}
	custs := res.CustomerStandards
	if len(custs) == 0 {
		custs = DefaultCustomerStandards
	}
	for idx, std := range custs {
		r := idx + 2
		f.SetRowHeight(sheetCust, r, 20)
		f.SetCellValue(sheetCust, fmt.Sprintf("A%d", r), std.Code)
		f.SetCellStyle(sheetCust, fmt.Sprintf("A%d", r), fmt.Sprintf("A%d", r), stCenter)
		f.SetCellValue(sheetCust, fmt.Sprintf("B%d", r), std.Name)
		f.SetCellStyle(sheetCust, fmt.Sprintf("B%d", r), fmt.Sprintf("B%d", r), stLeft)
		f.SetCellValue(sheetCust, fmt.Sprintf("C%d", r), std.Region)
		f.SetCellStyle(sheetCust, fmt.Sprintf("C%d", r), fmt.Sprintf("C%d", r), stCenter)
		f.SetCellValue(sheetCust, fmt.Sprintf("D%d", r), std.Credit)
		f.SetCellStyle(sheetCust, fmt.Sprintf("D%d", r), fmt.Sprintf("D%d", r), stCenter)

		aliasStr := strings.Join(std.Aliases, "、")
		f.SetCellValue(sheetCust, fmt.Sprintf("E%d", r), aliasStr)
		f.SetCellStyle(sheetCust, fmt.Sprintf("E%d", r), fmt.Sprintf("E%d", r), stLeft)
	}
	f.SetColWidth(sheetCust, "A", "A", 14)
	f.SetColWidth(sheetCust, "B", "B", 32)
	f.SetColWidth(sheetCust, "C", "D", 12)
	f.SetColWidth(sheetCust, "E", "E", 30)

	// Freeze top row on sheets
	for _, s := range []string{sheetMain, sheetSuspended, sheetAll, sheetCust} {
		_ = f.SetPanes(s, &excelize.Panes{
			Freeze:      true,
			YSplit:      1,
			TopLeftCell: "A2",
			ActivePane:  "bottomLeft",
		})
	}
	_ = f.SetPanes(sheetSummary, &excelize.Panes{
		Freeze:      true,
		YSplit:      2,
		TopLeftCell: "A3",
		ActivePane:  "bottomLeft",
	})

	calcMode := "auto"
	forceFullCalc := true
	_ = f.SetCalcProps(&excelize.CalcPropsOptions{
		CalcMode:      &calcMode,
		ForceFullCalc: &forceFullCalc,
	})

	f.SetActiveSheet(0)
	_ = f.UpdateLinkedValue()

	outPath := opts.OutputPath
	if outPath == "" {
		outPath = "应收账款明细表_SmartAR动态公式报表.xlsx"
	}
	absPath, err := filepath.Abs(outPath)
	if err == nil {
		outPath = absPath
	}

	if err := f.SaveAs(outPath); err != nil {
		return nil, fmt.Errorf("保存Excel文件失败: %w", err)
	}

	fi, _ := os.Stat(outPath)
	var size int64
	if fi != nil {
		size = fi.Size()
	}

	return &ExportResult{
		SavedPath:  outPath,
		FileName:   filepath.Base(outPath),
		FileSize:   size,
		DurationMs: float64(time.Since(start).Microseconds()) / 1000.0,
		Sheets:     []string{sheetMain, sheetSummary, sheetSuspended, sheetAll, sheetCust},
		FormulaCnt: formulaCount,
	}, nil
}
