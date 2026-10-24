package ai

import (
	"fmt"
	"strings"
	"sync"
)

// Anonymizer handles masking sensitive corporate names in financial datasets.
type Anonymizer struct {
	mu           sync.RWMutex
	nameToMasked map[string]string
	maskedToName map[string]string
	counter      int
}

// NewAnonymizer creates a fresh anonymizer instance.
func NewAnonymizer() *Anonymizer {
	return &Anonymizer{
		nameToMasked: make(map[string]string),
		maskedToName: make(map[string]string),
		counter:      1,
	}
}

// MaskCustomer returns an anonymized pseudo-name for the given real customer name.
func (a *Anonymizer) MaskCustomer(realName string) string {
	if realName == "" {
		return ""
	}
	a.mu.Lock()
	defer a.mu.Unlock()

	if masked, ok := a.nameToMasked[realName]; ok {
		return masked
	}
	masked := fmt.Sprintf("企业客户_%02d", a.counter)
	a.counter++
	a.nameToMasked[realName] = masked
	a.maskedToName[masked] = realName
	return masked
}

// Unmask replaces all anonymized tokens in text back to original names if present.
func (a *Anonymizer) Unmask(text string) string {
	a.mu.RLock()
	defer a.mu.RUnlock()

	res := text
	for masked, realName := range a.maskedToName {
		res = strings.ReplaceAll(res, masked, realName)
	}
	return res
}
