// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

package main

import (
	"context"
	_ "embed"
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	"my-doubtful-go/internal/ai"
	"my-doubtful-go/internal/ar"

	"github.com/egoist/mygo"
)

//go:embed resources/sample_raw_ar.xlsx
var embeddedSampleExcel []byte

// SystemInfo describes the runtime environment of SmartAR Desktop.
type SystemInfo struct {
	OS         string `json:"os"`
	Arch       string `json:"arch"`
	GoVersion  string `json:"goVersion"`
	AppVersion string `json:"appVersion"`
	Engine     string `json:"engine"`
}

// SmartARService exposes the 5-step AR cleaning, anomaly audit, aging warning, and dynamic formula Excel engine to the frontend.
type SmartARService struct {
	mu         sync.Mutex
	lastBytes  []byte
	lastSource string
	lastResult *ar.PipelineResult
	lastOpts   ar.PipelineOptions
	aiSvc      *ai.Service
}

// GetSystemInfo returns host platform and Go kernel metadata.
func (s *SmartARService) GetSystemInfo() SystemInfo {
	return SystemInfo{
		OS:         runtime.GOOS,
		Arch:       runtime.GOARCH,
		GoVersion:  runtime.Version(),
		AppVersion: "1.2.0",
		Engine:     "Pure Go + Excelize v2 (No CGo)",
	}
}

// GetDefaultRulePackage returns the default imputation, master data standards, and tier configs.
func (s *SmartARService) GetDefaultRulePackage() ar.RuleConfigPackage {
	return ar.RuleConfigPackage{
		ImputationRules:   ar.DefaultImputationConfig,
		CustomerStandards: ar.DefaultCustomerStandards,
		TierConfigs:       ar.DefaultTierConfigs,
	}
}

// LoadBuiltInSample loads the embedded training dataset (应收账款明细表_原始数据.xlsx) and runs the 5-step pipeline.
func (s *SmartARService) LoadBuiltInSample(asOfDate string) (*ar.PipelineResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if asOfDate == "" {
		if s.lastOpts.AsOfDate != "" {
			asOfDate = s.lastOpts.AsOfDate
		} else {
			asOfDate = "2026-06-30"
		}
	}
	opts := s.lastOpts
	opts.AsOfDate = asOfDate
	res, err := ar.RunPipelineWithOptions(embeddedSampleExcel, "应收账款明细表_原始数据.xlsx", opts)
	if err != nil {
		return nil, err
	}
	s.lastBytes = embeddedSampleExcel
	s.lastSource = "应收账款明细表_原始数据.xlsx"
	s.lastResult = res
	s.lastOpts = opts
	return res, nil
}

// OpenAndProcessFile opens a native OS file picker dialog and runs the 5-step pipeline on the chosen Excel file.
func (s *SmartARService) OpenAndProcessFile(ctx context.Context, asOfDate string) (*ar.PipelineResult, error) {
	paths, err := mygo.Dialog.Open(mygo.OpenDialogOptions{
		Parent: mygo.CallerWindow(ctx),
		Title:  "选择应收账款原始Excel明细表",
		Filters: []mygo.FileFilter{
			{Name: "Excel工作簿 (*.xlsx)", Extensions: []string{"xlsx", "xlsm"}},
		},
		Multiple: false,
	})
	if err != nil {
		return nil, err
	}
	if len(paths) == 0 {
		return nil, nil // User canceled
	}
	return s.ProcessFileFromPath(paths[0], asOfDate)
}

// ProcessFileFromPath reads a local Excel file from disk and runs the 5-step pipeline.
func (s *SmartARService) ProcessFileFromPath(filePath string, asOfDate string) (*ar.PipelineResult, error) {
	if filePath == "" {
		return nil, errors.New("文件路径不能为空")
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("读取文件失败: %w", err)
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	if asOfDate == "" {
		if s.lastOpts.AsOfDate != "" {
			asOfDate = s.lastOpts.AsOfDate
		} else {
			asOfDate = "2026-06-30"
		}
	}
	fileName := filepath.Base(filePath)
	opts := s.lastOpts
	opts.AsOfDate = asOfDate
	res, err := ar.RunPipelineWithOptions(data, fileName, opts)
	if err != nil {
		return nil, err
	}
	s.lastBytes = data
	s.lastSource = fileName
	s.lastResult = res
	s.lastOpts = opts
	_ = mygo.App.AddRecentDocument(filePath)
	return res, nil
}

// ProcessFileFromBase64 decodes a base64-encoded Excel file uploaded via HTML5 drag-and-drop and runs the 5-step pipeline.
func (s *SmartARService) ProcessFileFromBase64(fileName string, base64Data string, asOfDate string) (*ar.PipelineResult, error) {
	data, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return nil, fmt.Errorf("解析上传文件数据失败: %w", err)
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	if asOfDate == "" {
		if s.lastOpts.AsOfDate != "" {
			asOfDate = s.lastOpts.AsOfDate
		} else {
			asOfDate = "2026-06-30"
		}
	}
	if fileName == "" {
		fileName = "上传应收账款明细表.xlsx"
	}
	opts := s.lastOpts
	opts.AsOfDate = asOfDate
	res, err := ar.RunPipelineWithOptions(data, fileName, opts)
	if err != nil {
		return nil, err
	}
	s.lastBytes = data
	s.lastSource = fileName
	s.lastResult = res
	s.lastOpts = opts
	return res, nil
}

// RecalculateWithDate re-runs the 5-step pipeline with a new Report Base Date (报表基准日).
func (s *SmartARService) RecalculateWithDate(asOfDate string) (*ar.PipelineResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if len(s.lastBytes) == 0 {
		s.lastBytes = embeddedSampleExcel
		s.lastSource = "应收账款明细表_原始数据.xlsx"
	}
	opts := s.lastOpts
	opts.AsOfDate = asOfDate
	res, err := ar.RunPipelineWithOptions(s.lastBytes, s.lastSource, opts)
	if err != nil {
		return nil, err
	}
	s.lastOpts = opts
	s.lastResult = res
	return res, nil
}

// RecomputeWithCustomRules re-runs the 5-step pipeline with user-customized imputation, customer master dictionary, and tier standards.
func (s *SmartARService) RecomputeWithCustomRules(opts ar.PipelineOptions) (*ar.PipelineResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if len(s.lastBytes) == 0 {
		s.lastBytes = embeddedSampleExcel
		s.lastSource = "应收账款明细表_原始数据.xlsx"
	}
	if opts.AsOfDate == "" {
		if s.lastOpts.AsOfDate != "" {
			opts.AsOfDate = s.lastOpts.AsOfDate
		} else {
			opts.AsOfDate = "2026-06-30"
		}
	}
	res, err := ar.RunPipelineWithOptions(s.lastBytes, s.lastSource, opts)
	if err != nil {
		return nil, err
	}
	s.lastOpts = opts
	s.lastResult = res
	return res, nil
}

// ResetToDefaultRules resets all imputation rules, customer standards, and tier configs back to the training baseline.
func (s *SmartARService) ResetToDefaultRules(asOfDate string) (*ar.PipelineResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if asOfDate == "" {
		if s.lastOpts.AsOfDate != "" {
			asOfDate = s.lastOpts.AsOfDate
		} else {
			asOfDate = "2026-06-30"
		}
	}
	if len(s.lastBytes) == 0 {
		s.lastBytes = embeddedSampleExcel
		s.lastSource = "应收账款明细表_原始数据.xlsx"
	}
	defaultImp := ar.DefaultImputationConfig
	opts := ar.PipelineOptions{
		AsOfDate:          asOfDate,
		ImputationRules:   &defaultImp,
		CustomerStandards: ar.DefaultCustomerStandards,
		TierConfigs:       ar.DefaultTierConfigs,
	}
	res, err := ar.RunPipelineWithOptions(s.lastBytes, s.lastSource, opts)
	if err != nil {
		return nil, err
	}
	s.lastOpts = opts
	s.lastResult = res
	return res, nil
}

// ExportExcelReport opens a native Save File dialog and exports the 5-sheet dynamic-formula Excel workbook.
func (s *SmartARService) ExportExcelReport(ctx context.Context, themeMode string, asOfDate string) (*ar.ExportResult, error) {
	s.mu.Lock()
	res := s.lastResult
	s.mu.Unlock()

	if res == nil {
		var err error
		res, err = s.LoadBuiltInSample(asOfDate)
		if err != nil {
			return nil, err
		}
	}

	if themeMode == "" {
		themeMode = "classic"
	}
	suffix := "经典预警色卡版"
	if themeMode == "soft" || themeMode == "mygo" {
		suffix = "柔和预警色卡版"
	}
	defaultName := fmt.Sprintf("应收账款明细表_清洗后_动态公式_%s.xlsx", suffix)

	savePath, err := mygo.Dialog.Save(mygo.SaveDialogOptions{
		Parent:      mygo.CallerWindow(ctx),
		Title:       "导出保留全套动态公式的Excel财务工作簿",
		DefaultPath: defaultName,
		Filters: []mygo.FileFilter{
			{Name: "Excel工作簿 (*.xlsx)", Extensions: []string{"xlsx"}},
		},
	})
	if err != nil || savePath == "" {
		return nil, err
	}

	return ar.ExportWorkbook(res, ar.ExportOptions{
		ThemeMode:  themeMode,
		AsOfDate:   asOfDate,
		OutputPath: savePath,
	})
}

// QuickExportToWorkspace exports the 5-sheet dynamic-formula Excel workbook directly to the working directory.
func (s *SmartARService) QuickExportToWorkspace(themeMode string, asOfDate string) (*ar.ExportResult, error) {
	s.mu.Lock()
	res := s.lastResult
	s.mu.Unlock()

	if res == nil {
		var err error
		res, err = s.LoadBuiltInSample(asOfDate)
		if err != nil {
			return nil, err
		}
	}

	if themeMode == "" {
		themeMode = "classic"
	}
	suffix := "经典预警色"
	if themeMode == "soft" || themeMode == "mygo" {
		suffix = "柔和预警色"
	}
	outName := fmt.Sprintf("应收账款智能分析报表_动态公式_%s.xlsx", suffix)

	return ar.ExportWorkbook(res, ar.ExportOptions{
		ThemeMode:  themeMode,
		AsOfDate:   asOfDate,
		OutputPath: outName,
	})
}

// RevealFileInFolder highlights the exported Excel file in Windows Explorer / macOS Finder / Linux File Manager.
func (s *SmartARService) RevealFileInFolder(filePath string) {
	if filePath == "" {
		return
	}
	mygo.Shell.ShowItemInFolder(filePath)
}

// getCurrentRulePackage retrieves the currently configured rules or defaults.
func (s *SmartARService) getCurrentRulePackage() ar.RuleConfigPackage {
	pkg := ar.RuleConfigPackage{
		ImputationRules:   ar.DefaultImputationConfig,
		CustomerStandards: ar.DefaultCustomerStandards,
		TierConfigs:       ar.DefaultTierConfigs,
	}
	if s.lastOpts.ImputationRules != nil {
		pkg.ImputationRules = *s.lastOpts.ImputationRules
	}
	if len(s.lastOpts.CustomerStandards) > 0 {
		pkg.CustomerStandards = s.lastOpts.CustomerStandards
	}
	if len(s.lastOpts.TierConfigs) > 0 {
		pkg.TierConfigs = s.lastOpts.TierConfigs
	}
	return pkg
}

// GetAIConfig returns user-configured AI model and credentials.
func (s *SmartARService) GetAIConfig() ai.AIConfig {
	if s.aiSvc == nil {
		s.aiSvc = ai.NewService()
	}
	return s.aiSvc.GetConfig()
}

// SaveAIConfig saves user-configured AI settings.
func (s *SmartARService) SaveAIConfig(cfg ai.AIConfig) error {
	if s.aiSvc == nil {
		s.aiSvc = ai.NewService()
	}
	return s.aiSvc.SaveConfig(cfg)
}

// TestAIConnection probes model endpoint latency and validity.
func (s *SmartARService) TestAIConnection(ctx context.Context, cfg ai.AIConfig) (string, error) {
	if s.aiSvc == nil {
		s.aiSvc = ai.NewService()
	}
	return s.aiSvc.TestConnection(ctx, cfg)
}

// FetchAIModels queries the configured AI provider endpoint to list available models.
func (s *SmartARService) FetchAIModels(ctx context.Context, cfg ai.AIConfig) ([]string, error) {
	if s.aiSvc == nil {
		s.aiSvc = ai.NewService()
	}
	return s.aiSvc.FetchModels(ctx, cfg)
}

// OpenStandaloneAIWindow creates a new native desktop window dedicated to the AI assistant.
func (s *SmartARService) OpenStandaloneAIWindow(darkMode bool) error {
	url := "/?mode=ai-standalone"
	if darkMode {
		url += "&dark=1"
	} else {
		url += "&dark=0"
	}
	mygo.NewWindow(mygo.WindowOptions{
		Title:           "SmartAR AI财务助手",
		Width:           520,
		Height:          850,
		MinWidth:        360,
		MinHeight:       500,
		BackgroundColor: "light-dark(#ffffff, #09090b)",
		StateKey:        "smartar-ai-standalone",
		URL:             url,
		Page: mygo.PageOptions{
			DevTools: mygo.DevToolsEnabled,
		},
	})
	return nil
}

// StreamAIChat executes Eino ReAct agent with financial tools and streams tokens to channel.
func (s *SmartARService) StreamAIChat(ctx context.Context, history []ai.ChatMessage, stream *mygo.Channel[ai.StreamChunk]) error {
	s.mu.Lock()
	res := s.lastResult
	rules := s.getCurrentRulePackage()
	s.mu.Unlock()

	if s.aiSvc == nil {
		s.aiSvc = ai.NewService()
	}
	return s.aiSvc.StreamChat(ctx, history, res, &rules, stream)
}

// StreamAuditReport synthesizes an executive management report using Eino Graph and streams tokens.
func (s *SmartARService) StreamAuditReport(ctx context.Context, req ai.ReportGenRequest, stream *mygo.Channel[ai.StreamChunk]) (*ai.ReportResult, error) {
	s.mu.Lock()
	res := s.lastResult
	s.mu.Unlock()

	if s.aiSvc == nil {
		s.aiSvc = ai.NewService()
	}
	return s.aiSvc.GenerateAuditReport(ctx, req, res, stream)
}

// ApplyAIProposal approves a rule update proposal, applies it, and recomputes the pipeline.
func (s *SmartARService) ApplyAIProposal(proposalID string) (*ar.PipelineResult, error) {
	if s.aiSvc == nil {
		s.aiSvc = ai.NewService()
	}
	newRules, err := s.aiSvc.ApplyProposal(proposalID)
	if err != nil {
		return nil, err
	}
	s.mu.Lock()
	asOf := s.lastOpts.AsOfDate
	s.mu.Unlock()

	opts := ar.PipelineOptions{
		AsOfDate:          asOf,
		ImputationRules:   &newRules.ImputationRules,
		CustomerStandards: newRules.CustomerStandards,
		TierConfigs:       newRules.TierConfigs,
	}
	return s.RecomputeWithCustomRules(opts)
}

// RejectAIProposal rejects a rule update proposal.
func (s *SmartARService) RejectAIProposal(proposalID string) error {
	if s.aiSvc == nil {
		s.aiSvc = ai.NewService()
	}
	return s.aiSvc.RejectProposal(proposalID)
}

// ToggleDevTools toggles the developer tools inspector window for debugging.
func (s *SmartARService) ToggleDevTools(ctx context.Context) {
	win := mygo.CallerWindow(ctx)
	if win != nil && win.Page() != nil {
		win.Page().ToggleDevTools()
	}
}

func init() {
	if runtime.GOOS == "windows" {
		// Enable Chromium Blink text-autospace layout engine and ensure system Chinese locale in WebView2
		args := os.Getenv("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS")
		if !strings.Contains(args, "CSSTextAutoSpace") {
			if args != "" {
				args += " "
			}
			args += "--enable-blink-features=CSSTextAutoSpace"
		}
		if !strings.Contains(args, "--lang=") {
			if args != "" {
				args += " "
			}
			args += "--lang=zh-CN"
		}
		_ = os.Setenv("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", args)
	}
}

func main() {
	mygo.App.SetLanguages("zh-CN", "zh-Hans", "zh")

	svc := &SmartARService{
		aiSvc: ai.NewService(),
	}
	mygo.Bind(svc)

	mygo.App.OnWindowAllClosed(func() {
		if runtime.GOOS != "darwin" {
			mygo.App.Quit()
		}
	})

	mygo.App.WhenReady(func() {
		mygo.NewWindow(mygo.WindowOptions{
			Title:           "SmartAR Desktop—智能应收账款账龄分析与坏账预警系统",
			Width:           1440,
			Height:          900,
			MinWidth:        1080,
			MinHeight:       700,
			BackgroundColor: "light-dark(#ffffff, #09090b)",
			StateKey:        "smartar-main",
			URL:             "/",
			Page: mygo.PageOptions{
				DevTools: mygo.DevToolsEnabled,
			},
		})
	})

	if err := mygo.App.Run(); err != nil {
		log.Fatal(err)
	}
}
