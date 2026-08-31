---
id: opencode-api-guide
title: "OpenCode API Guide"
date: 2026-07-18
category: Guía
tags: [opencode, api, zen, go, sdk, modelos, guide]
---

OpenCode API Guide

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', Courier, monospace;
    background: #FFF8F0;
    color: #1A1A1A;
    line-height: 1.4;
    font-size: 0.85rem;
  }

  .header {
    background: #1A1A1A;
    color: #FFF;
    padding: 24px 32px;
    border-bottom: 4px solid #FF6B35;
    position: relative;
  }
  .header::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 32px;
    width: 100px;
    height: 4px;
    background: #FFD166;
  }
  .header h1 {
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 2.2rem;
    text-transform: uppercase;
    letter-spacing: -1px;
    line-height: 1;
    margin-bottom: 8px;
  }
  .header .subtitle {
    font-size: 0.8rem;
    color: #FFD166;
    font-weight: bold;
  }

  .container { max-width: 1100px; margin: 0 auto; padding: 0 16px; }

  .section {
    padding: 20px 0;
    border-bottom: 3px solid #000;
  }
  .section:last-of-type { border-bottom: none; }

  .section-title {
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 1.3rem;
    text-transform: uppercase;
    margin-bottom: 12px;
    display: inline-block;
    padding: 4px 0;
    border-bottom: 4px solid #FF6B35;
    letter-spacing: -0.3px;
  }

  .section-alt { background: #FFF0E0; margin: 0 -16px; padding: 16px 16px 20px; }
  .section-alt2 { background: #E8F0FE; margin: 0 -16px; padding: 16px 16px 20px; }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 12px;
    margin-bottom: 8px;
  }

  .card {
    background: #FFF;
    border: 3px solid #000;
    padding: 12px 16px;
    box-shadow: 3px 3px 0 0 #000;
  }
  .card h3 {
    font-size: 0.85rem;
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .card p, .card code {
    font-size: 0.78rem;
  }
  .card code {
    background: #1A1A1A;
    color: #FFD166;
    padding: 1px 6px;
    font-size: 0.72rem;
  }
  .card .tag {
    display: inline-block;
    font-size: 0.6rem;
    font-weight: bold;
    text-transform: uppercase;
    padding: 1px 8px;
    border: 2px solid #000;
    margin-bottom: 6px;
  }
  .tag-primary { background: #004E98; color: #FFF; }
  .tag-secondary { background: #3A7D44; color: #FFF; }
  .tag-free { background: #FFD166; color: #1A1A1A; }

  .md-table {
    width: 100%;
    border-collapse: collapse;
    border: 3px solid #000;
    font-size: 0.72rem;
    margin-bottom: 8px;
  }
  .md-table th {
    background: #1A1A1A;
    color: #FFF;
    font-family: Impact, 'Arial Black', sans-serif;
    font-weight: normal;
    text-transform: uppercase;
    padding: 6px 10px;
    text-align: left;
    font-size: 0.7rem;
    letter-spacing: 0.5px;
  }
  .md-table td {
    padding: 4px 10px;
    border-bottom: 2px solid #000;
    font-size: 0.7rem;
  }
  .md-table tr:nth-child(even) { background: #FFF0E0; }
  .md-table tr:hover { background: #FFD166; }

  .proto-banner {
    display: inline-block;
    font-size: 0.55rem;
    font-weight: bold;
    text-transform: uppercase;
    padding: 2px 8px;
    border: 2px solid #000;
    background: #E8505B;
    color: #FFF;
    margin-left: 6px;
    vertical-align: middle;
  }

  .code-block {
    background: #1A1A1A;
    color: #FFD166;
    border: 3px solid #000;
    padding: 10px 14px;
    font-size: 0.7rem;
    overflow-x: auto;
    margin: 6px 0;
    box-shadow: 3px 3px 0 0 #000;
    line-height: 1.3;
  }
  .code-block .kw { color: #FF6B35; }
  .code-block .str { color: #3A7D44; }
  .code-block .cm { color: #888; }
  .code-block .fn { color: #FFD166; }

  .endpoint-box {
    background: #FFF;
    border: 3px solid #000;
    padding: 8px 14px;
    margin: 6px 0;
    box-shadow: 3px 3px 0 0 #000;
    font-size: 0.75rem;
  }
  .endpoint-box strong { text-transform: uppercase; }
  .endpoint-box code {
    background: #1A1A1A;
    color: #FFD166;
    padding: 1px 6px;
    font-size: 0.72rem;
  }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .info-card {
    background: #FFF;
    border: 3px solid #000;
    padding: 10px 14px;
    box-shadow: 3px 3px 0 0 #000;
  }
  .info-card h3 {
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 1rem;
    text-transform: uppercase;
    margin-bottom: 6px;
    padding-bottom: 4px;
    border-bottom: 3px solid #FF6B35;
  }
  .info-card p, .info-card li {
    font-size: 0.75rem;
    line-height: 1.4;
  }
  .info-card code {
    background: #1A1A1A;
    color: #FFD166;
    padding: 1px 5px;
    font-size: 0.7rem;
  }
  .info-card ul { list-style: none; }
  .info-card li { padding: 2px 0; }
  .info-card li::before { content: '▸ '; color: #FF6B35; }

  .footer {
    background: #1A1A1A;
    color: #FFF;
    text-align: center;
    padding: 12px;
    font-size: 0.65rem;
    border-top: 4px solid #FF6B35;
  }

  @media (max-width: 768px) {
    .header { padding: 16px; }
    .header h1 { font-size: 1.4rem; }
    .container { padding: 0 10px; }
    .two-col { grid-template-columns: 1fr; }
    .card-grid { grid-template-columns: 1fr; }
    .section-title { font-size: 1rem; }
  }

  
    ⌘ OpenCode API Guide
    Zen (pay-as-you-go) · Go (subscription) · Server (local) · SDK
  

  
    ⚡ Overview
    
      
        ZEN
        Pay-As-You-Go
        4 protocolos (OpenAI, Anthropic, Chat Completions, Gemini). Modelos: GPT-5.x, Claude, DeepSeek, Qwen, GLM, Kimi, Grok, MiniMax. Sin suscripción.
      
      
        GO
        Suscripción
        $12/5h · $30/sem · $60/mes. DeepSeek, GLM, Kimi, Qwen, MiniMax, MiMo. Límite duro por período.
      
      
        SERVER
        Local HTTP
        opencode serve --port 4096. REST API para control programático del agente. Sessions, messages, structured output.
      
      
        SDK
        @opencode-ai/sdk
        Cliente TS/JS. pnpm add @opencode-ai/sdk. Prompt con JSON schema, streaming, manejo de sesiones.
      
    
  

  
    🧠 Zen — Modelos

    OpenAI Responses /zen/v1/responses
    
      ModeloID
      
        GPT 5.5gpt-5.5
        GPT 5.5 Progpt-5.5-pro
        GPT 5.4gpt-5.4
        GPT 5.4 Progpt-5.4-pro
        GPT 5.4 Minigpt-5.4-mini
        GPT 5.4 Nanogpt-5.4-nano
        GPT 5.3 Codexgpt-5.3-codex
        GPT 5.3 Codex Sparkgpt-5.3-codex-spark
        GPT 5.2gpt-5.2
        GPT 5.2 Codexgpt-5.2-codex
        GPT 5.1gpt-5.1
        GPT 5.1 Codexgpt-5.1-codex
        GPT 5.1 Codex Maxgpt-5.1-codex-max
        GPT 5gpt-5
        GPT 5 Codexgpt-5-codex
        GPT 5 Nanogpt-5-nano
      
    

    Anthropic Messages /zen/v1/messages
    
      ModeloID
      
        Claude Fable 5claude-fable-5
        Claude Opus 4.8claude-opus-4-8
        Claude Opus 4.7claude-opus-4-7
        Claude Opus 4.6claude-opus-4-6
        Claude Opus 4.5claude-opus-4-5
        Claude Sonnet 5claude-sonnet-5
        Claude Sonnet 4.6claude-sonnet-4-6
        Claude Sonnet 4.5claude-sonnet-4-5
        Claude Haiku 4.5claude-haiku-4-5
        Qwen3.7 Maxqwen3.7-max
        Qwen3.7 Plusqwen3.7-plus
        Qwen3.6 Plusqwen3.6-plus
        Qwen3.5 Plusqwen3.5-plus
        MiniMax M3minimax-m3
        MiniMax M2.7minimax-m2.7
      
    

    Chat Completions /zen/v1/chat/completions
    
      ModeloID
      
        DeepSeek V4 Prodeepseek-v4-pro
        DeepSeek V4 Flashdeepseek-v4-flash
        MiniMax M2.5minimax-m2.5
        GLM 5.2glm-5.2
        GLM 5.1glm-5.1
        GLM 5glm-5
        Kimi K2.5kimi-k2.5
        Kimi K2.6kimi-k2.6
        Kimi K2.7 Codekimi-k2.7-code
        Grok 4.5grok-4.5
        Big Picklebig-pickleFREE
        MiMo-V2.5 Freemimo-v2.5-freeFREE
        North Mini Code Freenorth-mini-code-freeFREE
        Nemotron 3 Ultra Freenemotron-3-ultra-freeFREE
        DeepSeek V4 Flash Freedeepseek-v4-flash-freeFREE
      
    

    Google Gemini /zen/v1/models/{id}
    
      ModeloID
      
        Gemini 3.5 Flashgemini-3.5-flash
        Gemini 3.1 Progemini-3.1-pro
        Gemini 3 Fla
