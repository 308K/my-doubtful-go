package ai

import (
	"fmt"
	"sort"
	"strings"
	"sync"
	"unicode"
)

// Anonymizer handles masking sensitive corporate names in financial datasets and restoring them locally.
type Anonymizer struct {
	mu           sync.RWMutex
	nameToMasked map[string]string
	maskedToName map[string]string
	sortedNames  []string // sorted by length descending for greedy text replacement
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

// SeedCustomers pre-populates the anonymizer with all known customer names from datasets and rules.
func (a *Anonymizer) SeedCustomers(names []string) {
	a.mu.Lock()
	defer a.mu.Unlock()

	uniqueMap := make(map[string]struct{})
	var uniqueNames []string
	for _, raw := range names {
		trimmed := strings.TrimSpace(raw)
		if trimmed == "" {
			continue
		}
		if _, exists := uniqueMap[trimmed]; !exists {
			uniqueMap[trimmed] = struct{}{}
			uniqueNames = append(uniqueNames, trimmed)
		}
	}
	// Sort by character count descending so longer specific names get prioritized
	sort.Slice(uniqueNames, func(i, j int) bool {
		return len(uniqueNames[i]) > len(uniqueNames[j])
	})

	for _, name := range uniqueNames {
		if _, ok := a.nameToMasked[name]; !ok {
			masked := fmt.Sprintf("企业客户_%02d", a.counter)
			a.counter++
			a.nameToMasked[name] = masked
			a.maskedToName[masked] = name
		}
	}

	a.updateSortedNames()
}

func (a *Anonymizer) updateSortedNames() {
	var list []string
	for name := range a.nameToMasked {
		list = append(list, name)
	}
	// Sort by character count descending so longer specific names match before shorter substrings
	sort.Slice(list, func(i, j int) bool {
		return len(list[i]) > len(list[j])
	})
	a.sortedNames = list
}

// MaskCustomer returns an anonymized pseudo-name for the given real customer name.
func (a *Anonymizer) MaskCustomer(realName string) string {
	trimmed := strings.TrimSpace(realName)
	if trimmed == "" {
		return ""
	}
	a.mu.Lock()
	defer a.mu.Unlock()

	if masked, ok := a.nameToMasked[trimmed]; ok {
		return masked
	}
	masked := fmt.Sprintf("企业客户_%02d", a.counter)
	a.counter++
	a.nameToMasked[trimmed] = masked
	a.maskedToName[masked] = trimmed
	a.updateSortedNames()
	return masked
}

// MaskText scans free-form user or system text and replaces known real corporate names with masked tokens.
func (a *Anonymizer) MaskText(text string) string {
	if text == "" {
		return ""
	}
	a.mu.RLock()
	defer a.mu.RUnlock()

	res := text
	for _, realName := range a.sortedNames {
		masked := a.nameToMasked[realName]
		res = strings.ReplaceAll(res, realName, masked)
	}
	return res
}

// Unmask replaces all anonymized tokens ("企业客户_01" etc.) back to original real corporate names.
func (a *Anonymizer) Unmask(text string) string {
	if text == "" {
		return ""
	}
	a.mu.RLock()
	defer a.mu.RUnlock()

	res := text
	for masked, realName := range a.maskedToName {
		res = strings.ReplaceAll(res, masked, realName)
	}
	return res
}

// StreamingUnmasker buffers incoming streaming LLM tokens and replaces "企业客户_XX" in real time.
type StreamingUnmasker struct {
	mu         sync.Mutex
	buffer     []rune
	prefix     []rune
	anonymizer *Anonymizer
	emit       func(string)
}

// NewStreamingUnmasker creates a real-time stream token restorer.
func NewStreamingUnmasker(anon *Anonymizer, emit func(string)) *StreamingUnmasker {
	return &StreamingUnmasker{
		buffer:     make([]rune, 0, 64),
		prefix:     []rune("企业客户_"),
		anonymizer: anon,
		emit:       emit,
	}
}

// Feed ingests an incremental chunk of text from the LLM, unmasking tokens as soon as complete.
func (s *StreamingUnmasker) Feed(chunk string) {
	if chunk == "" {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()

	s.buffer = append(s.buffer, []rune(chunk)...)

	prefixLen := len(s.prefix)

	for len(s.buffer) > 0 {
		firstRune := s.prefix[0]
		firstIdx := -1
		for idx, r := range s.buffer {
			if r == firstRune {
				firstIdx = idx
				break
			}
		}

		if firstIdx == -1 {
			s.emit(string(s.buffer))
			s.buffer = s.buffer[:0]
			break
		}

		if firstIdx > 0 {
			s.emit(string(s.buffer[:firstIdx]))
			s.buffer = s.buffer[firstIdx:]
		}

		if len(s.buffer) < prefixLen {
			isPrefix := true
			for k := 0; k < len(s.buffer); k++ {
				if s.buffer[k] != s.prefix[k] {
					isPrefix = false
					break
				}
			}
			if isPrefix {
				break
			}
			s.emit(string(s.buffer[0]))
			s.buffer = s.buffer[1:]
			continue
		}

		matchesPrefix := true
		for k := 0; k < prefixLen; k++ {
			if s.buffer[k] != s.prefix[k] {
				matchesPrefix = false
				break
			}
		}

		if !matchesPrefix {
			s.emit(string(s.buffer[0]))
			s.buffer = s.buffer[1:]
			continue
		}

		j := prefixLen
		for j < len(s.buffer) && unicode.IsDigit(s.buffer[j]) {
			j++
		}

		if j == len(s.buffer) {
			break
		}

		if j > prefixLen {
			token := string(s.buffer[:j])
			realName := s.anonymizer.Unmask(token)
			s.emit(realName)
			s.buffer = s.buffer[j:]
			continue
		}

		s.emit(string(s.buffer[0]))
		s.buffer = s.buffer[1:]
	}
}

// Flush emits any remaining buffered text, restoring any masked tokens still in buffer.
func (s *StreamingUnmasker) Flush() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if len(s.buffer) > 0 {
		unmasked := s.anonymizer.Unmask(string(s.buffer))
		s.emit(unmasked)
		s.buffer = s.buffer[:0]
	}
}
