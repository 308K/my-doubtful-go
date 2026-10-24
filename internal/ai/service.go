package ai

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"my-doubtful-go/internal/ar"

	"github.com/egoist/mygo"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
	"github.com/openai/openai-go/packages/param"
	"github.com/openai/openai-go/shared"
	"github.com/tidwall/gjson"
)

// Service encapsulates the AI Agent runtime, configuration, and proposal states.
type Service struct {
	mu         sync.RWMutex
	config     AIConfig
	configPath string
	proposals  map[string]*RuleUpdateProposal
}

// NewService initializes the AI service and loads persisted user configuration.
func NewService() *Service {
	cfgDir, err := os.UserConfigDir()
	if err != nil {
		cfgDir = "."
	}
	appDir := filepath.Join(cfgDir, "smartar")
	_ = os.MkdirAll(appDir, 0755)
	cfgPath := filepath.Join(appDir, "ai_config.json")
	return NewServiceWithPath(cfgPath)
}

// NewServiceWithPath initializes the AI service with a custom configuration file path.
func NewServiceWithPath(cfgPath string) *Service {
	svc := &Service{
		config:     DefaultAIConfig,
		configPath: cfgPath,
		proposals:  make(map[string]*RuleUpdateProposal),
	}

	if cfgPath != "" {
		if data, err := os.ReadFile(cfgPath); err == nil && len(data) > 0 {
			var loaded AIConfig
			if json.Unmarshal(data, &loaded) == nil {
				if loaded.Provider != "" {
					svc.config = loaded
				}
			}
		}
	}

	return svc
}

// GetConfig returns the currently configured AI settings.
func (s *Service) GetConfig() AIConfig {
	s.mu.RLock()
	defer s.mu.RUnlock()
	cfg := s.config
	cfg.HasAPIKey = cfg.APIKey != ""
	return cfg
}

// GetClientConfig returns AI settings sanitized for frontend display (APIKey is wiped, HasAPIKey is preserved).
func (s *Service) GetClientConfig() AIConfig {
	s.mu.RLock()
	defer s.mu.RUnlock()
	clientCfg := s.config
	clientCfg.HasAPIKey = clientCfg.APIKey != ""
	clientCfg.APIKey = "" // Never expose actual APIKey to frontend
	return clientCfg
}

// SaveConfig persists new AI settings to disk.
func (s *Service) SaveConfig(cfg AIConfig) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if cfg.APIKey == "" {
		cfg.APIKey = s.config.APIKey
	}
	cfg.HasAPIKey = cfg.APIKey != ""

	if cfg.BaseURL == "" {
		switch cfg.Provider {
		case "deepseek":
			cfg.BaseURL = "https://api.deepseek.com/v1"
		case "volcengine":
			cfg.BaseURL = "https://ark.cn-beijing.volces.com/api/v3"
		case "ollama":
			cfg.BaseURL = "http://localhost:11434/v1"
		case "qwen":
			cfg.BaseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
		default:
			cfg.BaseURL = "https://api.openai.com/v1"
		}
	}
	if cfg.Model == "" {
		switch cfg.Provider {
		case "deepseek":
			cfg.Model = "deepseek-chat"
		case "volcengine":
			cfg.Model = "doubao-1.5-pro-32k"
		case "ollama":
			cfg.Model = "qwen2.5:7b"
		case "qwen":
			cfg.Model = "qwen-plus"
		default:
			cfg.Model = "gpt-4o-mini"
		}
	}
	if cfg.ReasoningEffort == "" {
		cfg.ReasoningEffort = "medium"
	}

	s.config = cfg
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.configPath, data, 0644)
}

// FetchModels queries the model endpoint to list available models.
func (s *Service) FetchModels(ctx context.Context, cfg AIConfig) ([]string, error) {
	if cfg.BaseURL == "" {
		cfg = DefaultAIConfig
	}

	opts := []option.RequestOption{
		option.WithBaseURL(cfg.BaseURL),
		option.WithRequestTimeout(15 * time.Second),
	}
	if cfg.APIKey != "" {
		opts = append(opts, option.WithAPIKey(cfg.APIKey))
	} else {
		opts = append(opts, option.WithAPIKey("no-key"))
	}

	client := openai.NewClient(opts...)
	page, err := client.Models.List(ctx)
	if err == nil && page != nil && len(page.Data) > 0 {
		var list []string
		for _, m := range page.Data {
			if m.ID != "" {
				list = append(list, m.ID)
			}
		}
		sort.Strings(list)
		return list, nil
	}

	return s.fallbackFetchModels(ctx, cfg)
}

func (s *Service) fallbackFetchModels(ctx context.Context, cfg AIConfig) ([]string, error) {
	endpoints := []string{
		strings.TrimRight(cfg.BaseURL, "/") + "/models",
		strings.TrimRight(strings.TrimSuffix(cfg.BaseURL, "/v1"), "/") + "/api/tags",
	}

	httpClient := &http.Client{Timeout: 10 * time.Second}
	var lastErr error
	for _, ep := range endpoints {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, ep, nil)
		if err != nil {
			lastErr = err
			continue
		}
		if cfg.APIKey != "" {
			req.Header.Set("Authorization", "Bearer "+cfg.APIKey)
		}
		resp, err := httpClient.Do(req)
		if err != nil {
			lastErr = err
			continue
		}
		body, _ := io.ReadAll(resp.Body)
		_ = resp.Body.Close()

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			modelSet := make(map[string]struct{})
			dataArr := gjson.GetBytes(body, "data").Array()
			for _, item := range dataArr {
				id := item.Get("id").String()
				if id != "" {
					modelSet[id] = struct{}{}
				}
			}
			modelsArr := gjson.GetBytes(body, "models").Array()
			for _, item := range modelsArr {
				name := item.Get("name").String()
				if name != "" {
					modelSet[name] = struct{}{}
				}
			}
			if len(modelSet) > 0 {
				var list []string
				for m := range modelSet {
					list = append(list, m)
				}
				sort.Strings(list)
				return list, nil
			}
		}
	}

	if lastErr != nil {
		return nil, fmt.Errorf("获取模型列表失败: %w", lastErr)
	}
	return nil, errors.New("未能从当前服务商接口获取到模型列表，请手动添加模型名称")
}

// TestConnection sends a minimal probe prompt to verify credentials and endpoint latency.
func (s *Service) TestConnection(ctx context.Context, cfg AIConfig) (string, error) {
	if cfg.BaseURL == "" {
		cfg = DefaultAIConfig
	}
	opts := []option.RequestOption{
		option.WithBaseURL(cfg.BaseURL),
		option.WithRequestTimeout(15 * time.Second),
	}
	if cfg.APIKey != "" {
		opts = append(opts, option.WithAPIKey(cfg.APIKey))
	} else {
		opts = append(opts, option.WithAPIKey("no-key"))
	}

	client := openai.NewClient(opts...)
	start := time.Now()

	params := openai.ChatCompletionNewParams{
		Model: openai.ChatModel(cfg.Model),
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.UserMessage("请仅回复两个汉字：正常"),
		},
		MaxCompletionTokens: param.NewOpt(int64(16)),
	}

	completion, err := client.Chat.Completions.New(ctx, params)
	if err != nil {
		return "", fmt.Errorf("连接测试失败: %w", err)
	}
	latency := time.Since(start).Milliseconds()
	content := ""
	if len(completion.Choices) > 0 {
		content = strings.TrimSpace(completion.Choices[0].Message.Content)
	}
	return fmt.Sprintf("连接成功！响应延迟: %dms，模型返回: %s", latency, content), nil
}

// ApplyProposal marks a proposal as approved and returns the updated rule package.
func (s *Service) ApplyProposal(proposalID string) (*ar.RuleConfigPackage, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	prop, ok := s.proposals[proposalID]
	if !ok {
		return nil, fmt.Errorf("未找到提案ID: %s", proposalID)
	}
	if prop.Status == "approved" {
		return &prop.NewRules, nil
	}
	prop.Status = "approved"
	rules := prop.NewRules
	return &rules, nil
}

// RejectProposal marks a proposal as rejected.
func (s *Service) RejectProposal(proposalID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	prop, ok := s.proposals[proposalID]
	if !ok {
		return fmt.Errorf("未找到提案ID: %s", proposalID)
	}
	prop.Status = "rejected"
	return nil
}

// StreamChat executes multi-turn tool calling and streams tokens and tool events to the frontend channel.
func (s *Service) StreamChat(
	ctx context.Context,
	history []ChatMessage,
	currentPipeline *ar.PipelineResult,
	currentRules *ar.RuleConfigPackage,
	stream *mygo.Channel[StreamChunk],
) error {
	cfg := s.GetConfig()
	if cfg.BaseURL == "" {
		cfg = DefaultAIConfig
	}

	anonymizer := NewAnonymizer()
	shouldAnonymize := cfg.Anonymize
	if shouldAnonymize {
		var allNames []string
		if currentPipeline != nil {
			for _, r := range currentPipeline.NormalRecords {
				allNames = append(allNames, r.CustName, r.RawCustName)
			}
			for _, r := range currentPipeline.SuspendedRecords {
				allNames = append(allNames, r.CustName, r.RawCustName)
			}
		}
		if currentRules != nil {
			for _, cs := range currentRules.CustomerStandards {
				allNames = append(allNames, cs.Name)
				allNames = append(allNames, cs.Aliases...)
			}
		}
		anonymizer.SeedCustomers(allNames)
	}
	maskName := func(name string) string {
		if shouldAnonymize {
			return anonymizer.MaskCustomer(name)
		}
		return name
	}

	opts := []option.RequestOption{
		option.WithBaseURL(cfg.BaseURL),
		option.WithRequestTimeout(120 * time.Second),
	}
	if cfg.APIKey != "" {
		opts = append(opts, option.WithAPIKey(cfg.APIKey))
	} else {
		opts = append(opts, option.WithAPIKey("no-key"))
	}
	client := openai.NewClient(opts...)

	toolsDef := []openai.ChatCompletionToolParam{
		{
			Function: shared.FunctionDefinitionParam{
				Name:        "get_pipeline_summary",
				Description: param.NewOpt("获取当前应收账款全局汇总指标（入表应收总额、已收金额、未收余额、坏账准备金测算总额、综合计提率、正常入表记录数、挂起异常单据数、报表基准日）"),
				Parameters: shared.FunctionParameters{
					"type":       "object",
					"properties": map[string]any{},
				},
			},
		},
		{
			Function: shared.FunctionDefinitionParam{
				Name:        "get_aging_tier_distribution",
				Description: param.NewOpt("获取5级账龄区间分布情况（各区间名称、天数范围、未收余额合计、占比、坏账准备计提额、计提比例、预警等级及催收管理行动建议）"),
				Parameters: shared.FunctionParameters{
					"type":       "object",
					"properties": map[string]any{},
				},
			},
		},
		{
			Function: shared.FunctionDefinitionParam{
				Name:        "get_top_debtors",
				Description: param.NewOpt("获取欠款未收余额最高的大客户清单及风险穿透（包含客户代码、客户名称、信用等级、基准账期、未收余额、坏账准备及最大逾期天数）"),
				Parameters: shared.FunctionParameters{
					"type": "object",
					"properties": map[string]any{
						"top_n": map[string]any{
							"type":        "integer",
							"description": "获取欠款最高的前N位客户，默认5",
						},
					},
				},
			},
		},
		{
			Function: shared.FunctionDefinitionParam{
				Name:        "get_anomaly_audit_records",
				Description: param.NewOpt("审查Step 3审计挂起隔离的实质性风险异常单据明细（负数或已收大于应收、离群金额、0余额挂账等），包含单据编号、客户、金额及异常风险标签"),
				Parameters: shared.FunctionParameters{
					"type": "object",
					"properties": map[string]any{
						"limit": map[string]any{
							"type":        "integer",
							"description": "最大获取笔数，默认20",
						},
					},
				},
			},
		},
		{
			Function: shared.FunctionDefinitionParam{
				Name:        "get_current_rules",
				Description: param.NewOpt("获取当前生效的治理规则配置：包括缺失值填充模式、离群值阈值、客户主数据字典及坏账计提与预警分级标准"),
				Parameters: shared.FunctionParameters{
					"type":       "object",
					"properties": map[string]any{},
				},
			},
		},
		{
			Function: shared.FunctionDefinitionParam{
				Name:        "propose_rule_update",
				Description: param.NewOpt("生成规则配置或客户主数据调整提案。当用户要求修改坏账计提比例、调整缺失值填充模式或阈值、或新增修改客户主数据时调用此工具。注意：此工具会在界面生成提案卡片供用户一键批准"),
				Parameters: shared.FunctionParameters{
					"type": "object",
					"properties": map[string]any{
						"category": map[string]any{
							"type":        "string",
							"description": "变更类别：'imputation'(缺失值填充规则), 'customer'(客户主数据), 'tier'(坏账计提标准)",
						},
						"summary": map[string]any{
							"type":        "string",
							"description": "本次调整的业务理由与摘要",
						},
						"diff_description": map[string]any{
							"type":        "string",
							"description": "变更明细对比，如'3-6个月计提比例从20%调整为25%'",
						},
						"term_strategy": map[string]any{
							"type":        "string",
							"description": "账期填充策略：'mode'(众数) 或 'fixed'(固定天数)",
						},
						"term_fallback_days": map[string]any{
							"type":        "integer",
							"description": "默认缺省账期天数",
						},
						"overdue_grace_days": map[string]any{
							"type":        "integer",
							"description": "逾期宽限期天数",
						},
						"low_outlier_threshold": map[string]any{
							"type":        "number",
							"description": "金额离群值阈值(元)",
						},
						"customer_code": map[string]any{
							"type":        "string",
							"description": "客户代码，如KH001",
						},
						"customer_name": map[string]any{
							"type":        "string",
							"description": "客户标准全称",
						},
						"customer_credit": map[string]any{
							"type":        "string",
							"description": "客户信用等级，如AAA, AA, A, BBB, BB, B, C",
						},
						"customer_region": map[string]any{
							"type":        "string",
							"description": "客户所属大区，如华东, 华北, 华南",
						},
						"tier_name": map[string]any{
							"type":        "string",
							"description": "要调整的账龄区间名称，如3-6个月",
						},
						"provision_rate_percent": map[string]any{
							"type":        "number",
							"description": "坏账计提百分比，例如25代表25%",
						},
						"risk_level": map[string]any{
							"type":        "string",
							"description": "预警风险等级，如正常, 关注, 审慎, 高危, 严重",
						},
						"suggested_action": map[string]any{
							"type":        "string",
							"description": "催收管理行动建议",
						},
					},
					"required": []string{"category", "summary"},
				},
			},
		},
	}

	systemPrompt := `你是SmartAR Desktop的资深智能财务治理与信用风控审计专家助手。
你的目标是协助企业财务总监、风控团队和审计人员分析应收账款资产质量、账龄分布、坏账准备金测算合理性、识别实质性异常单据，并协助进行财务规则调整。

可用工具职责：
1. get_pipeline_summary: 获取全局账款、余额、准备金与整体计提率。
2. get_aging_tier_distribution: 获取账龄各区间的余额、拨备、比例与管理行动。
3. get_top_debtors: 穿透分析欠款最多的大客户、授信额度与逾期情况。
4. get_anomaly_audit_records: 审查Step 3挂起的实质性风险异常单据明细。
5. get_current_rules: 读取当前系统规则与字典配置。
6. propose_rule_update: 生成规则调整提案。当用户要求修改坏账计提比例、变更账期推导规则或维护客户主数据时，必须调用此工具生成结构化提案供用户在界面一键审核，不要虚构已生效。

执行规则：
- 当需要获取数据或生成规则变更提案时，直接调用对应的工具。在调用工具前严禁输出多余的自言自语、寒暄或前言。
- 必须支持多轮工具调用，直至收集完必要数据并生成结构化回答。
- 语言严谨、专业，契合中国《企业会计准则第22号——金融工具确认和计量》（新金融工具准则ECL模型）与内部控制审计规范。
- 采用清晰的Markdown结构，数值需注明币种（元）与百分比。
- 严禁在回答中使用任何emoji表情符号。`

	var apiMessages []openai.ChatCompletionMessageParamUnion
	apiMessages = append(apiMessages, openai.SystemMessage(systemPrompt))

	for _, m := range history {
		msgContent := m.Content
		if shouldAnonymize {
			msgContent = anonymizer.MaskText(msgContent)
		}
		switch m.Role {
		case "user":
			apiMessages = append(apiMessages, openai.UserMessage(msgContent))
		case "assistant":
			apiMessages = append(apiMessages, openai.AssistantMessage(msgContent))
		case "system":
			apiMessages = append(apiMessages, openai.SystemMessage(msgContent))
		}
	}

	maxTurns := 8
	for turn := 0; turn < maxTurns; turn++ {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		params := openai.ChatCompletionNewParams{
			Model:    openai.ChatModel(cfg.Model),
			Messages: apiMessages,
			Tools:    toolsDef,
		}
		if cfg.ReasoningEffort != "" {
			params.ReasoningEffort = shared.ReasoningEffort(cfg.ReasoningEffort)
		}

		streamRes := client.Chat.Completions.NewStreaming(ctx, params)

		type toolCallAcc struct {
			ID        string
			Name      string
			Arguments strings.Builder
		}
		toolCallsMap := make(map[int64]*toolCallAcc)
		var contentBuilder strings.Builder
		var reasoningBuilder strings.Builder

		var tokenUnmasker *StreamingUnmasker
		var reasoningUnmasker *StreamingUnmasker
		if shouldAnonymize {
			tokenUnmasker = NewStreamingUnmasker(anonymizer, func(unmasked string) {
				_ = stream.Send(StreamChunk{Type: "token", Content: unmasked})
			})
			reasoningUnmasker = NewStreamingUnmasker(anonymizer, func(unmasked string) {
				_ = stream.Send(StreamChunk{Type: "reasoning", Content: unmasked})
			})
		}

		for streamRes.Next() {
			chunk := streamRes.Current()
			rawJSON := chunk.RawJSON()

			if rVal := gjson.Get(rawJSON, "choices.0.delta.reasoning_content").String(); rVal != "" {
				reasoningBuilder.WriteString(rVal)
				if shouldAnonymize {
					reasoningUnmasker.Feed(rVal)
				} else {
					_ = stream.Send(StreamChunk{Type: "reasoning", Content: rVal})
				}
			} else if rVal2 := gjson.Get(rawJSON, "choices.0.delta.reasoning").String(); rVal2 != "" {
				reasoningBuilder.WriteString(rVal2)
				if shouldAnonymize {
					reasoningUnmasker.Feed(rVal2)
				} else {
					_ = stream.Send(StreamChunk{Type: "reasoning", Content: rVal2})
				}
			}

			if len(chunk.Choices) > 0 {
				delta := chunk.Choices[0].Delta
				if delta.Content != "" {
					contentBuilder.WriteString(delta.Content)
					if shouldAnonymize {
						tokenUnmasker.Feed(delta.Content)
					} else {
						_ = stream.Send(StreamChunk{Type: "token", Content: delta.Content})
					}
				}

				for _, tc := range delta.ToolCalls {
					acc, exists := toolCallsMap[tc.Index]
					if !exists {
						acc = &toolCallAcc{ID: tc.ID, Name: tc.Function.Name}
						toolCallsMap[tc.Index] = acc
					}
					if tc.ID != "" {
						acc.ID = tc.ID
					}
					if tc.Function.Name != "" {
						acc.Name = tc.Function.Name
					}
					if tc.Function.Arguments != "" {
						acc.Arguments.WriteString(tc.Function.Arguments)
					}
				}
			}
		}

		if shouldAnonymize {
			reasoningUnmasker.Flush()
			tokenUnmasker.Flush()
		}

		if err := streamRes.Err(); err != nil {
			_ = stream.Send(StreamChunk{Type: "error", Content: fmt.Sprintf("流式调用异常: %v", err)})
			return err
		}

		if len(toolCallsMap) == 0 {
			_ = stream.Send(StreamChunk{Type: "done"})
			return nil
		}

		var indices []int64
		for idx := range toolCallsMap {
			indices = append(indices, idx)
		}
		sort.Slice(indices, func(i, j int) bool { return indices[i] < indices[j] })

		var tcParams []openai.ChatCompletionMessageToolCallParam
		for _, idx := range indices {
			tc := toolCallsMap[idx]
			if tc.ID == "" {
				tc.ID = fmt.Sprintf("call_%d_%d", time.Now().UnixNano(), idx)
			}
			tcParams = append(tcParams, openai.ChatCompletionMessageToolCallParam{
				ID: tc.ID,
				Function: openai.ChatCompletionMessageToolCallFunctionParam{
					Name:      tc.Name,
					Arguments: tc.Arguments.String(),
				},
			})
		}

		assistantMsg := openai.ChatCompletionMessageParamUnion{
			OfAssistant: &openai.ChatCompletionAssistantMessageParam{
				Role:      "assistant",
				ToolCalls: tcParams,
			},
		}
		if contentBuilder.Len() > 0 {
			assistantMsg.OfAssistant.Content = openai.ChatCompletionAssistantMessageParamContentUnion{
				OfString: param.NewOpt(contentBuilder.String()),
			}
		}
		apiMessages = append(apiMessages, assistantMsg)

		for _, idx := range indices {
			tc := toolCallsMap[idx]
			toolResult, execErr := s.executeTool(ctx, tc.Name, tc.Arguments.String(), stream, currentPipeline, currentRules, maskName, anonymizer, shouldAnonymize)
			if execErr != nil {
				toolResult = fmt.Sprintf("工具执行错误: %v", execErr)
			}
			apiMessages = append(apiMessages, openai.ToolMessage(toolResult, tc.ID))
		}
	}

	_ = stream.Send(StreamChunk{Type: "done"})
	return nil
}

func (s *Service) executeTool(
	ctx context.Context,
	toolName string,
	arguments string,
	stream *mygo.Channel[StreamChunk],
	currentPipeline *ar.PipelineResult,
	currentRules *ar.RuleConfigPackage,
	maskName func(string) string,
	anonymizer *Anonymizer,
	shouldAnonymize bool,
) (string, error) {
	switch toolName {
	case "get_pipeline_summary":
		_ = stream.Send(StreamChunk{Type: "tool_start", Content: "正在检索应收账款全局财务指标..."})
		if currentPipeline == nil {
			return "暂无有效清洗与计算结果，请先导入并运行数据流水线。", nil
		}
		res := map[string]any{
			"报表基准日":        currentPipeline.AsOfDate,
			"入表应收总额(元)":    currentPipeline.NormalARTotal,
			"已收金额总额(元)":    currentPipeline.NormalRecTotal,
			"未收余额总额(元)":    currentPipeline.NormalBalTotal,
			"坏账准备金总额(元)":   currentPipeline.NormalProvTotal,
			"综合坏账计提率":      fmt.Sprintf("%.2f%%", currentPipeline.OverallProvRate*100.0),
			"正常核算入表单据笔数":  currentPipeline.NormalCount,
			"实质性风险挂起隔离笔数": currentPipeline.TotalSuspended,
			"逾期单据笔数":      currentPipeline.OverdueCount,
			"逾期未收余额(元)":    currentPipeline.OverdueBalTotal,
		}
		data, _ := json.MarshalIndent(res, "", "  ")
		_ = stream.Send(StreamChunk{Type: "tool_end", Content: "已获取全局财务指标。"})
		return string(data), nil

	case "get_aging_tier_distribution":
		_ = stream.Send(StreamChunk{Type: "tool_start", Content: "正在汇总账龄区间与坏账准备测算分布..."})
		if currentPipeline == nil {
			return "暂无数据。", nil
		}
		type TierSummary struct {
			TierName        string  `json:"账龄区间"`
			DaysRange       string  `json:"天数范围"`
			Balance         float64 `json:"未收余额(元)"`
			BalanceRatio    string  `json:"余额占比"`
			Provision       float64 `json:"坏账准备(元)"`
			RatePercent     string  `json:"计提比例"`
			RiskLevel       string  `json:"风险等级"`
			SuggestedAction string  `json:"催收管理行动建议"`
		}
		var list []TierSummary
		for _, st := range currentPipeline.TierSummaries {
			list = append(list, TierSummary{
				TierName:        st.AgingTier,
				DaysRange:       st.RangeText,
				Balance:         st.BalanceSum,
				BalanceRatio:    fmt.Sprintf("%.2f%%", st.BalanceRatio*100.0),
				Provision:       st.ProvisionSum,
				RatePercent:     fmt.Sprintf("%.1f%%", st.ProvisionRate*100.0),
				RiskLevel:       st.RiskLevel,
				SuggestedAction: st.SuggestedAction,
			})
		}
		data, _ := json.MarshalIndent(list, "", "  ")
		_ = stream.Send(StreamChunk{Type: "tool_end", Content: "已汇总账龄区间数据。"})
		return string(data), nil

	case "get_top_debtors":
		_ = stream.Send(StreamChunk{Type: "tool_start", Content: "正在穿透统计大客户敞口与逾期风险..."})
		if currentPipeline == nil {
			return "暂无数据。", nil
		}
		topN := int(gjson.Get(arguments, "top_n").Int())
		if topN <= 0 {
			topN = 5
		}
		type CustStat struct {
			CustCode       string  `json:"客户代码"`
			CustName       string  `json:"客户名称"`
			CreditLevel    string  `json:"信用等级"`
			Region         string  `json:"所属大区"`
			CreditTermDays int     `json:"基准账期(天)"`
			InvoiceCount   int     `json:"单据笔数"`
			BalanceTotal   float64 `json:"未收余额(元)"`
			BalanceRatio   string  `json:"余额占比"`
			ProvisionTotal float64 `json:"坏账准备(元)"`
			MaxOverdueDays int     `json:"最大逾期天数"`
			RiskLevel      string  `json:"预警等级"`
		}
		var list []CustStat
		for i, c := range currentPipeline.CustomerSummaries {
			if i >= topN {
				break
			}
			ratio := 0.0
			if currentPipeline.NormalBalTotal > 0 {
				ratio = (c.BalanceTotal / currentPipeline.NormalBalTotal) * 100.0
			}
			list = append(list, CustStat{
				CustCode:       c.CustCode,
				CustName:       maskName(c.CustName),
				CreditLevel:    c.CreditLevel,
				Region:         c.Region,
				CreditTermDays: c.TermModeDays,
				InvoiceCount:   c.RecordCount,
				BalanceTotal:   c.BalanceTotal,
				BalanceRatio:   fmt.Sprintf("%.2f%%", ratio),
				ProvisionTotal: c.ProvisionTotal,
				MaxOverdueDays: c.MaxOverdueDays,
				RiskLevel:      c.HighestRisk,
			})
		}
		data, _ := json.MarshalIndent(list, "", "  ")
		_ = stream.Send(StreamChunk{Type: "tool_end", Content: fmt.Sprintf("已获取前%d位欠款大客户清单。", len(list))})
		return string(data), nil

	case "get_anomaly_audit_records":
		_ = stream.Send(StreamChunk{Type: "tool_start", Content: "正在审查挂起隔离的实质性风险单据..."})
		if currentPipeline == nil {
			return "暂无数据。", nil
		}
		limit := int(gjson.Get(arguments, "limit").Int())
		if limit <= 0 {
			limit = 20
		}
		type SuspendedItem struct {
			InvoiceNo      string   `json:"单据编号"`
			CustName       string   `json:"客户名称"`
			InvoiceDate    string   `json:"发生日期"`
			DueDate        string   `json:"到期日期"`
			ARAmount       float64  `json:"应收金额(元)"`
			BalanceAmount  float64  `json:"未收余额(元)"`
			SuspendAction  string   `json:"处置策略"`
			AnomalyTags    []string `json:"异常风险标签"`
		}
		var list []SuspendedItem
		for i, r := range currentPipeline.SuspendedRecords {
			if i >= limit {
				break
			}
			list = append(list, SuspendedItem{
				InvoiceNo:      r.InvoiceNo,
				CustName:       maskName(r.CustName),
				InvoiceDate:    r.InvoiceDate,
				DueDate:        r.DueDate,
				ARAmount:       r.ARAmount,
				BalanceAmount:  r.BalanceAmount,
				SuspendAction:  r.SuspendAction,
				AnomalyTags:    r.AnomalyTags,
			})
		}
		data, _ := json.MarshalIndent(list, "", "  ")
		_ = stream.Send(StreamChunk{Type: "tool_end", Content: fmt.Sprintf("已检索出%d笔异常挂起单据。", len(list))})
		return string(data), nil

	case "get_current_rules":
		_ = stream.Send(StreamChunk{Type: "tool_start", Content: "正在读取当前系统规则与标准配置..."})
		var pkg ar.RuleConfigPackage
		if currentRules != nil {
			pkg = *currentRules
		} else {
			pkg = ar.RuleConfigPackage{
				ImputationRules:   ar.DefaultImputationConfig,
				CustomerStandards: ar.DefaultCustomerStandards,
				TierConfigs:       ar.DefaultTierConfigs,
			}
		}
		if shouldAnonymize {
			maskedStandards := make([]ar.CustomerStandard, len(pkg.CustomerStandards))
			for i, cs := range pkg.CustomerStandards {
				maskedStandards[i] = cs
				maskedStandards[i].Name = maskName(cs.Name)
				var maskedAliases []string
				for _, alias := range cs.Aliases {
					maskedAliases = append(maskedAliases, maskName(alias))
				}
				maskedStandards[i].Aliases = maskedAliases
			}
			pkg.CustomerStandards = maskedStandards
		}
		data, _ := json.MarshalIndent(pkg, "", "  ")
		_ = stream.Send(StreamChunk{Type: "tool_end", Content: "已读取当前规则配置。"})
		return string(data), nil

	case "propose_rule_update":
		_ = stream.Send(StreamChunk{Type: "tool_start", Content: "正在生成规则变更提案并进行参数校验..."})

		var baseRules ar.RuleConfigPackage
		if currentRules != nil {
			baseRules = *currentRules
		} else {
			baseRules = ar.RuleConfigPackage{
				ImputationRules:   ar.DefaultImputationConfig,
				CustomerStandards: ar.DefaultCustomerStandards,
				TierConfigs:       ar.DefaultTierConfigs,
			}
		}

		newRules := baseRules
		cat := strings.ToLower(gjson.Get(arguments, "category").String())
		summary := gjson.Get(arguments, "summary").String()
		diffDesc := gjson.Get(arguments, "diff_description").String()
		if diffDesc == "" {
			diffDesc = summary
		}

		switch cat {
		case "imputation":
			if val := gjson.Get(arguments, "term_strategy").String(); val != "" {
				newRules.ImputationRules.TermStrategy = val
			}
			if val := gjson.Get(arguments, "term_fallback_days").Int(); val > 0 {
				newRules.ImputationRules.TermFallbackDays = int(val)
			}
			if val := gjson.Get(arguments, "overdue_grace_days").Int(); val >= 0 {
				newRules.ImputationRules.OverdueGraceDays = int(val)
			}
			if val := gjson.Get(arguments, "low_outlier_threshold").Float(); val > 0 {
				newRules.ImputationRules.LowAmountOutlierThreshold = val
			}
		case "customer":
			code := strings.TrimSpace(gjson.Get(arguments, "customer_code").String())
			if code != "" {
				name := gjson.Get(arguments, "customer_name").String()
				credit := gjson.Get(arguments, "customer_credit").String()
				region := gjson.Get(arguments, "customer_region").String()

				found := false
				for i, c := range newRules.CustomerStandards {
					if strings.EqualFold(c.Code, code) {
						found = true
						if name != "" {
							newRules.CustomerStandards[i].Name = name
						}
						if credit != "" {
							newRules.CustomerStandards[i].Credit = credit
						}
						if region != "" {
							newRules.CustomerStandards[i].Region = region
						}
						break
					}
				}
				if !found {
					if name == "" {
						name = code
					}
					if credit == "" {
						credit = "A"
					}
					if region == "" {
						region = "华东"
					}
					newRules.CustomerStandards = append(newRules.CustomerStandards, ar.CustomerStandard{
						Code:    code,
						Name:    name,
						Credit:  credit,
						Region:  region,
						Aliases: []string{name},
					})
				}
			}
		case "tier":
			tierName := strings.TrimSpace(gjson.Get(arguments, "tier_name").String())
			ratePercent := gjson.Get(arguments, "provision_rate_percent").Float()
			riskLevel := gjson.Get(arguments, "risk_level").String()
			suggestedAction := gjson.Get(arguments, "suggested_action").String()

			for i, t := range newRules.TierConfigs {
				if tierName == "" || strings.EqualFold(t.Name, tierName) || strings.Contains(t.Name, tierName) {
					if ratePercent >= 0 {
						newRules.TierConfigs[i].Rate = ratePercent / 100.0
					}
					if riskLevel != "" {
						newRules.TierConfigs[i].ClassicLevel = riskLevel
					}
					if suggestedAction != "" {
						newRules.TierConfigs[i].SuggestedAction = suggestedAction
					}
					if tierName != "" {
						break
					}
				}
			}
		}

		if shouldAnonymize && anonymizer != nil {
			summary = anonymizer.Unmask(summary)
			diffDesc = anonymizer.Unmask(diffDesc)
			for i := range newRules.CustomerStandards {
				newRules.CustomerStandards[i].Name = anonymizer.Unmask(newRules.CustomerStandards[i].Name)
				for j := range newRules.CustomerStandards[i].Aliases {
					newRules.CustomerStandards[i].Aliases[j] = anonymizer.Unmask(newRules.CustomerStandards[i].Aliases[j])
				}
			}
		}

		propID := fmt.Sprintf("prop_%d_%d", time.Now().Unix(), time.Now().Nanosecond()%1000)
		proposal := &RuleUpdateProposal{
			ProposalID:      propID,
			Summary:         summary,
			Category:        cat,
			DiffDescription: diffDesc,
			NewRules:        newRules,
			Status:          "pending",
			CreatedAt:       time.Now().Format("2006-01-02 15:04:05"),
		}

		s.mu.Lock()
		s.proposals[propID] = proposal
		s.mu.Unlock()

		_ = stream.Send(StreamChunk{
			Type:     "proposal",
			Proposal: proposal,
		})
		_ = stream.Send(StreamChunk{Type: "tool_end", Content: "已成功生成提案并在界面展示审核卡片。"})

		return fmt.Sprintf("提案已成功创建（编号：%s）。修改内容：%s。请提示用户在界面卡片中点击【一键批准并应用】确认生效并重新测算。", propID, diffDesc), nil
	}

	return "", fmt.Errorf("未知工具: %s", toolName)
}

// GenerateAuditReport synthesizes an executive-grade AR audit management report.
func (s *Service) GenerateAuditReport(
	ctx context.Context,
	req ReportGenRequest,
	pipelineResult *ar.PipelineResult,
	stream *mygo.Channel[StreamChunk],
) (*ReportResult, error) {
	if pipelineResult == nil {
		return nil, errors.New("暂无数据，请先导入并运行数据治理流水线")
	}

	cfg := s.GetConfig()
	if cfg.BaseURL == "" {
		cfg = DefaultAIConfig
	}

	anonymizer := NewAnonymizer()
	shouldAnonymize := cfg.Anonymize
	if shouldAnonymize {
		var allNames []string
		for _, r := range pipelineResult.NormalRecords {
			allNames = append(allNames, r.CustName, r.RawCustName)
		}
		for _, r := range pipelineResult.SuspendedRecords {
			allNames = append(allNames, r.CustName, r.RawCustName)
		}
		anonymizer.SeedCustomers(allNames)
	}

	maskName := func(name string) string {
		if shouldAnonymize {
			return anonymizer.MaskCustomer(name)
		}
		return name
	}

	_ = stream.Send(StreamChunk{Type: "tool_start", Content: "正在启动报告生成工作流：数据清洗与指标聚合..."})

	var agingLines []string
	for _, tier := range pipelineResult.TierSummaries {
		agingLines = append(agingLines, fmt.Sprintf(
			"| %s (%s) | ¥%.2f (%.1f%%) | ¥%.2f | %.1f%% | %s | %s |",
			tier.AgingTier, tier.RangeText,
			tier.BalanceSum, tier.BalanceRatio*100.0, tier.ProvisionSum, tier.ProvisionRate*100.0,
			tier.RiskLevel, tier.SuggestedAction,
		))
	}

	type custBalance struct {
		name    string
		balance float64
		level   string
	}
	var custs []*custBalance
	for _, c := range pipelineResult.CustomerSummaries {
		custs = append(custs, &custBalance{
			name:    c.CustName,
			balance: c.BalanceTotal,
			level:   c.CreditLevel,
		})
	}
	sort.Slice(custs, func(i, j int) bool { return custs[i].balance > custs[j].balance })

	var top5Lines []string
	top5Total := 0.0
	for i, cb := range custs {
		if i >= 5 {
			break
		}
		top5Total += cb.balance
		pct := 0.0
		if pipelineResult.NormalBalTotal > 0 {
			pct = (cb.balance / pipelineResult.NormalBalTotal) * 100.0
		}
		top5Lines = append(top5Lines, fmt.Sprintf(
			"| %d | %s | %s | ¥%.2f | %.1f%% |",
			i+1, maskName(cb.name), cb.level, cb.balance, pct,
		))
	}
	top5Ratio := 0.0
	if pipelineResult.NormalBalTotal > 0 {
		top5Ratio = (top5Total / pipelineResult.NormalBalTotal) * 100.0
	}

	anomalyCounts := make(map[string]int)
	for _, r := range pipelineResult.SuspendedRecords {
		for _, tag := range r.AnomalyTags {
			anomalyCounts[tag]++
		}
	}
	var anomalyLines []string
	for tag, cnt := range anomalyCounts {
		anomalyLines = append(anomalyLines, fmt.Sprintf("- **%s**: %d笔", tag, cnt))
	}

	recRate := 0.0
	if pipelineResult.NormalARTotal > 0 {
		recRate = (pipelineResult.NormalRecTotal / pipelineResult.NormalARTotal) * 100.0
	}

	dossier := fmt.Sprintf(`### 基础财务核算数据底稿
- **报表基准日**: %s
- **应收账款总额**: ¥%.2f
- **已收账款总额**: ¥%.2f (回款率: %.2f%%)
- **应收账款未收净敞口(余额)**: ¥%.2f
- **预期信用损失(坏账准备)测算总额**: ¥%.2f (综合计提率: %.2f%%)
- **有效入表核算记录**: %d笔
- **实质性风险隔离挂起单据**: %d笔

#### 账龄区间与坏账计提结构
| 账龄区间 | 未收余额 (占比) | 坏账准备测算额 | 计提率 | 预警等级 | 催收与管理举措 |
| :--- | :--- | :--- | :--- | :--- | :--- |
%s

#### 前五大欠款客户集中度 (合计占比: %.1f%%)
| 排名 | 客户名称 | 初始信用等级 | 欠款总额 | 占比 |
| :--- | :--- | :--- | :--- | :--- |
%s

#### Step 3隔离审计异常分布
%s
`,
		pipelineResult.AsOfDate,
		pipelineResult.NormalARTotal,
		pipelineResult.NormalRecTotal,
		recRate,
		pipelineResult.NormalBalTotal,
		pipelineResult.NormalProvTotal,
		pipelineResult.OverallProvRate*100.0,
		pipelineResult.NormalCount,
		pipelineResult.TotalSuspended,
		strings.Join(agingLines, "\n"),
		top5Ratio,
		strings.Join(top5Lines, "\n"),
		strings.Join(anomalyLines, "\n"),
	)

	_ = stream.Send(StreamChunk{Type: "tool_end", Content: "财务指标底稿已聚合完毕，正在撰写审计管报..."})

	opts := []option.RequestOption{
		option.WithBaseURL(cfg.BaseURL),
		option.WithRequestTimeout(180 * time.Second),
	}
	if cfg.APIKey != "" {
		opts = append(opts, option.WithAPIKey(cfg.APIKey))
	} else {
		opts = append(opts, option.WithAPIKey("no-key"))
	}
	client := openai.NewClient(opts...)

	prompt := fmt.Sprintf(`你是一名资深注册会计师兼大型集团财务总监。请根据以下提供的应收账款底层治理底稿，撰写一份面向企业董事会与高级管理层（CXO）的权威、详尽、高度结构化的《应收账款质量治理与信用风险审计管理报告》。

要求遵循《企业会计准则第22号——金融工具确认和计量》（新金融工具准则ECL模型），具备前瞻性风控视角与极高的实务操作价值。严禁使用任何emoji表情符号。

报告必须包含以下五大标准篇章：
# 《应收账款资产质量治理与信用风险审计管理报告》
> 报告基准日：%s | 审计核算机构：财务治理与信用风控部

## 一、 执行摘要与资产质量全景
- 核心KPI汇总（应收总额、未收敞口、回款进度、坏账准备金总额、综合损失率）；
- 整体资产安全性、流动性综合审计评价结论。

## 二、 账龄结构迁徙与预期信用损失（坏账准备）深度剖析
- 详细结合账龄区间表格展开分析，指出哪些账龄阶段是沉淀风险的主力；
- 评析当前5级计提标准（综合计提率%s）的充分性与合规性。

## 三、 重点客户集中度敞口与信用逾期穿透
- 深度点评前五大客户欠款集中度（前五大合计占比%.1f%%）；
- 针对逾期严重的大客户指出潜在违约传导风险。

## 四、 财务数据治理与实质性异常单据审计专项
- 对Step 3隔离出的%d笔挂起异常（包括已收大于应收、离群金额、0余额挂账等）进行原因归类与内控缺陷分析；
- 提出具体的调账处理、发票红冲与业务复核规范建议。

## 五、 差异化催收行动方案与内部控制长效改进策略
- 针对正常、关注、审慎、高危、严重五个层级，分别制定精细化、分权责的催收落地策略（法务介入、停止发货、抵押担保、高频对账等）；
- 提出客户授信动态评审与应收账款信息化考核长效机制。

---
底稿数据：
%s
`, pipelineResult.AsOfDate, fmt.Sprintf("%.2f%%", pipelineResult.OverallProvRate*100.0), top5Ratio, pipelineResult.TotalSuspended, dossier)

	params := openai.ChatCompletionNewParams{
		Model: openai.ChatModel(cfg.Model),
		Messages: []openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage("你是一名顶级资深财务与审计专家，善于输出逻辑严密、数据详实、格式优美的大型管理咨询与审计分析报告。严禁使用任何emoji表情符号。"),
			openai.UserMessage(prompt),
		},
	}
	if cfg.ReasoningEffort != "" {
		params.ReasoningEffort = shared.ReasoningEffort(cfg.ReasoningEffort)
	}

	streamRes := client.Chat.Completions.NewStreaming(ctx, params)
	var fullReport strings.Builder

	var tokenUnmasker *StreamingUnmasker
	var reasoningUnmasker *StreamingUnmasker
	if shouldAnonymize {
		tokenUnmasker = NewStreamingUnmasker(anonymizer, func(unmasked string) {
			_ = stream.Send(StreamChunk{Type: "token", Content: unmasked})
		})
		reasoningUnmasker = NewStreamingUnmasker(anonymizer, func(unmasked string) {
			_ = stream.Send(StreamChunk{Type: "reasoning", Content: unmasked})
		})
	}

	for streamRes.Next() {
		chunk := streamRes.Current()
		rawJSON := chunk.RawJSON()

		if rVal := gjson.Get(rawJSON, "choices.0.delta.reasoning_content").String(); rVal != "" {
			if shouldAnonymize {
				reasoningUnmasker.Feed(rVal)
			} else {
				_ = stream.Send(StreamChunk{Type: "reasoning", Content: rVal})
			}
		} else if rVal2 := gjson.Get(rawJSON, "choices.0.delta.reasoning").String(); rVal2 != "" {
			if shouldAnonymize {
				reasoningUnmasker.Feed(rVal2)
			} else {
				_ = stream.Send(StreamChunk{Type: "reasoning", Content: rVal2})
			}
		}

		if len(chunk.Choices) > 0 {
			delta := chunk.Choices[0].Delta
			if delta.Content != "" {
				fullReport.WriteString(delta.Content)
				if shouldAnonymize {
					tokenUnmasker.Feed(delta.Content)
				} else {
					_ = stream.Send(StreamChunk{Type: "token", Content: delta.Content})
				}
			}
		}
	}

	if shouldAnonymize {
		reasoningUnmasker.Flush()
		tokenUnmasker.Flush()
	}

	if err := streamRes.Err(); err != nil {
		return nil, fmt.Errorf("生成报告失败: %w", err)
	}

	_ = stream.Send(StreamChunk{Type: "done"})

	finalContent := fullReport.String()
	if shouldAnonymize {
		finalContent = anonymizer.Unmask(finalContent)
	}

	return &ReportResult{
		MarkdownContent:  finalContent,
		ExecutiveSummary: fmt.Sprintf("基准日%s应收账款未收敞口¥%.2f，计提坏账准备¥%.2f（综合计提率%.2f%%），前五大客户集中度%.1f%%。", pipelineResult.AsOfDate, pipelineResult.NormalBalTotal, pipelineResult.NormalProvTotal, pipelineResult.OverallProvRate*100.0, top5Ratio),
		CreatedAt:        time.Now().Format("2006-01-02 15:04:05"),
	}, nil
}
