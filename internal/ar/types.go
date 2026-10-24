// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

package ar

// CustomerStandard defines one of the 20 standard customer master records.
type CustomerStandard struct {
	Code    string   `json:"code"`
	Name    string   `json:"name"`
	Region  string   `json:"region"`
	Credit  string   `json:"credit"`
	Aliases []string `json:"aliases"`
}

// TierConfig defines an aging tier, bad debt provision rate, and MyGO!!!!! theme metadata.
type TierConfig struct {
	Name            string  `json:"name"`
	RangeText       string  `json:"rangeText"`
	MinDays         int     `json:"minDays"`
	MaxDays         int     `json:"maxDays"`
	Rate            float64 `json:"rate"`
	ClassicLevel    string  `json:"classicLevel"`
	MyGoLevel       string  `json:"mygoLevel"`
	Character       string  `json:"character"`
	ColorHex        string  `json:"colorHex"`
	SoftTintHex     string  `json:"softTintHex"`
	TextColorHex    string  `json:"textColorHex"`
	ExcelFillHex    string  `json:"excelFillHex"`
	ExcelFontHex    string  `json:"excelFontHex"`
	Metaphor        string  `json:"metaphor"`
	SuggestedAction string  `json:"suggestedAction"`
}

// ARRecord represents a cleaned and analyzed accounts receivable line item.
type ARRecord struct {
	Seq             int      `json:"seq"`
	OrigRow         int      `json:"origRow"`
	CustCode        string   `json:"custCode"`
	CustName        string   `json:"custName"`
	RawCustCode     string   `json:"rawCustCode"`
	RawCustName     string   `json:"rawCustName"`
	Salesperson     string   `json:"salesperson"`
	Region          string   `json:"region"`
	CreditLevel     string   `json:"creditLevel"`
	InvoiceDate     string   `json:"invoiceDate"`
	InvoiceNo       string   `json:"invoiceNo"`
	ContractNo      string   `json:"contractNo"`
	ARAmount        float64  `json:"arAmount"`
	ReceivedAmount  float64  `json:"receivedAmount"`
	BalanceAmount   float64  `json:"balanceAmount"`
	CreditTermDays  int      `json:"creditTermDays"`
	DueDate         string   `json:"dueDate"`
	AgeDays         int      `json:"ageDays"`
	OverdueDays     int      `json:"overdueDays"`
	IsOverdue       string   `json:"isOverdue"`
	Memo            string   `json:"memo"`
	AgingTier       string   `json:"agingTier"`
	ProvisionRate   float64  `json:"provisionRate"`
	ProvisionAmount float64  `json:"provisionAmount"`
	RiskLevel       string   `json:"riskLevel"`
	MyGoLevel       string   `json:"mygoLevel"`
	MyGoCharacter   string   `json:"mygoCharacter"`
	MyGoColor       string   `json:"mygoColor"`
	SuggestedAction string   `json:"suggestedAction"`
	IsSuspended     bool     `json:"isSuspended"`
	SuspendType     string   `json:"suspendType,omitempty"`
	SuspendAction   string   `json:"suspendAction,omitempty"`
	DataStatus      string   `json:"dataStatus"`
	RepairedFields  []string `json:"repairedFields"`
	AnomalyTags     []string `json:"anomalyTags"`
}

// MissingLogEntry records how a missing cell was imputed in Step 2.
type MissingLogEntry struct {
	Field        string `json:"field"`
	Seq          int    `json:"seq"`
	CustCode     string `json:"custCode"`
	CustName     string `json:"custName"`
	RawValue     string `json:"rawValue"`
	FilledValue  string `json:"filledValue"`
	RuleDesc     string `json:"ruleDesc"`
}

// MissingSummary summarizes missing value repairs for one field.
type MissingSummary struct {
	Field         string            `json:"field"`
	ExpectedCount int               `json:"expectedCount"`
	ActualCount   int               `json:"actualCount"`
	Items         []MissingLogEntry `json:"items"`
}

// AnomalyLogEntry records a detected data anomaly in Step 3.
type AnomalyLogEntry struct {
	Category    string `json:"category"`
	Disposition string `json:"disposition"` // "in_place_repair" or "suspended"
	Seq         int    `json:"seq"`
	CustCode    string `json:"custCode"`
	CustName    string `json:"custName"`
	InvoiceNo   string `json:"invoiceNo"`
	Description string `json:"description"`
	Action      string `json:"action"`
}

// AnomalySummary summarizes one of the 9 anomaly categories.
type AnomalySummary struct {
	Category      string            `json:"category"`
	Disposition   string            `json:"disposition"`
	ExpectedCount int               `json:"expectedCount"`
	ActualCount   int               `json:"actualCount"`
	RuleAction    string            `json:"ruleAction"`
	Items         []AnomalyLogEntry `json:"items"`
}

// StructureCleanReport summarizes Step 1 structural cleaning.
type StructureCleanReport struct {
	RawTotalRows       int      `json:"rawTotalRows"`
	HeaderRowIndex     int      `json:"headerRowIndex"`
	PreHeaderRows      []int    `json:"preHeaderRows"`
	EmptyRowIndices    []int    `json:"emptyRowIndices"`
	SubtotalRowIndices []int    `json:"subtotalRowIndices"`
	DuplicateRowIndices []int   `json:"duplicateRowIndices"`
	ValidRecordCount   int      `json:"validRecordCount"`
	RemovedTotalCount  int      `json:"removedTotalCount"`
	Details            []string `json:"details"`
}

// TierSummaryRow represents one row in Sheet 2 (坏账准备与预警分析表).
type TierSummaryRow struct {
	AgingTier       string  `json:"agingTier"`
	RangeText       string  `json:"rangeText"`
	RiskLevel       string  `json:"riskLevel"`
	MyGoLevel       string  `json:"mygoLevel"`
	Character       string  `json:"character"`
	ColorHex        string  `json:"colorHex"`
	Count           int     `json:"count"`
	CountRatio      float64 `json:"countRatio"`
	BalanceSum      float64 `json:"balanceSum"`
	BalanceRatio    float64 `json:"balanceRatio"`
	ProvisionRate   float64 `json:"provisionRate"`
	ProvisionSum    float64 `json:"provisionSum"`
	SuggestedAction string  `json:"suggestedAction"`
}

// RegionSummary represents regional statistics for radar/bar charts.
type RegionSummary struct {
	Region          string  `json:"region"`
	RecordCount     int     `json:"recordCount"`
	ARTotal         float64 `json:"arTotal"`
	ReceivedTotal   float64 `json:"receivedTotal"`
	BalanceTotal    float64 `json:"balanceTotal"`
	ProvisionTotal  float64 `json:"provisionTotal"`
	OverdueCount    int     `json:"overdueCount"`
	OverdueBalance  float64 `json:"overdueBalance"`
	CollectionRate  float64 `json:"collectionRate"`
}

// CustomerRiskSummary represents per-customer aggregated risk metrics.
type CustomerRiskSummary struct {
	CustCode       string  `json:"custCode"`
	CustName       string  `json:"custName"`
	Region         string  `json:"region"`
	CreditLevel    string  `json:"creditLevel"`
	TermModeDays   int     `json:"termModeDays"`
	RecordCount    int     `json:"recordCount"`
	ARTotal        float64 `json:"arTotal"`
	ReceivedTotal  float64 `json:"receivedTotal"`
	BalanceTotal   float64 `json:"balanceTotal"`
	ProvisionTotal float64 `json:"provisionTotal"`
	MaxAgeDays     int     `json:"maxAgeDays"`
	MaxOverdueDays int     `json:"maxOverdueDays"`
	HighestRisk    string  `json:"highestRisk"`
	MyGoCharacter  string  `json:"mygoCharacter"`
	MyGoColor      string  `json:"mygoColor"`
}

// PipelineResult holds the complete 5-step pipeline output returned to the frontend.
type PipelineResult struct {
	SourceFileName     string                `json:"sourceFileName"`
	AsOfDate           string                `json:"asOfDate"`
	ProcessedAt        string                `json:"processedAt"`
	DurationMs         float64               `json:"durationMs"`
	StructureReport    StructureCleanReport  `json:"structureReport"`
	MissingSummaries   []MissingSummary      `json:"missingSummaries"`
	TotalMissingFixed  int                   `json:"totalMissingFixed"`
	AnomalySummaries   []AnomalySummary      `json:"anomalySummaries"`
	TotalInPlaceFixed  int                   `json:"totalInPlaceFixed"`
	TotalSuspended     int                   `json:"totalSuspended"`
	NormalCount        int                   `json:"normalCount"`
	NormalARTotal      float64               `json:"normalArTotal"`
	NormalRecTotal     float64               `json:"normalRecTotal"`
	NormalBalTotal     float64               `json:"normalBalTotal"`
	NormalProvTotal    float64               `json:"normalProvTotal"`
	OverallProvRate    float64               `json:"overallProvRate"`
	OverdueCount       int                   `json:"overdueCount"`
	OverdueBalTotal    float64               `json:"overdueBalTotal"`
	SuspendedARTotal   float64               `json:"suspendedArTotal"`
	SuspendedRecTotal  float64               `json:"suspendedRecTotal"`
	SuspendedBalTotal  float64               `json:"suspendedBalTotal"`
	SuspendedProvTotal float64               `json:"suspendedProvTotal"`
	TierSummaries      []TierSummaryRow      `json:"tierSummaries"`
	RegionSummaries    []RegionSummary       `json:"regionSummaries"`
	CustomerSummaries  []CustomerRiskSummary `json:"customerSummaries"`
	NormalRecords      []ARRecord            `json:"normalRecords"`
	SuspendedRecords   []ARRecord            `json:"suspendedRecords"`
	AllRecords         []ARRecord            `json:"allRecords"`
	CustomerStandards  []CustomerStandard    `json:"customerStandards"`
	TierConfigs        []TierConfig          `json:"tierConfigs"`
	ImputationRules    ImputationConfig      `json:"imputationRules"`
}

// ImputationConfig defines custom missing value imputation rules and anomaly thresholds.
type ImputationConfig struct {
	TermStrategy              string  `json:"termStrategy"`              // "mode" (众数优先) or "fixed" (固定账期)
	TermFallbackDays          int     `json:"termFallbackDays"`          // 默认缺省账期 (默认 60 天)
	DefaultCreditLevel        string  `json:"defaultCreditLevel"`        // 默认信用等级 (默认 "B")
	OverdueGraceDays          int     `json:"overdueGraceDays"`          // 逾期宽限天数 (默认 0 天)
	LowAmountOutlierThreshold float64 `json:"lowAmountOutlierThreshold"` // 离群小额异常阈值 (默认 20000.0 元)
}

// PipelineOptions allows users to customize the 5-step analysis rules.
type PipelineOptions struct {
	AsOfDate          string             `json:"asOfDate"`
	ImputationRules   *ImputationConfig  `json:"imputationRules,omitempty"`
	CustomerStandards []CustomerStandard `json:"customerStandards,omitempty"`
	TierConfigs       []TierConfig       `json:"tierConfigs,omitempty"`
}

// RuleConfigPackage bundles all configurable rule sets for frontend management.
type RuleConfigPackage struct {
	ImputationRules   ImputationConfig   `json:"imputationRules"`
	CustomerStandards []CustomerStandard `json:"customerStandards"`
	TierConfigs       []TierConfig       `json:"tierConfigs"`
}

// ExportOptions configures the Excel report generation.
type ExportOptions struct {
	ThemeMode  string `json:"themeMode"`  // "mygo" or "classic"
	AsOfDate   string `json:"asOfDate"`   // e.g. "2026-06-30"
	OutputPath string `json:"outputPath"` // optional explicit save path
}

// ExportResult describes the exported Excel workbook.
type ExportResult struct {
	SavedPath  string   `json:"savedPath"`
	FileName   string   `json:"fileName"`
	FileSize   int64    `json:"fileSize"`
	DurationMs float64  `json:"durationMs"`
	Sheets     []string `json:"sheets"`
	FormulaCnt int      `json:"formulaCnt"`
}
