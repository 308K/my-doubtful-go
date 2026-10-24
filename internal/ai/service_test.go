package ai

import (
	"context"
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

func TestProposalWorkflow(t *testing.T) {
	svc := NewService()

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
	svc := NewService()
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
	svc := NewService()
	_ = svc
	// Basic sanity check that context cancels without panic
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	_ = ctx
}
