package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/nextlevelbuilder/goclaw/internal/store"
)

// AgentManageTool lets a privileged agent (CAO) list, describe, create and update
// agents within the same tenant. It does NOT allow deletion (soft-delete only via
// status="inactive") and cannot modify its own config to prevent self-escalation.
type AgentManageTool struct {
	agents store.AgentCRUDStore
}

func NewAgentManageTool(agents store.AgentCRUDStore) *AgentManageTool {
	return &AgentManageTool{agents: agents}
}

func (t *AgentManageTool) Name() string { return "agent_manage" }

func (t *AgentManageTool) Description() string {
	return "Manage agents within your tenant. " +
		"action=list: return a summary of all agents. " +
		"action=describe: return full details for an agent by key. " +
		"action=create: create a new agent with a unique key, display name, emoji, description, provider and model. " +
		"action=update: update editable fields (display_name, emoji, agent_description, status, model, provider) for an existing agent. " +
		"You cannot modify your own configuration or permanently delete agents."
}

func (t *AgentManageTool) Parameters() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"action": map[string]any{
				"type":        "string",
				"enum":        []string{"list", "describe", "create", "update"},
				"description": "Operation to perform.",
			},
			"agent_key": map[string]any{
				"type":        "string",
				"description": "Unique agent identifier (lowercase alphanumeric + hyphens). Required for describe/update. Specify for create to set a custom key; otherwise derived from display_name.",
			},
			"display_name": map[string]any{
				"type":        "string",
				"description": "Human-readable agent name. Required for create.",
			},
			"emoji": map[string]any{
				"type":        "string",
				"description": "Single emoji used as the agent avatar.",
			},
			"agent_description": map[string]any{
				"type":        "string",
				"description": "Short description shown on the agent welcome screen.",
			},
			"provider": map[string]any{
				"type":        "string",
				"description": "LLM provider key (e.g. openai, anthropic, google). Required for create.",
			},
			"model": map[string]any{
				"type":        "string",
				"description": "Model identifier (e.g. gpt-4o, claude-3-5-sonnet-20241022). Required for create.",
			},
			"agent_type": map[string]any{
				"type":        "string",
				"enum":        []string{"open", "predefined", "command"},
				"description": "Agent type. 'command' creates a Command Agent Orchestrator (CAO). Defaults to 'predefined' for new agents.",
			},
			"status": map[string]any{
				"type":        "string",
				"enum":        []string{"active", "inactive"},
				"description": "Agent status. Set to inactive to disable without deleting.",
			},
			"frontmatter": map[string]any{
				"type":        "string",
				"description": "Optional system-prompt / expertise summary for a newly created agent.",
			},
		},
		"required": []string{"action"},
	}
}

var agentKeyRegexp = regexp.MustCompile(`^[a-z0-9][a-z0-9\-]{0,62}$`)

func (t *AgentManageTool) Execute(ctx context.Context, args map[string]any) *Result {
	action, _ := args["action"].(string)
	switch action {
	case "list":
		return t.execList(ctx)
	case "describe":
		return t.execDescribe(ctx, args)
	case "create":
		return t.execCreate(ctx, args)
	case "update":
		return t.execUpdate(ctx, args)
	default:
		return ErrorResult("action must be one of: list, describe, create, update")
	}
}

func (t *AgentManageTool) execList(ctx context.Context) *Result {
	agents, err := t.agents.List(ctx, "")
	if err != nil {
		return ErrorResult(fmt.Sprintf("failed to list agents: %v", err))
	}
	type row struct {
		Key         string `json:"agent_key"`
		DisplayName string `json:"display_name"`
		Emoji       string `json:"emoji,omitempty"`
		Model       string `json:"model"`
		Provider    string `json:"provider"`
		Status      string `json:"status"`
		IsDefault   bool   `json:"is_default,omitempty"`
	}
	rows := make([]row, 0, len(agents))
	for _, a := range agents {
		rows = append(rows, row{
			Key:         a.AgentKey,
			DisplayName: a.DisplayName,
			Emoji:       a.Emoji,
			Model:       a.Model,
			Provider:    a.Provider,
			Status:      a.Status,
			IsDefault:   a.IsDefault,
		})
	}
	b, _ := json.Marshal(rows)
	return &Result{ForLLM: string(b)}
}

func (t *AgentManageTool) execDescribe(ctx context.Context, args map[string]any) *Result {
	key, _ := args["agent_key"].(string)
	if key == "" {
		return ErrorResult("agent_key is required for action=describe")
	}
	a, err := t.agents.GetByKey(ctx, key)
	if err != nil {
		return ErrorResult(fmt.Sprintf("agent not found: %s", key))
	}
	type summary struct {
		Key              string    `json:"agent_key"`
		ID               uuid.UUID `json:"id"`
		DisplayName      string    `json:"display_name"`
		Emoji            string    `json:"emoji,omitempty"`
		AgentDescription string    `json:"agent_description,omitempty"`
		Model            string    `json:"model"`
		Provider         string    `json:"provider"`
		ContextWindow    int       `json:"context_window"`
		Status           string    `json:"status"`
		IsDefault        bool      `json:"is_default"`
		UpdatedAt        time.Time `json:"updated_at"`
	}
	out, _ := json.Marshal(summary{
		Key:              a.AgentKey,
		ID:               a.ID,
		DisplayName:      a.DisplayName,
		Emoji:            a.Emoji,
		AgentDescription: a.AgentDescription,
		Model:            a.Model,
		Provider:         a.Provider,
		ContextWindow:    a.ContextWindow,
		Status:           a.Status,
		IsDefault:        a.IsDefault,
		UpdatedAt:        a.UpdatedAt,
	})
	return &Result{ForLLM: string(out)}
}

func (t *AgentManageTool) execCreate(ctx context.Context, args map[string]any) *Result {
	displayName, _ := args["display_name"].(string)
	if strings.TrimSpace(displayName) == "" {
		return ErrorResult("display_name is required for action=create")
	}
	provider, _ := args["provider"].(string)
	model, _ := args["model"].(string)
	if provider == "" || model == "" {
		return ErrorResult("provider and model are required for action=create")
	}

	// Derive or validate agent_key
	agentKey, _ := args["agent_key"].(string)
	if agentKey == "" {
		agentKey = slugifyAgentKey(displayName)
	}
	if !agentKeyRegexp.MatchString(agentKey) {
		return ErrorResult(fmt.Sprintf("invalid agent_key %q: must match [a-z0-9][a-z0-9-]{0,62}", agentKey))
	}

	// Prevent creating an agent with the same key as the caller
	callerKey := store.AgentKeyFromContext(ctx)
	if callerKey != "" && callerKey == agentKey {
		return ErrorResult("cannot create an agent with the same key as the caller")
	}

	ownerID := store.ActorIDFromContext(ctx)
	emoji, _ := args["emoji"].(string)
	description, _ := args["agent_description"].(string)
	frontmatter, _ := args["frontmatter"].(string)

	agentType := store.AgentTypePredefined
	if v, ok := args["agent_type"].(string); ok {
		switch v {
		case store.AgentTypeCommand, store.AgentTypeOpen, store.AgentTypePredefined:
			agentType = v
		}
	}

	ag := &store.AgentData{
		AgentKey:          agentKey,
		DisplayName:       displayName,
		Emoji:             emoji,
		AgentDescription:  description,
		Frontmatter:       frontmatter,
		Provider:          provider,
		Model:             model,
		OwnerID:           ownerID,
		Status:            "active",
		AgentType:         agentType,
		ContextWindow:     131072,
		MaxToolIterations: 30,
	}

	if err := t.agents.Create(ctx, ag); err != nil {
		return ErrorResult(fmt.Sprintf("failed to create agent: %v", err))
	}

	out, _ := json.Marshal(map[string]any{
		"id":        ag.ID.String(),
		"agent_key": ag.AgentKey,
		"message":   fmt.Sprintf("Agent %q (%s) created successfully.", displayName, agentKey),
	})
	return &Result{ForLLM: string(out)}
}

func (t *AgentManageTool) execUpdate(ctx context.Context, args map[string]any) *Result {
	key, _ := args["agent_key"].(string)
	if key == "" {
		return ErrorResult("agent_key is required for action=update")
	}

	// Self-update prevention
	callerKey := store.AgentKeyFromContext(ctx)
	if callerKey != "" && callerKey == key {
		return ErrorResult("an agent cannot update its own configuration via this tool")
	}

	target, err := t.agents.GetByKey(ctx, key)
	if err != nil {
		return ErrorResult(fmt.Sprintf("agent not found: %s", key))
	}

	updates := map[string]any{}
	if v, ok := args["display_name"].(string); ok && v != "" {
		updates["display_name"] = v
	}
	if v, ok := args["emoji"].(string); ok && v != "" {
		updates["emoji"] = v
	}
	if v, ok := args["agent_description"].(string); ok {
		updates["agent_description"] = v
	}
	if v, ok := args["model"].(string); ok && v != "" {
		updates["model"] = v
	}
	if v, ok := args["provider"].(string); ok && v != "" {
		updates["provider"] = v
	}
	if v, ok := args["status"].(string); ok && (v == "active" || v == "inactive") {
		updates["status"] = v
	}
	if v, ok := args["agent_type"].(string); ok {
		switch v {
		case store.AgentTypeCommand, store.AgentTypeOpen, store.AgentTypePredefined:
			updates["agent_type"] = v
		}
	}

	if len(updates) == 0 {
		return ErrorResult("no updatable fields provided; use display_name, emoji, agent_description, model, provider, or status")
	}

	if err := t.agents.Update(ctx, target.ID, updates); err != nil {
		return ErrorResult(fmt.Sprintf("failed to update agent: %v", err))
	}

	out, _ := json.Marshal(map[string]any{
		"agent_key": key,
		"updated":   updates,
		"message":   fmt.Sprintf("Agent %q updated successfully.", key),
	})
	return &Result{ForLLM: string(out)}
}

// slugifyAgentKey converts a display name to a valid agent key.
func slugifyAgentKey(name string) string {
	s := strings.ToLower(name)
	s = regexp.MustCompile(`[^a-z0-9]+`).ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if len(s) > 62 {
		s = s[:62]
	}
	if s == "" {
		return "agent-" + fmt.Sprintf("%d", time.Now().Unix()%10000)
	}
	return s
}
