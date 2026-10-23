// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

package ar

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/xuri/excelize/v2"
)

func TestPipelineAndExportOnSampleDataset(t *testing.T) {
	samplePath := filepath.Join("..", "..", "resources", "sample_raw_ar.xlsx")
	rawBytes, err := os.ReadFile(samplePath)
	if err != nil {
		t.Fatalf("failed to read sample Excel file: %v", err)
	}

	res, err := RunPipelineFromBytes(rawBytes, "应收账款明细表_原始数据.xlsx", "2026-06-30")
	if err != nil {
		t.Fatalf("RunPipelineFromBytes failed: %v", err)
	}

	t.Logf("Structure report: raw=%d, header=%d, empty=%v, subtotal=%v, dup=%v, valid=%d",
		res.StructureReport.RawTotalRows,
		res.StructureReport.HeaderRowIndex,
		res.StructureReport.EmptyRowIndices,
		res.StructureReport.SubtotalRowIndices,
		res.StructureReport.DuplicateRowIndices,
		res.StructureReport.ValidRecordCount,
	)

	if res.StructureReport.ValidRecordCount != 120 {
		t.Errorf("expected 120 valid records after Step 1, got %d", res.StructureReport.ValidRecordCount)
	}
	if res.NormalCount != 107 {
		t.Errorf("expected 107 normal records, got %d", res.NormalCount)
	}
	if res.TotalSuspended != 13 {
		t.Errorf("expected 13 suspended records, got %d", res.TotalSuspended)
	}

	for _, ms := range res.MissingSummaries {
		t.Logf("Missing [%s]: expected=%d, actual=%d", ms.Field, ms.ExpectedCount, ms.ActualCount)
		if ms.ActualCount != ms.ExpectedCount {
			t.Errorf("Missing [%s] count mismatch: expected %d, got %d", ms.Field, ms.ExpectedCount, ms.ActualCount)
		}
	}

	for _, as := range res.AnomalySummaries {
		t.Logf("Anomaly [%s] (%s): expected=%d, actual=%d", as.Category, as.Disposition, as.ExpectedCount, as.ActualCount)
		if as.ActualCount != as.ExpectedCount {
			t.Errorf("Anomaly [%s] count mismatch: expected %d, got %d", as.Category, as.ExpectedCount, as.ActualCount)
		}
	}

	t.Logf("Normal AR=%.2f, Rec=%.2f, Bal=%.2f, Prov=%.2f, Rate=%.4f%%",
		res.NormalARTotal, res.NormalRecTotal, res.NormalBalTotal, res.NormalProvTotal, res.OverallProvRate*100)

	// Test Excel Export with Dynamic Formulas
	tmpOut := filepath.Join(t.TempDir(), "test_export_mygo.xlsx")
	expRes, err := ExportWorkbook(res, ExportOptions{
		ThemeMode:  "mygo",
		AsOfDate:   "2026-06-30",
		OutputPath: tmpOut,
	})
	if err != nil {
		t.Fatalf("ExportWorkbook failed: %v", err)
	}
	t.Logf("Exported %s (%d bytes, %d formulas) in %.2f ms", expRes.SavedPath, expRes.FileSize, expRes.FormulaCnt, expRes.DurationMs)

	// Verify formulas in exported workbook
	wb, err := excelize.OpenFile(tmpOut)
	if err != nil {
		t.Fatalf("failed to reopen exported workbook: %v", err)
	}
	defer wb.Close()

	sheets := wb.GetSheetList()
	if len(sheets) != 5 {
		t.Errorf("expected 5 sheets, got %d: %v", len(sheets), sheets)
	}

	fB1, _ := wb.GetCellFormula("坏账准备与预警分析表", "B1")
	if fB1 != "DATE(2026,6,30)" {
		t.Errorf("expected B1 formula DATE(2026,6,30), got %q", fB1)
	}

	fL2, _ := wb.GetCellFormula("应收账款明细(清洗后)", "L2")
	if fL2 != "J2-K2" {
		t.Errorf("expected L2 formula J2-K2, got %q", fL2)
	}

	fO2, _ := wb.GetCellFormula("应收账款明细(清洗后)", "O2")
	if fO2 != "'坏账准备与预警分析表'!$B$1-G2" {
		t.Errorf("expected O2 formula '坏账准备与预警分析表'!$B$1-G2, got %q", fO2)
	}

	fW2, _ := wb.GetCellFormula("应收账款明细(清洗后)", "W2")
	if fW2 != "VLOOKUP(S2, '坏账准备与预警分析表'!$A$3:$J$7, 10, FALSE)" {
		t.Errorf("expected W2 VLOOKUP formula, got %q", fW2)
	}
}
