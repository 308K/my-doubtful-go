package main

import (
	"testing"

	"my-doubtful-go/internal/ai"
)

func TestSmartARServiceChatHistory(t *testing.T) {
	svc := &SmartARService{}

	// Initial chat history should be nil or empty
	hist := svc.GetChatHistory()
	if len(hist) != 0 {
		t.Fatalf("expected empty chat history, got %d", len(hist))
	}

	// Save chat messages
	testMsgs := []ai.ChatMessage{
		{
			Role:    "user",
			Content: "测试用户提问",
		},
		{
			Role:    "assistant",
			Content: "测试助手回答",
		},
	}
	svc.SaveChatHistory(testMsgs)

	saved := svc.GetChatHistory()
	if len(saved) != 2 {
		t.Fatalf("expected 2 messages, got %d", len(saved))
	}
	if saved[0].Content != "测试用户提问" || saved[1].Content != "测试助手回答" {
		t.Fatalf("message content mismatch: %+v", saved)
	}

	// Clear chat history
	svc.ClearChatHistory()
	cleared := svc.GetChatHistory()
	if len(cleared) != 0 {
		t.Fatalf("expected cleared chat history, got %d", len(cleared))
	}
}

func TestSmartARServiceCurrentPipelineResult(t *testing.T) {
	svc := &SmartARService{}

	res, err := svc.GetCurrentPipelineResult()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if res != nil {
		t.Fatalf("expected nil initial pipeline result, got %+v", res)
	}
}
