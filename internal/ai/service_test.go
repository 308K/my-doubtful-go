package ai

import (
	"context"
	"path/filepath"
	"strings"
	"testing"

	"my-doubtful-go/internal/ar"
)

func TestAnonymizer(t *testing.T) {
	anon := NewAnonymizer()
	m1 := anon.MaskCustomer("某某建筑工程有限公司")
	m2 := anon.MaskCustomer("某某建筑工程有限公司")
	m3 := anon.MaskCustomer("上海实训信息科技有限公司")

	if m1 != m2 {
		t.Fatalf("expected same masked name for same input, got %s and %s", m1, m2)
	}
	if m1 == m3 {
		t.Fatalf("expected different masked name for different input, got %s and %s", m1, m3)
	}

	text := "客户 " + m1 + " 欠款最高，其次是 " + m3
	unmasked := anon.Unmask(text)
	if unmasked != "客户 某某建筑工程有限公司 欠款最高，其次是 上海实训信息科技有限公司" {
		t.Fatalf("unexpected unmask result: %s", unmasked)
	}
}

func TestStreamingUnmasker(t *testing.T) {
	anon := NewAnonymizer()
	c1 := "北京华联综合超市股份有限公司"
	c2 := "上海联华快客便利有限公司"
	m1 := anon.MaskCustomer(c1) // 企业客户_01
	m2 := anon.MaskCustomer(c2) // 企业客户_02

	var out strings.Builder
	unmasker := NewStreamingUnmasker(anon, func(s string) {
		out.WriteString(s)
	})

	// Test chunk split across boundary
	chunks := []string{
		"经审计查明，重点欠款方为",
		"企",
		"业",
		"客户",
		"_" + m1[len("企业客户_"):],
		"，其逾期账目严重；另一关联方为",
		m2,
		"，未收余额正常。",
	}

	for _, ch := range chunks {
		unmasker.Feed(ch)
	}
	unmasker.Flush()

	expected := "经审计查明，重点欠款方为" + c1 + "，其逾期账目严重；另一关联方为" + c2 + "，未收余额正常。"
	if out.String() != expected {
		t.Fatalf("expected:\n%s\ngot:\n%s", expected, out.String())
	}
}

func TestMaskText(t *testing.T) {
	anon := NewAnonymizer()
	anon.SeedCustomers([]string{
		"北京华联",
		"北京华联综合超市股份有限公司",
		"深圳腾讯计算机系统有限公司",
	})

	input := "请详细分析北京华联综合超市股份有限公司以及深圳腾讯计算机系统有限公司的账目情况"
	masked := anon.MaskText(input)
	if strings.Contains(masked, "北京华联综合超市股份有限公司") || strings.Contains(masked, "深圳腾讯计算机系统有限公司") {
		t.Fatalf("expected masked text to not contain real names, got: %s", masked)
	}
	if !strings.Contains(masked, "企业客户_01") || !strings.Contains(masked, "企业客户_02") {
		t.Fatalf("expected masked tokens in text, got: %s", masked)
	}

	// Verify unmasking back
	unmasked := anon.Unmask(masked)
	if unmasked != input {
		t.Fatalf("expected unmask to restore original, got: %s", unmasked)
	}
}

func TestAPIKeySanitization(t *testing.T) {
	tmpPath := filepath.Join(t.TempDir(), "ai_config.json")
	svc := NewServiceWithPath(tmpPath)
	cfg := svc.GetConfig()
	cfg.APIKey = "sk-test-super-secret-key-12345"
	if err := svc.SaveConfig(cfg); err != nil {
		t.Fatalf("save config failed: %v", err)
	}

	// Internal config must have the key
	internalCfg := svc.GetConfig()
	if internalCfg.APIKey != "sk-test-super-secret-key-12345" {
		t.Fatalf("expected internal APIKey preserved, got: %s", internalCfg.APIKey)
	}
	if !internalCfg.HasAPIKey {
		t.Fatalf("expected HasAPIKey to be true")
	}

	// Client config sent to frontend must have APIKey wiped and HasAPIKey = true
	clientCfg := svc.GetClientConfig()
	if clientCfg.APIKey != "" {
		t.Fatalf("expected client APIKey to be empty, got: %s", clientCfg.APIKey)
	}
	if !clientCfg.HasAPIKey {
		t.Fatalf("expected client HasAPIKey to be true")
	}

	// Updating config without providing new APIKey must retain existing key
	updateCfg := clientCfg
	updateCfg.Model = "new-active-model"
	updateCfg.APIKey = "" // user left empty in modal
	if err := svc.SaveConfig(updateCfg); err != nil {
		t.Fatalf("save config with empty key failed: %v", err)
	}

	reloadedInternal := svc.GetConfig()
	if reloadedInternal.APIKey != "sk-test-super-secret-key-12345" {
		t.Fatalf("expected preserved APIKey after save with empty key, got: %s", reloadedInternal.APIKey)
	}
	if reloadedInternal.Model != "new-active-model" {
		t.Fatalf("expected updated model, got: %s", reloadedInternal.Model)
	}
}

func TestProposalWorkflow(t *testing.T) {
	tmpPath := filepath.Join(t.TempDir(), "ai_config.json")
	svc := NewServiceWithPath(tmpPath)

	propID := "test_prop_001"
	origRules := ar.RuleConfigPackage{
		ImputationRules:   ar.DefaultImputationConfig,
		CustomerStandards: ar.DefaultCustomerStandards,
		TierConfigs:       ar.DefaultTierConfigs,
	}

	modifiedRules := origRules
	modifiedRules.ImputationRules.TermFallbackDays = 90

	svc.mu.Lock()
	svc.proposals[propID] = &RuleUpdateProposal{
		ProposalID:      propID,
		Summary:         "调整默认缺省账期至90天",
		Category:        "imputation",
		DiffDescription: "缺省账期60天->90天",
		NewRules:        modifiedRules,
		Status:          "pending",
	}
	svc.mu.Unlock()

	applied, err := svc.ApplyProposal(propID)
	if err != nil {
		t.Fatalf("failed to apply proposal: %v", err)
	}
	if applied.ImputationRules.TermFallbackDays != 90 {
		t.Fatalf("expected TermFallbackDays 90, got %d", applied.ImputationRules.TermFallbackDays)
	}

	// Verify status is approved
	svc.mu.RLock()
	st := svc.proposals[propID].Status
	svc.mu.RUnlock()
	if st != "approved" {
		t.Fatalf("expected status approved, got %s", st)
	}

	// Reject another proposal
	propID2 := "test_prop_002"
	svc.mu.Lock()
	svc.proposals[propID2] = &RuleUpdateProposal{
		ProposalID: propID2,
		Status:     "pending",
	}
	svc.mu.Unlock()

	if err := svc.RejectProposal(propID2); err != nil {
		t.Fatalf("failed to reject proposal: %v", err)
	}
	svc.mu.RLock()
	st2 := svc.proposals[propID2].Status
	svc.mu.RUnlock()
	if st2 != "rejected" {
		t.Fatalf("expected status rejected, got %s", st2)
	}
}

func TestConfigPersistence(t *testing.T) {
	tmpPath := filepath.Join(t.TempDir(), "ai_config.json")
	svc := NewServiceWithPath(tmpPath)
	cfg := svc.GetConfig()
	if cfg.Provider == "" {
		t.Fatalf("expected default provider, got empty")
	}

	cfg.Model = "test-model-123"
	if err := svc.SaveConfig(cfg); err != nil {
		t.Fatalf("save config failed: %v", err)
	}

	loaded := svc.GetConfig()
	if loaded.Model != "test-model-123" {
		t.Fatalf("expected model test-model-123, got %s", loaded.Model)
	}
}

func TestToolsInfer(t *testing.T) {
	tmpPath := filepath.Join(t.TempDir(), "ai_config.json")
	svc := NewServiceWithPath(tmpPath)
	_ = svc
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_ = ctx
}
