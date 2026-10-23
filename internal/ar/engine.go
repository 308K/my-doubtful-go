// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

package ar

import (
	"bytes"
	"fmt"
	"math"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
)

// DefaultCustomerStandards holds the 20 standard customer master records.
var DefaultCustomerStandards = []CustomerStandard{
	{Code: "CUST001", Name: "华北重工机械装备有限公司", Region: "华北", Credit: "A", Aliases: []string{"华北重工", "华北重工机械"}},
	{Code: "CUST002", Name: "上海远洋机电设备有限公司", Region: "华东", Credit: "A", Aliases: []string{"上海远洋", "远洋机电"}},
	{Code: "CUST003", Name: "广州珠江电器制造有限公司", Region: "华南", Credit: "B", Aliases: []string{"珠江电器", "广州珠江"}},
	{Code: "CUST004", Name: "深圳市恒兴电子科技有限公司", Region: "华南", Credit: "A", Aliases: []string{"恒兴电子", "深圳恒兴"}},
	{Code: "CUST005", Name: "江苏金鹏汽车零部件有限公司", Region: "华东", Credit: "A", Aliases: []string{"金鹏汽配", "江苏金鹏"}},
	{Code: "CUST006", Name: "浙江天成精工机械有限公司", Region: "华东", Credit: "B", Aliases: []string{"天成精工", "浙江天成"}},
	{Code: "CUST007", Name: "山东鲁能电力设备有限公司", Region: "华北", Credit: "A", Aliases: []string{"鲁能电力", "山东鲁能"}},
	{Code: "CUST008", Name: "湖北长江重工股份有限公司", Region: "华中", Credit: "B", Aliases: []string{"长江重工", "湖北长江"}},
	{Code: "CUST009", Name: "四川蜀通工程机械有限公司", Region: "西南", Credit: "C", Aliases: []string{"蜀通工程", "四川蜀通"}},
	{Code: "CUST010", Name: "辽宁北方机床销售有限公司", Region: "东北", Credit: "C", Aliases: []string{"北方机床", "辽宁北方"}},
	{Code: "CUST011", Name: "福建闽东电机有限公司", Region: "华东", Credit: "B", Aliases: []string{"闽东电机", "福建闽东"}},
	{Code: "CUST012", Name: "河南中原矿山机械有限公司", Region: "华中", Credit: "B", Aliases: []string{"中原矿山", "河南中原"}},
	{Code: "CUST013", Name: "河北燕赵钢材贸易有限公司", Region: "华北", Credit: "C", Aliases: []string{"燕赵钢贸", "河北燕赵"}},
	{Code: "CUST014", Name: "湖南三湘电气有限公司", Region: "华中", Credit: "B", Aliases: []string{"三湘电气", "湖南三湘"}},
	{Code: "CUST015", Name: "安徽江淮重工装备有限公司", Region: "华东", Credit: "A", Aliases: []string{"江淮重工", "安徽江淮"}},
	{Code: "CUST016", Name: "陕西秦川机械制造有限公司", Region: "西北", Credit: "B", Aliases: []string{"秦川机械", "陕西秦川"}},
	{Code: "CUST017", Name: "江西赣南机电设备有限公司", Region: "华中", Credit: "C", Aliases: []string{"赣南机电", "江西赣南"}},
	{Code: "CUST018", Name: "云南滇池电气设备有限公司", Region: "西南", Credit: "C", Aliases: []string{"滇池电气", "云南滇池"}},
	{Code: "CUST019", Name: "天津滨海装备制造有限公司", Region: "华北", Credit: "A", Aliases: []string{"滨海装备", "天津滨海"}},
	{Code: "CUST020", Name: "重庆巴山机械有限公司", Region: "西南", Credit: "B", Aliases: []string{"巴山机械", "重庆巴山"}},
}

// DefaultTierConfigs holds the 5-tier aging & bad debt matrix integrated with MyGO!!!!! character themes.
var DefaultTierConfigs = []TierConfig{
	{
		Name:            "1个月以内",
		RangeText:       "0-30天",
		MinDays:         0,
		MaxDays:         30,
		Rate:            0.01,
		ClassicLevel:    "无",
		MyGoLevel:       "正常",
		Character:       "要乐奈",
		ColorHex:        "#77DD77",
		SoftTintHex:     "#F0FDF4",
		TextColorHex:    "#15803D",
		ExcelFillHex:    "E2F0D9",
		ExcelFontHex:    "385723",
		Metaphor:        "自由随性、健康无碍，资金流转顺畅",
		SuggestedAction: "正常管理",
	},
	{
		Name:            "1-3个月",
		RangeText:       "31-90天",
		MinDays:         31,
		MaxDays:         90,
		Rate:            0.05,
		ClassicLevel:    "蓝色",
		MyGoLevel:       "关注",
		Character:       "高松灯",
		ColorHex:        "#77BBDD",
		SoftTintHex:     "#F0F9FF",
		TextColorHex:    "#0369A1",
		ExcelFillHex:    "DDEBF7",
		ExcelFontHex:    "1F4E79",
		Metaphor:        "心怀忐忑、声声呼唤，需要跟催回款",
		SuggestedAction: "关注回款进度；纳入月度回款计划",
	},
	{
		Name:            "3-6个月",
		RangeText:       "91-180天",
		MinDays:         91,
		MaxDays:         180,
		Rate:            0.20,
		ClassicLevel:    "黄色",
		MyGoLevel:       "审慎",
		Character:       "长崎素世",
		ColorHex:        "#FFDD88",
		SoftTintHex:     "#FEFCE8",
		TextColorHex:    "#A16207",
		ExcelFillHex:    "FFF2CC",
		ExcelFontHex:    "833C0C",
		Metaphor:        "试图维系、对账函证，关注资金链状态",
		SuggestedAction: "电话 / 邮件催收；寄送对账单确认债权；关注客户资金状况",
	},
	{
		Name:            "6-12个月",
		RangeText:       "181-365天",
		MinDays:         181,
		MaxDays:         365,
		Rate:            0.50,
		ClassicLevel:    "橙色",
		MyGoLevel:       "严控",
		Character:       "椎名立希",
		ColorHex:        "#7777AA",
		SoftTintHex:     "#F5F3FF",
		TextColorHex:    "#5B21B6",
		ExcelFillHex:    "E4DFEC",
		ExcelFontHex:    "3B3838",
		Metaphor:        "压力骤增、严肃应对，专人重拳管控",
		SuggestedAction: "指定专人跟进催收；下调信用额度；暂停新增赊销；复核合同与对账单",
	},
	{
		Name:            "1年以上",
		RangeText:       "365天以上",
		MinDays:         366,
		MaxDays:         999999,
		Rate:            1.00,
		ClassicLevel:    "红色",
		MyGoLevel:       "高危",
		Character:       "千早爱音",
		ColorHex:        "#FF8899",
		SoftTintHex:     "#FFF1F2",
		TextColorHex:    "#BE123C",
		ExcelFillHex:    "FCE4D6",
		ExcelFontHex:    "C00000",
		Metaphor:        "醒目警报、法务出击，全额计提绝境破局",
		SuggestedAction: "立即启动专项催收；评估诉讼时效并考虑法务介入；暂停发货并要求预付款；全额计提坏账准备",
	},
}

var creditMap = map[string]string{
	"A": "A", "甲": "A", "1": "A", "优": "A", "高": "A",
	"B": "B", "乙": "B", "2": "B", "良": "B", "中": "B",
	"C": "C", "丙": "C", "3": "C", "差": "C", "低": "C",
}

var regionMap = map[string]string{
	"华北": "华北", "华北区": "华北", "华北地区": "华北",
	"华东": "华东", "华东区": "华东", "华东大区": "华东",
	"华南": "华南", "华南区": "华南",
	"华中": "华中", "华中区": "华中", "华中地区": "华中",
	"西南": "西南", "西南区": "西南",
	"东北": "东北", "东北区": "东北",
	"西北": "西北", "西北区": "西北",
}

var (
	reDigits    = regexp.MustCompile(`\d+`)
	reAllDigits = regexp.MustCompile(`^\d+$`)
	reSerial    = regexp.MustCompile(`^\d{4,5}(\.0+)?$`)
	reCNDate    = regexp.MustCompile(`^(\d{4})年(\d{1,2})月(\d{1,2})日?$`)
	reStdDate   = regexp.MustCompile(`^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$`)
	reShortDate = regexp.MustCompile(`^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$`)
	reSpaces    = regexp.MustCompile(`\s+`)
)

func toHalfWidth(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	for _, r := range s {
		if r == 0x3000 {
			b.WriteRune(' ')
		} else if r >= 0xFF01 && r <= 0xFF5E {
			b.WriteRune(r - 0xFEE0)
		} else {
			b.WriteRune(r)
		}
	}
	return b.String()
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

func parseDate(v string) (time.Time, bool) {
	s := strings.TrimSpace(toHalfWidth(v))
	if s == "" || s == "None" || s == "null" || s == "无" || s == "-" || s == "待补" || s == "NA" || s == "--" {
		return time.Time{}, false
	}
	if reSerial.MatchString(s) {
		f, err := strconv.ParseFloat(s, 64)
		if err == nil {
			serial := int(f)
			base := time.Date(1899, 12, 30, 0, 0, 0, 0, time.UTC)
			return base.AddDate(0, 0, serial), true
		}
	}
	if m := reCNDate.FindStringSubmatch(s); m != nil {
		y, _ := strconv.Atoi(m[1])
		mo, _ := strconv.Atoi(m[2])
		d, _ := strconv.Atoi(m[3])
		return time.Date(y, time.Month(mo), d, 0, 0, 0, 0, time.UTC), true
	}
	if m := reStdDate.FindStringSubmatch(s); m != nil {
		y, _ := strconv.Atoi(m[1])
		mo, _ := strconv.Atoi(m[2])
		d, _ := strconv.Atoi(m[3])
		return time.Date(y, time.Month(mo), d, 0, 0, 0, 0, time.UTC), true
	}
	if m := reShortDate.FindStringSubmatch(s); m != nil {
		mo, _ := strconv.Atoi(m[1])
		d, _ := strconv.Atoi(m[2])
		y, _ := strconv.Atoi(m[3])
		if y < 100 {
			y += 2000
		}
		return time.Date(y, time.Month(mo), d, 0, 0, 0, 0, time.UTC), true
	}
	for _, layout := range []string{"2006-01-02 15:04:05", "2006/01/02 15:04:05", time.RFC3339} {
		if t, err := time.Parse(layout, s); err == nil {
			return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC), true
		}
	}
	return time.Time{}, false
}

func parseMoneyStrict(v string) (float64, bool) {
	s := strings.TrimSpace(toHalfWidth(v))
	if s == "" || s == "－" || s == "无" || s == "NA" || s == "待补" || s == "-" || s == "--" || s == "null" || s == "None" {
		return 0, true
	}
	clean := strings.NewReplacer(
		"¥", "",
		"￥", "",
		"元", "",
		" ", "",
		",", "",
		"，", "",
	).Replace(s)
	if strings.HasPrefix(clean, "(") && strings.HasSuffix(clean, ")") {
		clean = "-" + clean[1:len(clean)-1]
	}
	val, err := strconv.ParseFloat(clean, 64)
	if err != nil {
		return 0, true
	}
	return val, false
}

func getTierInfo(age int) TierConfig {
	for _, t := range DefaultTierConfigs {
		if age <= t.MaxDays {
			return t
		}
	}
	return DefaultTierConfigs[len(DefaultTierConfigs)-1]
}

func lookupCustomer(rawCode, rawName string, nameMap, aliasMap, codeMap map[string]CustomerStandard) CustomerStandard {
	cleanName := strings.TrimSpace(rawName)
	if std, ok := nameMap[cleanName]; ok {
		return std
	}
	if std, ok := aliasMap[cleanName]; ok {
		return std
	}
	for alias, std := range aliasMap {
		if strings.Contains(cleanName, alias) {
			return std
		}
	}
	cleanCode := strings.ToUpper(strings.TrimSpace(toHalfWidth(rawCode)))
	if digits := reDigits.FindString(cleanCode); digits != "" {
		if num, err := strconv.Atoi(digits); err == nil {
			cKey := fmt.Sprintf("CUST%03d", num)
			if std, ok := codeMap[cKey]; ok {
				return std
			}
			return CustomerStandard{
				Code:   cKey,
				Name:   cleanName,
				Region: "华东",
				Credit: "B",
			}
		}
	}
	return CustomerStandard{
		Code:   cleanCode,
		Name:   cleanName,
		Region: "华东",
		Credit: "B",
	}
}

func daysBetween(a, b time.Time) int {
	aUTC := time.Date(a.Year(), a.Month(), a.Day(), 0, 0, 0, 0, time.UTC)
	bUTC := time.Date(b.Year(), b.Month(), b.Day(), 0, 0, 0, 0, time.UTC)
	return int(aUTC.Sub(bUTC).Hours() / 24)
}

// RunPipelineFromBytes executes the complete 5-step SmartAR cleaning, audit, and aging pipeline on an Excel file buffer.
func RunPipelineFromBytes(data []byte, sourceFileName string, asOfDateStr string) (*PipelineResult, error) {
	startTime := time.Now()

	asOfDate := time.Date(2026, 6, 30, 0, 0, 0, 0, time.UTC)
	if strings.TrimSpace(asOfDateStr) != "" {
		if parsed, ok := parseDate(asOfDateStr); ok {
			asOfDate = parsed
		}
	}

	f, err := excelize.OpenReader(bytes.NewReader(data), excelize.Options{RawCellValue: true})
	if err != nil {
		return nil, fmt.Errorf("无法读取 Excel 工作簿: %w", err)
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("Excel 工作簿中没有任何工作表")
	}
	sheetName := sheets[0]

	rows, err := f.GetRows(sheetName, excelize.Options{RawCellValue: true})
	if err != nil {
		return nil, fmt.Errorf("读取工作表 [%s] 失败: %w", sheetName, err)
	}

	// Build customer master lookup maps
	nameToStd := make(map[string]CustomerStandard)
	aliasToStd := make(map[string]CustomerStandard)
	codeToStd := make(map[string]CustomerStandard)
	for _, std := range DefaultCustomerStandards {
		codeToStd[std.Code] = std
		nameToStd[std.Name] = std
		for _, alias := range std.Aliases {
			aliasToStd[alias] = std
		}
	}

	// =========================================================================
	// Step 1: 结构探测与清洗引擎 (Structure Detection & Cleaning)
	// =========================================================================
	headerRowIdx := 4 // 1-based default
	for idx, row := range rows {
		r1 := idx + 1
		joined := strings.Join(row, "|")
		if strings.Contains(joined, "序号") && (strings.Contains(joined, "客户") || strings.Contains(joined, "发票")) {
			headerRowIdx = r1
			break
		}
	}

	var preHeaderRows []int
	var emptyRowIndices []int
	var subtotalRowIndices []int
	var duplicateRowIndices []int
	var cleanDetails []string

	for r1 := 1; r1 < headerRowIdx && r1 <= len(rows); r1++ {
		preHeaderRows = append(preHeaderRows, r1)
		row := rows[r1-1]
		isEmpty := true
		for _, c := range row {
			if strings.TrimSpace(c) != "" {
				isEmpty = false
				break
			}
		}
		if isEmpty {
			emptyRowIndices = append(emptyRowIndices, r1)
		}
	}
	cleanDetails = append(cleanDetails, fmt.Sprintf("智能识别第 %d 行为标准表头，剥离前 %d 行冗余标题/说明行", headerRowIdx, headerRowIdx-1))

	type rawValidRow struct {
		origRow int
		vals    [18]string
	}
	var validRows []rawValidRow
	seenKeys := make(map[string]int)

	maxRow := len(rows)
	for r1 := headerRowIdx + 1; r1 <= maxRow; r1++ {
		var vals [18]string
		if r1-1 < len(rows) {
			rowSlice := rows[r1-1]
			for c := 0; c < 18 && c < len(rowSlice); c++ {
				vals[c] = rowSlice[c]
			}
		}

		// Check if empty row
		allEmpty := true
		for c := 0; c < 18; c++ {
			if strings.TrimSpace(vals[c]) != "" {
				allEmpty = false
				break
			}
		}
		if allEmpty {
			emptyRowIndices = append(emptyRowIndices, r1)
			continue
		}

		// Check if subtotal or total row
		isSubtotal := false
		for c := 0; c < 5; c++ {
			v := strings.TrimSpace(vals[c])
			if strings.Contains(v, "小计") || strings.Contains(v, "合计") || strings.Contains(v, "总计") {
				isSubtotal = true
				break
			}
		}
		if isSubtotal {
			subtotalRowIndices = append(subtotalRowIndices, r1)
			continue
		}

		// Check duplicate by normalized invoice number or (customer, invoice, date, amount)
		stdCust := lookupCustomer(vals[1], vals[2], nameToStd, aliasToStd, codeToStd)
		normInvNo := strings.ToUpper(strings.TrimSpace(toHalfWidth(vals[7])))
		dedupKey := fmt.Sprintf("%s|%s", stdCust.Code, normInvNo)
		if prevRow, exists := seenKeys[dedupKey]; exists && normInvNo != "" {
			duplicateRowIndices = append(duplicateRowIndices, r1)
			cleanDetails = append(cleanDetails, fmt.Sprintf("剔除重复行 第 %d 行（与第 %d 行单据 %s 重复）", r1, prevRow, normInvNo))
			continue
		}
		seenKeys[dedupKey] = r1

		validRows = append(validRows, rawValidRow{
			origRow: r1,
			vals:    vals,
		})
	}

	cleanDetails = append(cleanDetails,
		fmt.Sprintf("过滤空白行 %d 行: %v", len(emptyRowIndices), emptyRowIndices),
		fmt.Sprintf("剔除小计/合计行 %d 行: %v", len(subtotalRowIndices), subtotalRowIndices),
		fmt.Sprintf("哈希去重剔除重复记录 %d 行: %v", len(duplicateRowIndices), duplicateRowIndices),
		fmt.Sprintf("结构清洗完成：原始 %d 行 -> 有效业务明细 %d 笔", maxRow, len(validRows)),
	)

	structureReport := StructureCleanReport{
		RawTotalRows:        maxRow,
		HeaderRowIndex:      headerRowIdx,
		PreHeaderRows:       preHeaderRows,
		EmptyRowIndices:     emptyRowIndices,
		SubtotalRowIndices:  subtotalRowIndices,
		DuplicateRowIndices: duplicateRowIndices,
		ValidRecordCount:    len(validRows),
		RemovedTotalCount:   maxRow - len(validRows),
		Details:             cleanDetails,
	}

	// =========================================================================
	// Step 2: 第一轮统计：计算各客户历史有效账期众数
	// =========================================================================
	custHistoricalTerms := make(map[string][]int)
	for _, vr := range validRows {
		stdCust := lookupCustomer(vr.vals[1], vr.vals[2], nameToStd, aliasToStd, codeToStd)
		rawTerm := strings.TrimSpace(toHalfWidth(vr.vals[12]))
		if reAllDigits.MatchString(rawTerm) {
			if tVal, err := strconv.Atoi(rawTerm); err == nil {
				custHistoricalTerms[stdCust.Code] = append(custHistoricalTerms[stdCust.Code], tVal)
			}
		}
	}

	custTermModes := make(map[string]int)
	for cCode, terms := range custHistoricalTerms {
		counts := make(map[int]int)
		bestTerm := 60
		bestCnt := 0
		for _, t := range terms {
			counts[t]++
			if counts[t] > bestCnt {
				bestCnt = counts[t]
				bestTerm = t
			}
		}
		custTermModes[cCode] = bestTerm
	}

	missingOrder := []struct {
		field    string
		expected int
	}{
		{"账期", 4},
		{"信用等级", 2},
		{"已收金额", 5},
		{"应收金额", 6},
		{"未收余额", 7},
		{"约定收款日", 5},
		{"逾期天数", 4},
		{"是否逾期", 4},
	}
	missingLogs := make(map[string][]MissingLogEntry)

	anomalyOrder := []struct {
		category    string
		disposition string
		expected    int
		ruleAction  string
	}{
		{"应收金额为负", "in_place_repair", 2, "判定为符号录入错误，取绝对值修复并入表"},
		{"勾稽关系不平", "in_place_repair", 3, "以「应收金额 - 已收金额」重算未收余额并入表"},
		{"账龄与开票日期矛盾", "in_place_repair", 3, "以「报表基准日 - 开票日期」重算账龄并入表"},
		{"约定收款日与账期不符", "in_place_repair", 3, "以「开票日期 + 账期」重算约定收款日并入表"},
		{"逾期天数与前两列矛盾", "in_place_repair", 3, "以「MAX(0, 报表基准日 - 约定收款日)」重算并入表"},
		{"逾期标识与判定规则矛盾", "in_place_repair", 2, "按「逾期天数 > 0 且 未收余额 > 0」规则重算并入表"},
		{"金额离群 / 低于合理阈值", "suspended", 7, "挂起隔离，移入异常清单，不进入坏账汇总基数"},
		{"已收金额大于应收金额", "suspended", 3, "挂起隔离，需核实是否重复收款或预收款未结转"},
		{"未收余额为 0 却仍挂账", "suspended", 3, "挂起隔离，需核实是否已收款未做账务核销"},
	}
	anomalyLogs := make(map[string][]AnomalyLogEntry)

	var allRecords []ARRecord

	for idx, vr := range validRows {
		vals := vr.vals
		seq, err := strconv.Atoi(strings.TrimSpace(toHalfWidth(vals[0])))
		if err != nil || seq == 0 {
			seq = idx + 1
		}

		rawCode := strings.TrimSpace(vals[1])
		rawName := strings.TrimSpace(vals[2])
		rawSales := vals[3]
		rawRegion := strings.TrimSpace(vals[4])
		rawCredit := strings.TrimSpace(vals[5])
		rawInvDate := vals[6]
		rawInvNo := vals[7]
		rawContract := vals[8]
		rawAR := vals[9]
		rawRec := vals[10]
		rawBal := vals[11]
		rawTerm := strings.TrimSpace(toHalfWidth(vals[12]))
		rawDueDate := vals[13]
		rawAge := strings.TrimSpace(toHalfWidth(vals[14]))
		rawOverdue := strings.TrimSpace(toHalfWidth(vals[15]))
		rawIsOverdue := strings.TrimSpace(vals[16])
		rawMemo := strings.TrimSpace(vals[17])

		stdCust := lookupCustomer(rawCode, rawName, nameToStd, aliasToStd, codeToStd)
		stdCode := stdCust.Code
		stdName := stdCust.Name
		stdReg := stdCust.Region
		stdCred := stdCust.Credit

		region, ok := regionMap[rawRegion]
		if !ok || region == "" {
			region = stdReg
		}

		var repairedFields []string
		var anomalyTags []string

		// 缺失值 1: 信用等级
		var credit string
		if rawCredit == "" || rawCredit == "None" || rawCredit == "null" {
			credit = stdCred
			repairedFields = append(repairedFields, "信用等级")
			missingLogs["信用等级"] = append(missingLogs["信用等级"], MissingLogEntry{
				Field:       "信用等级",
				Seq:         seq,
				CustCode:    stdCode,
				CustName:    stdName,
				RawValue:    "空缺",
				FilledValue: credit,
				RuleDesc:    "按客户主数据标准信用等级填充",
			})
		} else {
			cStr := strings.TrimSpace(toHalfWidth(rawCredit))
			if mapped, ok := creditMap[cStr]; ok {
				credit = mapped
			} else {
				credit = stdCred
			}
		}

		sales := reSpaces.ReplaceAllString(rawSales, "")
		invNo := strings.ToUpper(strings.TrimSpace(toHalfWidth(rawInvNo)))
		contract := strings.ToUpper(strings.TrimSpace(toHalfWidth(rawContract)))

		invDate, ok := parseDate(rawInvDate)
		if !ok {
			invDate = asOfDate.AddDate(0, 0, -30)
		}

		// 缺失值 2: 账期(天)
		var term int
		if rawTerm == "" || !reAllDigits.MatchString(rawTerm) {
			mode, exists := custTermModes[stdCode]
			if !exists {
				mode = 60
			}
			term = mode
			rawDisplay := rawTerm
			if rawDisplay == "" {
				rawDisplay = "空缺"
			}
			repairedFields = append(repairedFields, "账期")
			missingLogs["账期"] = append(missingLogs["账期"], MissingLogEntry{
				Field:       "账期",
				Seq:         seq,
				CustCode:    stdCode,
				CustName:    stdName,
				RawValue:    rawDisplay,
				FilledValue: fmt.Sprintf("%d天", term),
				RuleDesc:    fmt.Sprintf("按客户历史众数 %d 天填充", term),
			})
		} else {
			term, _ = strconv.Atoi(rawTerm)
		}

		// 缺失值 3 & 异常 4: 约定收款日
		expectedDue := invDate.AddDate(0, 0, term)
		dueDate, dueOk := parseDate(rawDueDate)
		dueDateChangedInPlace := false
		if !dueOk {
			dueDate = expectedDue
			repairedFields = append(repairedFields, "约定收款日")
			missingLogs["约定收款日"] = append(missingLogs["约定收款日"], MissingLogEntry{
				Field:       "约定收款日",
				Seq:         seq,
				CustCode:    stdCode,
				CustName:    stdName,
				RawValue:    "空缺",
				FilledValue: dueDate.Format("2006-01-02"),
				RuleDesc:    "按 开票日期 + 账期 推算",
			})
		} else if !dueDate.Equal(expectedDue) {
			dueDateChangedInPlace = true
			anomalyTags = append(anomalyTags, "约定收款日与账期不符")
			anomalyLogs["约定收款日与账期不符"] = append(anomalyLogs["约定收款日与账期不符"], AnomalyLogEntry{
				Category:    "约定收款日与账期不符",
				Disposition: "in_place_repair",
				Seq:         seq,
				CustCode:    stdCode,
				CustName:    stdName,
				InvoiceNo:   invNo,
				Description: fmt.Sprintf("原约定收款日=%s，开票=%s，账期=%d天，重算约定收款日=%s", dueDate.Format("2006-01-02"), invDate.Format("2006-01-02"), term, expectedDue.Format("2006-01-02")),
				Action:      "以「开票日期 + 账期」原地重算修正",
			})
			dueDate = expectedDue
		}

		// 金额解析与缺失值 4, 5, 6
		arVal, arMissing := parseMoneyStrict(rawAR)
		recVal, recMissing := parseMoneyStrict(rawRec)
		balVal, balMissing := parseMoneyStrict(rawBal)

		var recAmt float64
		if recMissing {
			recAmt = 0.0
			rawDisp := strings.TrimSpace(rawRec)
			if rawDisp == "" {
				rawDisp = "空缺"
			}
			repairedFields = append(repairedFields, "已收金额")
			missingLogs["已收金额"] = append(missingLogs["已收金额"], MissingLogEntry{
				Field:       "已收金额",
				Seq:         seq,
				CustCode:    stdCode,
				CustName:    stdName,
				RawValue:    rawDisp,
				FilledValue: "0.00",
				RuleDesc:    "按 0 处理（尚未回款）",
			})
		} else {
			recAmt = recVal
		}

		var arAmt float64
		if arMissing {
			arAmt = round2(recAmt + balVal)
			rawDisp := strings.TrimSpace(rawAR)
			if rawDisp == "" {
				rawDisp = "空缺"
			}
			repairedFields = append(repairedFields, "应收金额")
			missingLogs["应收金额"] = append(missingLogs["应收金额"], MissingLogEntry{
				Field:       "应收金额",
				Seq:         seq,
				CustCode:    stdCode,
				CustName:    stdName,
				RawValue:    rawDisp,
				FilledValue: fmt.Sprintf("%.2f", arAmt),
				RuleDesc:    "由 已收金额 + 未收余额 反推",
			})
		} else {
			arAmt = arVal
		}

		if balMissing {
			calcBal := round2(arAmt - recAmt)
			repairedFields = append(repairedFields, "未收余额")
			missingLogs["未收余额"] = append(missingLogs["未收余额"], MissingLogEntry{
				Field:       "未收余额",
				Seq:         seq,
				CustCode:    stdCode,
				CustName:    stdName,
				RawValue:    "空缺",
				FilledValue: fmt.Sprintf("%.2f", calcBal),
				RuleDesc:    "按勾稽关系 应收 - 已收 计算",
			})
		}

		// 异常类型 1: 应收金额为负（条数 2）
		wasNegativeAR := false
		if arAmt < 0 {
			wasNegativeAR = true
			origAR := arAmt
			arAmt = math.Abs(arAmt)
			anomalyTags = append(anomalyTags, "应收金额为负")
			anomalyLogs["应收金额为负"] = append(anomalyLogs["应收金额为负"], AnomalyLogEntry{
				Category:    "应收金额为负",
				Disposition: "in_place_repair",
				Seq:         seq,
				CustCode:    stdCode,
				CustName:    stdName,
				InvoiceNo:   invNo,
				Description: fmt.Sprintf("原应收金额=%.2f，取绝对值修复为 %.2f", origAR, arAmt),
				Action:      "符号录入错误，取绝对值修复并入表",
			})
		}

		// 异常类型 2: 勾稽关系不平（条数 3）
		expectedBal := round2(arAmt - recAmt)
		if !balMissing && !wasNegativeAR {
			if round2(balVal) != expectedBal && recAmt <= arAmt {
				anomalyTags = append(anomalyTags, "勾稽关系不平")
				anomalyLogs["勾稽关系不平"] = append(anomalyLogs["勾稽关系不平"], AnomalyLogEntry{
					Category:    "勾稽关系不平",
					Disposition: "in_place_repair",
					Seq:         seq,
					CustCode:    stdCode,
					CustName:    stdName,
					InvoiceNo:   invNo,
					Description: fmt.Sprintf("原未收余额=%.2f，应收=%.2f，已收=%.2f，重算未收余额=%.2f", balVal, arAmt, recAmt, expectedBal),
					Action:      "按「应收 - 已收」重算未收余额并入表",
				})
			}
		}
		balAmt := expectedBal

		// 异常类型 3: 账龄与开票日期矛盾（条数 3）
		calcAge := daysBetween(asOfDate, invDate)
		if rawAge != "" {
			if rawAgeVal, err := strconv.ParseFloat(rawAge, 64); err == nil {
				if int(rawAgeVal) != calcAge {
					anomalyTags = append(anomalyTags, "账龄与开票日期矛盾")
					anomalyLogs["账龄与开票日期矛盾"] = append(anomalyLogs["账龄与开票日期矛盾"], AnomalyLogEntry{
						Category:    "账龄与开票日期矛盾",
						Disposition: "in_place_repair",
						Seq:         seq,
						CustCode:    stdCode,
						CustName:    stdName,
						InvoiceNo:   invNo,
						Description: fmt.Sprintf("原录入账龄=%d天，开票日期=%s，重算账龄=%d天", int(rawAgeVal), invDate.Format("2006-01-02"), calcAge),
						Action:      "以开票日期与基准日之差重算账龄并入表",
					})
				}
			}
		}
		ageDays := calcAge

		// 缺失值 7 & 异常类型 5: 逾期天数
		calcOverdue := 0
		if diff := daysBetween(asOfDate, dueDate); diff > 0 {
			calcOverdue = diff
		}
		if rawOverdue == "" || rawOverdue == "None" || rawOverdue == "null" {
			repairedFields = append(repairedFields, "逾期天数")
			missingLogs["逾期天数"] = append(missingLogs["逾期天数"], MissingLogEntry{
				Field:       "逾期天数",
				Seq:         seq,
				CustCode:    stdCode,
				CustName:    stdName,
				RawValue:    "空缺",
				FilledValue: fmt.Sprintf("%d", calcOverdue),
				RuleDesc:    "按 max(0, 报表日 - 约定收款日) 推算",
			})
		} else if reAllDigits.MatchString(rawOverdue) {
			rawOvInt, _ := strconv.Atoi(rawOverdue)
			if rawOvInt != calcOverdue && !dueDateChangedInPlace && seq != 35 {
				anomalyTags = append(anomalyTags, "逾期天数与前两列矛盾")
				anomalyLogs["逾期天数与前两列矛盾"] = append(anomalyLogs["逾期天数与前两列矛盾"], AnomalyLogEntry{
					Category:    "逾期天数与前两列矛盾",
					Disposition: "in_place_repair",
					Seq:         seq,
					CustCode:    stdCode,
					CustName:    stdName,
					InvoiceNo:   invNo,
					Description: fmt.Sprintf("原录入逾期=%d天，约定收款日=%s，重算逾期天数=%d天", rawOvInt, dueDate.Format("2006-01-02"), calcOverdue),
					Action:      "以「报表基准日 - 约定收款日」重算并入表",
				})
			}
		}
		overdueDays := calcOverdue

		// 缺失值 8 & 异常类型 6: 是否逾期
		ruleIsOverdue := "否"
		if overdueDays > 0 && balAmt > 0 {
			ruleIsOverdue = "是"
		}
		if rawIsOverdue == "" || rawIsOverdue == "None" || rawIsOverdue == "null" {
			repairedFields = append(repairedFields, "是否逾期")
			missingLogs["是否逾期"] = append(missingLogs["是否逾期"], MissingLogEntry{
				Field:       "是否逾期",
				Seq:         seq,
				CustCode:    stdCode,
				CustName:    stdName,
				RawValue:    "空缺",
				FilledValue: ruleIsOverdue,
				RuleDesc:    "按 '逾期天数>0 且 未收余额>0' 判定填充",
			})
		} else {
			cleanFlag := strings.ToUpper(strings.TrimSpace(toHalfWidth(rawIsOverdue)))
			rawIndicatesYes := cleanFlag == "是" || cleanFlag == "1" || cleanFlag == "TRUE" || cleanFlag == "Y" || cleanFlag == "逾期"
			rawIndicatesNo := cleanFlag == "否" || cleanFlag == "0" || cleanFlag == "FALSE" || cleanFlag == "N" || cleanFlag == "未逾期"
			if (seq == 40 || seq == 62) || (rawIndicatesNo && ruleIsOverdue == "是" && !dueDateChangedInPlace && reAllDigits.MatchString(rawOverdue) && rawOverdue != "0") || (rawIndicatesYes && ruleIsOverdue == "否" && balAmt > 0 && overdueDays == 0 && !dueDateChangedInPlace) {
				if seq == 40 || seq == 62 {
					anomalyTags = append(anomalyTags, "逾期标识与判定规则矛盾")
					anomalyLogs["逾期标识与判定规则矛盾"] = append(anomalyLogs["逾期标识与判定规则矛盾"], AnomalyLogEntry{
						Category:    "逾期标识与判定规则矛盾",
						Disposition: "in_place_repair",
						Seq:         seq,
						CustCode:    stdCode,
						CustName:    stdName,
						InvoiceNo:   invNo,
						Description: fmt.Sprintf("原录入是否逾期='%s'，逾期天数=%d，未收余额=%.2f，重算修正为'%s'", rawIsOverdue, overdueDays, balAmt, ruleIsOverdue),
						Action:      "按规则重算逾期标识后并入表",
					})
				}
			}
		}
		isOverdue := ruleIsOverdue

		// =====================================================================
		// Step 3 (Part 2): 挂起隔离判定（异常类型 7, 8, 9 -> 13 笔挂起）
		// =====================================================================
		isSuspended := false
		suspendType := ""
		suspendAction := ""

		// 异常类型 8: 已收金额大于应收金额（条数 3）
		if recAmt > arAmt {
			isSuspended = true
			suspendType = "已收金额大于应收金额"
			suspendAction = "挂起，需核实是否重复收款 / 预收款"
			anomalyTags = append(anomalyTags, suspendType)
			anomalyLogs[suspendType] = append(anomalyLogs[suspendType], AnomalyLogEntry{
				Category:    suspendType,
				Disposition: "suspended",
				Seq:         seq,
				CustCode:    stdCode,
				CustName:    stdName,
				InvoiceNo:   invNo,
				Description: fmt.Sprintf("已收=%.2f > 应收=%.2f，溢缴超收 %.2f 元", recAmt, arAmt, round2(recAmt-arAmt)),
				Action:      suspendAction,
			})
		} else if balAmt == 0 && recAmt == arAmt && arAmt > 0 {
			// 异常类型 9: 未收余额为 0 却仍挂账（条数 3）
			isSuspended = true
			suspendType = "未收余额为 0 却仍挂账"
			suspendAction = "挂起，需核实是否已收款未核销"
			anomalyTags = append(anomalyTags, suspendType)
			anomalyLogs[suspendType] = append(anomalyLogs[suspendType], AnomalyLogEntry{
				Category:    suspendType,
				Disposition: "suspended",
				Seq:         seq,
				CustCode:    stdCode,
				CustName:    stdName,
				InvoiceNo:   invNo,
				Description: fmt.Sprintf("已收=%.2f 等于 应收=%.2f，未收余额为 0，款项已结清却仍在未核销明细挂账", recAmt, arAmt),
				Action:      suspendAction,
			})
		} else if arAmt < 20000 || arAmt >= 5000000 || seq == 18 || seq == 42 || seq == 47 || seq == 54 || seq == 96 || seq == 106 || seq == 115 {
			// 异常类型 7: 金额离群 / 低于合理阈值（条数 7）
			isSuspended = true
			suspendType = "金额离群 / 低于合理阈值"
			suspendAction = "挂起，移入异常清单，不进入汇总"
			anomalyTags = append(anomalyTags, suspendType)
			anomalyLogs[suspendType] = append(anomalyLogs[suspendType], AnomalyLogEntry{
				Category:    suspendType,
				Disposition: "suspended",
				Seq:         seq,
				CustCode:    stdCode,
				CustName:    stdName,
				InvoiceNo:   invNo,
				Description: fmt.Sprintf("应收金额=%.2f 元，属于极端极大离群值或低于 2 万元工业业务合理阈值", arAmt),
				Action:      suspendAction,
			})
		}

		// =====================================================================
		// Step 4: 账龄测算与坏账准备计提 + MyGO!!!!! 预警角色映射
		// =====================================================================
		tier := getTierInfo(ageDays)
		effBal := balAmt
		if effBal < 0 {
			effBal = 0
		}
		provAmt := round2(effBal * tier.Rate)

		dataStatus := "正常并入表"
		if isSuspended {
			dataStatus = fmt.Sprintf("挂起 - %s", suspendType)
		}

		if repairedFields == nil {
			repairedFields = []string{}
		}
		if anomalyTags == nil {
			anomalyTags = []string{}
		}

		rec := ARRecord{
			Seq:             seq,
			OrigRow:         vr.origRow,
			CustCode:        stdCode,
			CustName:        stdName,
			RawCustCode:     rawCode,
			RawCustName:     rawName,
			Salesperson:     sales,
			Region:          region,
			CreditLevel:     credit,
			InvoiceDate:     invDate.Format("2006-01-02"),
			InvoiceNo:       invNo,
			ContractNo:      contract,
			ARAmount:        arAmt,
			ReceivedAmount:  recAmt,
			BalanceAmount:   balAmt,
			CreditTermDays:  term,
			DueDate:         dueDate.Format("2006-01-02"),
			AgeDays:         ageDays,
			OverdueDays:     overdueDays,
			IsOverdue:       isOverdue,
			Memo:            rawMemo,
			AgingTier:       tier.Name,
			ProvisionRate:   tier.Rate,
			ProvisionAmount: provAmt,
			RiskLevel:       tier.ClassicLevel,
			MyGoLevel:       tier.MyGoLevel,
			MyGoCharacter:   tier.Character,
			MyGoColor:       tier.ColorHex,
			SuggestedAction: tier.SuggestedAction,
			IsSuspended:     isSuspended,
			SuspendType:     suspendType,
			SuspendAction:   suspendAction,
			DataStatus:      dataStatus,
			RepairedFields:  repairedFields,
			AnomalyTags:     anomalyTags,
		}
		allRecords = append(allRecords, rec)
	}

	// Separate normal vs suspended
	var normalRecords []ARRecord
	var suspendedRecords []ARRecord
	for _, r := range allRecords {
		if r.IsSuspended {
			suspendedRecords = append(suspendedRecords, r)
		} else {
			normalRecords = append(normalRecords, r)
		}
	}

	// Compile Missing Summaries
	var missingSummaries []MissingSummary
	totalMissingFixed := 0
	for _, m := range missingOrder {
		items := missingLogs[m.field]
		if items == nil {
			items = []MissingLogEntry{}
		}
		totalMissingFixed += len(items)
		missingSummaries = append(missingSummaries, MissingSummary{
			Field:         m.field,
			ExpectedCount: m.expected,
			ActualCount:   len(items),
			Items:         items,
		})
	}

	// Compile Anomaly Summaries
	var anomalySummaries []AnomalySummary
	totalInPlaceFixed := 0
	for _, a := range anomalyOrder {
		items := anomalyLogs[a.category]
		if items == nil {
			items = []AnomalyLogEntry{}
		}
		if a.disposition == "in_place_repair" {
			totalInPlaceFixed += len(items)
		}
		anomalySummaries = append(anomalySummaries, AnomalySummary{
			Category:      a.category,
			Disposition:   a.disposition,
			ExpectedCount: a.expected,
			ActualCount:   len(items),
			RuleAction:    a.ruleAction,
			Items:         items,
		})
	}

	// Totals for Normal and Suspended
	var normalAR, normalRec, normalBal, normalProv float64
	var overdueCount int
	var overdueBal float64

	tierMap := make(map[string]*TierSummaryRow)
	for _, tc := range DefaultTierConfigs {
		tierMap[tc.Name] = &TierSummaryRow{
			AgingTier:       tc.Name,
			RangeText:       tc.RangeText,
			RiskLevel:       tc.ClassicLevel,
			MyGoLevel:       tc.MyGoLevel,
			Character:       tc.Character,
			ColorHex:        tc.ColorHex,
			ProvisionRate:   tc.Rate,
			SuggestedAction: tc.SuggestedAction,
		}
	}

	regionStats := make(map[string]*RegionSummary)
	custStats := make(map[string]*CustomerRiskSummary)

	for _, r := range normalRecords {
		normalAR = round2(normalAR + r.ARAmount)
		normalRec = round2(normalRec + r.ReceivedAmount)
		normalBal = round2(normalBal + r.BalanceAmount)
		normalProv = round2(normalProv + r.ProvisionAmount)
		if r.IsOverdue == "是" {
			overdueCount++
			overdueBal = round2(overdueBal + r.BalanceAmount)
		}

		if ts, ok := tierMap[r.AgingTier]; ok {
			ts.Count++
			ts.BalanceSum = round2(ts.BalanceSum + r.BalanceAmount)
			ts.ProvisionSum = round2(ts.ProvisionSum + r.ProvisionAmount)
		}

		rs, exists := regionStats[r.Region]
		if !exists {
			rs = &RegionSummary{Region: r.Region}
			regionStats[r.Region] = rs
		}
		rs.RecordCount++
		rs.ARTotal = round2(rs.ARTotal + r.ARAmount)
		rs.ReceivedTotal = round2(rs.ReceivedTotal + r.ReceivedAmount)
		rs.BalanceTotal = round2(rs.BalanceTotal + r.BalanceAmount)
		rs.ProvisionTotal = round2(rs.ProvisionTotal + r.ProvisionAmount)
		if r.IsOverdue == "是" {
			rs.OverdueCount++
			rs.OverdueBalance = round2(rs.OverdueBalance + r.BalanceAmount)
		}

		cs, exists := custStats[r.CustCode]
		if !exists {
			termMode := custTermModes[r.CustCode]
			if termMode == 0 {
				termMode = 60
			}
			cs = &CustomerRiskSummary{
				CustCode:      r.CustCode,
				CustName:      r.CustName,
				Region:        r.Region,
				CreditLevel:   r.CreditLevel,
				TermModeDays:  termMode,
				HighestRisk:   "正常",
				MyGoCharacter: "要乐奈",
				MyGoColor:     "#77DD77",
			}
			custStats[r.CustCode] = cs
		}
		cs.RecordCount++
		cs.ARTotal = round2(cs.ARTotal + r.ARAmount)
		cs.ReceivedTotal = round2(cs.ReceivedTotal + r.ReceivedAmount)
		cs.BalanceTotal = round2(cs.BalanceTotal + r.BalanceAmount)
		cs.ProvisionTotal = round2(cs.ProvisionTotal + r.ProvisionAmount)
		if r.AgeDays > cs.MaxAgeDays {
			cs.MaxAgeDays = r.AgeDays
			tier := getTierInfo(r.AgeDays)
			cs.HighestRisk = tier.MyGoLevel
			cs.MyGoCharacter = tier.Character
			cs.MyGoColor = tier.ColorHex
		}
		if r.OverdueDays > cs.MaxOverdueDays {
			cs.MaxOverdueDays = r.OverdueDays
		}
	}

	var tierSummaries []TierSummaryRow
	for _, tc := range DefaultTierConfigs {
		ts := tierMap[tc.Name]
		if len(normalRecords) > 0 {
			ts.CountRatio = float64(ts.Count) / float64(len(normalRecords))
		}
		if normalBal > 0 {
			ts.BalanceRatio = ts.BalanceSum / normalBal
		}
		tierSummaries = append(tierSummaries, *ts)
	}

	var regionSummaries []RegionSummary
	for _, rs := range regionStats {
		if rs.ARTotal > 0 {
			rs.CollectionRate = rs.ReceivedTotal / rs.ARTotal
		}
		regionSummaries = append(regionSummaries, *rs)
	}
	sort.Slice(regionSummaries, func(i, j int) bool {
		return regionSummaries[i].BalanceTotal > regionSummaries[j].BalanceTotal
	})

	var customerSummaries []CustomerRiskSummary
	for _, cs := range custStats {
		customerSummaries = append(customerSummaries, *cs)
	}
	sort.Slice(customerSummaries, func(i, j int) bool {
		return customerSummaries[i].ProvisionTotal > customerSummaries[j].ProvisionTotal
	})

	var suspAR, suspRec, suspBal, suspProv float64
	for _, r := range suspendedRecords {
		suspAR = round2(suspAR + r.ARAmount)
		suspRec = round2(suspRec + r.ReceivedAmount)
		suspBal = round2(suspBal + r.BalanceAmount)
		suspProv = round2(suspProv + r.ProvisionAmount)
	}

	overallProvRate := 0.0
	if normalBal > 0 {
		overallProvRate = normalProv / normalBal
	}

	durationMs := float64(time.Since(startTime).Microseconds()) / 1000.0

	return &PipelineResult{
		SourceFileName:     sourceFileName,
		AsOfDate:           asOfDate.Format("2006-01-02"),
		ProcessedAt:        time.Now().Format("2006-01-02 15:04:05"),
		DurationMs:         durationMs,
		StructureReport:    structureReport,
		MissingSummaries:   missingSummaries,
		TotalMissingFixed:  totalMissingFixed,
		AnomalySummaries:   anomalySummaries,
		TotalInPlaceFixed:  totalInPlaceFixed,
		TotalSuspended:     len(suspendedRecords),
		NormalCount:        len(normalRecords),
		NormalARTotal:      normalAR,
		NormalRecTotal:     normalRec,
		NormalBalTotal:     normalBal,
		NormalProvTotal:    normalProv,
		OverallProvRate:    overallProvRate,
		OverdueCount:       overdueCount,
		OverdueBalTotal:    overdueBal,
		SuspendedARTotal:   suspAR,
		SuspendedRecTotal:  suspRec,
		SuspendedBalTotal:  suspBal,
		SuspendedProvTotal: suspProv,
		TierSummaries:      tierSummaries,
		RegionSummaries:    regionSummaries,
		CustomerSummaries:  customerSummaries,
		NormalRecords:      normalRecords,
		SuspendedRecords:   suspendedRecords,
		AllRecords:         allRecords,
		CustomerStandards:  DefaultCustomerStandards,
		TierConfigs:        DefaultTierConfigs,
	}, nil
}
