package ai

import (
	"my-doubtful-go/internal/ar"
)

// AIConfig defines user-configured LLM provider credentials and parameters.
type AIConfig struct {
	Provider        string   `json:"provider"`        // "deepseek" | "volcengine" | "ollama" | "openai" | "qwen" | "custom"
	BaseURL         string   `json:"baseUrl"`         // e.g. "https://api.deepseek.com/v1" or "https://ark.cn-beijing.volces.com/api/v3"
	APIKey          string   `json:"apiKey"`          // API key (sanitized when sent to frontend)
	HasAPIKey       bool     `json:"hasApiKey"`       // true if an API key is persisted in local configuration
	Model           string   `json:"model"`           // active model name
	ReasoningEffort string   `json:"reasoningEffort"` // "minimal" | "low" | "medium" | "high" | "max"
	SavedModels     []string `json:"savedModels"`     // list of saved/custom added models
	Anonymize       bool     `json:"anonymize"`       // whether to mask customer names before sending to LLM
}

// DefaultAIConfig provides default out-of-the-box settings.
var DefaultAIConfig = AIConfig{
	Provider:        "deepseek",
	BaseURL:         "https://api.deepseek.com/v1",
	APIKey:          "",
	HasAPIKey:       false,
	Model:           "deepseek-chat",
	ReasoningEffort: "medium",
	SavedModels: []string{
		"deepseek-chat",
		"deepseek-reasoner",
	},
	Anonymize: false,
}

// ChatMessage represents a single message in the conversation history.
type ChatMessage struct {
	Role             string              `json:"role"` // "user" | "assistant" | "system"
	Content          string              `json:"content"`
	ReasoningContent string              `json:"reasoningContent,omitempty"`
	Proposal         *RuleUpdateProposal `json:"proposal,omitempty"`
	CreatedAt        string              `json:"createdAt,omitempty"`
	PipelineSnapshot *ar.PipelineResult  `json:"pipelineSnapshot,omitempty"`
}

// RuleUpdateProposal represents an AI-generated proposal to alter rules or master data.
type RuleUpdateProposal struct {
	ProposalID      string               `json:"proposalId"`
	Summary         string               `json:"summary"`
	Category        string               `json:"category"` // "imputation" | "customer" | "tier"
	DiffDescription string               `json:"diffDescription"`
	NewRules        ar.RuleConfigPackage `json:"newRules"`
	Status          string               `json:"status"` // "pending" | "approved" | "rejected"
	CreatedAt       string               `json:"createdAt"`
}

// StreamChunk is emitted via Channel to React frontend during streaming generation.
type StreamChunk struct {
	Type     string              `json:"type"` // "token" | "reasoning" | "tool_start" | "tool_end" | "proposal" | "error" | "done"
	Content  string              `json:"content,omitempty"`
	Proposal *RuleUpdateProposal `json:"proposal,omitempty"`
}

// ReportGenRequest represents user preferences for generating a full audit report.
type ReportGenRequest struct {
	Focus                   string `json:"focus"`                   // "comprehensive" | "risk_focused" | "collection"
	IncludeRecommendations bool   `json:"includeRecommendations"` // whether to output actionable collection advice
}

// ReportResult contains the synthesized markdown audit report.
type ReportResult struct {
	MarkdownContent  string `json:"markdownContent"`
	ExecutiveSummary string `json:"executiveSummary"`
	CreatedAt        string `json:"createdAt"`
}
