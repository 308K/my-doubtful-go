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
	"sync"

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

// SmartARService exposes the 5-step AR cleaning, anomaly audit, MyGO!!!!! aging warning, and dynamic formula Excel engine to the frontend.
type SmartARService struct {
	mu         sync.Mutex
	lastBytes  []byte
	lastSource string
	lastResult *ar.PipelineResult
}

// GetSystemInfo returns host platform and Go kernel metadata.
func (s *SmartARService) GetSystemInfo() SystemInfo {
	return SystemInfo{
		OS:         runtime.GOOS,
		Arch:       runtime.GOARCH,
		GoVersion:  runtime.Version(),
		AppVersion: "1.1.0",
		Engine:     "MyGo v0.6 + Excelize v2 (Pure Go / No CGo)",
	}
}

// LoadBuiltInSample loads the embedded training dataset (应收账款明细表_原始数据.xlsx) and runs the 5-step pipeline.
func (s *SmartARService) LoadBuiltInSample(asOfDate string) (*ar.PipelineResult, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if asOfDate == "" {
		asOfDate = "2026-06-30"
	}
	res, err := ar.RunPipelineFromBytes(embeddedSampleExcel, "应收账款明细表_原始数据.xlsx", asOfDate)
	if err != nil {
		return nil, err
	}
	s.lastBytes = embeddedSampleExcel
	s.lastSource = "应收账款明细表_原始数据.xlsx"
	s.lastResult = res
	return res, nil
}

// OpenAndProcessFile opens a native OS file picker dialog and runs the 5-step pipeline on the chosen Excel file.
func (s *SmartARService) OpenAndProcessFile(ctx context.Context, asOfDate string) (*ar.PipelineResult, error) {
	paths, err := mygo.Dialog.Open(mygo.OpenDialogOptions{
		Parent: mygo.CallerWindow(ctx),
		Title:  "选择应收账款原始 Excel 明细表",
		Filters: []mygo.FileFilter{
			{Name: "Excel 工作簿 (*.xlsx)", Extensions: []string{"xlsx", "xlsm"}},
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
		asOfDate = "2026-06-30"
	}
	fileName := filepath.Base(filePath)
	res, err := ar.RunPipelineFromBytes(data, fileName, asOfDate)
	if err != nil {
		return nil, err
	}
	s.lastBytes = data
	s.lastSource = fileName
	s.lastResult = res
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
		asOfDate = "2026-06-30"
	}
	if fileName == "" {
		fileName = "上传应收账款明细表.xlsx"
	}
	res, err := ar.RunPipelineFromBytes(data, fileName, asOfDate)
	if err != nil {
		return nil, err
	}
	s.lastBytes = data
	s.lastSource = fileName
	s.lastResult = res
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
	res, err := ar.RunPipelineFromBytes(s.lastBytes, s.lastSource, asOfDate)
	if err != nil {
		return nil, err
	}
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

	suffix := "MyGO潮流色卡版"
	if themeMode == "classic" {
		suffix = "标准财务色卡版"
	}
	defaultName := fmt.Sprintf("应收账款明细表_清洗后_动态公式_%s.xlsx", suffix)

	savePath, err := mygo.Dialog.Save(mygo.SaveDialogOptions{
		Parent:      mygo.CallerWindow(ctx),
		Title:       "导出保留全套动态公式的 Excel 财务工作簿",
		DefaultPath: defaultName,
		Filters: []mygo.FileFilter{
			{Name: "Excel 工作簿 (*.xlsx)", Extensions: []string{"xlsx"}},
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

	suffix := "MyGO色卡"
	if themeMode == "classic" {
		suffix = "标准财务"
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

func main() {
	svc := &SmartARService{}
	mygo.Bind(svc)

	mygo.App.OnWindowAllClosed(func() {
		if runtime.GOOS != "darwin" {
			mygo.App.Quit()
		}
	})

	mygo.App.WhenReady(func() {
		mygo.NewWindow(mygo.WindowOptions{
			Title:           "SmartAR Desktop — 智能应收账款账龄分析与坏账预警工作台 (MyGO!!!!! Edition)",
			Width:           1440,
			Height:          900,
			MinWidth:        1080,
			MinHeight:       700,
			BackgroundColor: "light-dark(#f8fafc, #090d16)",
			StateKey:        "smartar-main",
			URL:             "/",
		})
	})

	if err := mygo.App.Run(); err != nil {
		log.Fatal(err)
	}
}
