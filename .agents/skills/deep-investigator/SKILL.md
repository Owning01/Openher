---
name: deep-investigator
description: Super research orchestrator workflow. MANDATORY to spawn and invoke specialized subagents (fact-checker, solution-architect, domain experts) in parallel using invoke_subagent. Adapts output format dynamically without rigid templates. Includes computer-use fallback for CORS/captchas.
---

# Deep Investigator Skill

## ⚠️ Core Rule: Mandatory Subagent Delegation
The orchestrator must NEVER do all the reasoning alone. It MUST invoke subagents via `invoke_subagent`:
1. **Scout Phase**: Multi-query search (`search_web` / `read_url_content` / `computer-use`).
2. **Subagent Delegation (Parallel)**:
   - Spawn `fact-checker` to aggressively audit findings, find failure modes, and debunk hype.
   - Spawn `solution-architect` to build the concrete code, MCP config, or Skill blueprint.
3. **Synthesis**: Consolidate subagent findings into a direct, solution-first response.

## Output Style: Fully Adaptive & Dynamic
Do NOT follow a single rigid template for every answer. Adapt formatting, charts, bullets, and code blocks specifically to the user inquiry.