---
id: research-vision-model-mcp-traductor
title: "Modelos de Visión Pequeños para MCP Traductor"
date: 2026-07-18
category: Investigación
tags: [vision, vlm, mcp, moondream, gemini, smolvlm, qwen, traductor, ia, modelos-pequeños]
---

Research: Modelos de Visión Pequeños para MCP Traductor — Julio 2026

  /* --- RESET --- */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* --- BASE --- */
  body {
    font-family: 'Courier New', Courier, monospace;
    background: #FFF8F0;
    color: #1A1A1A;
    line-height: 1.6;
    padding: 0;
  }

  /* --- HEADER BANNER --- */
  .header {
    background: #1A1A1A;
    color: #FFF;
    padding: 60px 40px;
    border-bottom: 6px solid #FF6B35;
    position: relative;
  }
  .header::after {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 40px;
    width: 120px;
    height: 6px;
    background: #FFD166;
  }
  .header h1 {
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 3.6rem;
    text-transform: uppercase;
    letter-spacing: -1px;
    line-height: 1;
    margin-bottom: 16px;
  }
  .header .subtitle {
    font-size: 1.2rem;
    color: #FFD166;
    margin-bottom: 20px;
    font-weight: bold;
  }
  .header .meta {
    font-size: 0.9rem;
    color: #FFD166;
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }
  .header .meta span {
    background: rgba(255,255,255,0.1);
    padding: 4px 12px;
    border: 2px solid rgba(255,255,255,0.2);
  }

  /* --- CONTAINER --- */
  .container { max-width: 1200px; margin: 0 auto; padding: 0 40px; }

  /* --- SECTION --- */
  .section {
    padding: 48px 0;
    border-bottom: 4px solid #000;
    position: relative;
  }
  .section:last-of-type { border-bottom: none; }

  .section-title {
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 2.4rem;
    text-transform: uppercase;
    margin-bottom: 32px;
    display: inline-block;
    padding: 8px 0;
    border-bottom: 6px solid #FF6B35;
    letter-spacing: -0.5px;
  }

  .section-alt { background: #FFF0E0; }
  .section-alt2 { background: #E8F0FE; }
  .section-alt3 { background: #F0FFF0; }
  .section-alt4 { background: #FFF8F0; }

  /* --- CARDS --- */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 24px;
  }
  .card {
    background: #FFF;
    border: 4px solid #000;
    padding: 24px;
    box-shadow: 6px 6px 0 0 #000;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .card:hover {
    transform: translate(-2px, -2px);
    box-shadow: 10px 10px 0 0 #000;
  }
  .card-wide { grid-column: span 2; }
  .card h3 {
    font-size: 1.3rem;
    font-weight: bold;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .card .model-size {
    font-size: 0.85rem;
    color: #555;
    margin-bottom: 12px;
  }
  .card .tag {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: bold;
    text-transform: uppercase;
    padding: 2px 10px;
    border: 2px solid #000;
    margin-bottom: 12px;
  }
  .tag-high { background: #3A7D44; color: #FFF; }
  .tag-medium { background: #FFD166; color: #1A1A1A; }
  .tag-low { background: #E8505B; color: #FFF; }
  .tag-rank1 { background: #FF6B35; color: #FFF; }
  .tag-rank2 { background: #004E98; color: #FFF; }
  .tag-rank3 { background: #3A7D44; color: #FFF; }

  .card ul, .card p { font-size: 0.9rem; }
  .card li { margin-bottom: 4px; }

  .badge {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: bold;
    text-transform: uppercase;
    padding: 2px 8px;
    border: 2px solid #000;
  }
  .badge-green { background: #3A7D44; color: #FFF; }
  .badge-blue { background: #004E98; color: #FFF; }
  .badge-orange { background: #FF6B35; color: #FFF; }
  .badge-yellow { background: #FFD166; color: #1A1A1A; }

  /* --- EXECUTIVE SUMMARY --- */
  .exec-summary {
    background: #FF6B35;
    border: 4px solid #000;
    padding: 32px;
    box-shadow: 8px 8px 0 0 #000;
  }
  .exec-summary h2 {
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 2rem;
    color: #FFF;
    text-transform: uppercase;
    margin-bottom: 20px;
    letter-spacing: -0.5px;
  }
  .exec-summary ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .exec-summary li {
    background: rgba(0,0,0,0.15);
    padding: 14px 20px;
    border-left: 6px solid #FFD166;
    color: #FFF;
    font-weight: bold;
    font-size: 1.05rem;
  }
  .exec-summary li::before { content: '▸ '; color: #FFD166; }

  /* --- RANKING TABLE --- */
  .ranking-table {
    width: 100%;
    border-collapse: collapse;
    border: 4px solid #000;
    margin-bottom: 24px;
  }
  .ranking-table th {
    background: #1A1A1A;
    color: #FFF;
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 0.9rem;
    text-transform: uppercase;
    padding: 12px 10px;
    text-align: left;
    letter-spacing: 0.5px;
  }
  .ranking-table td {
    padding: 12px 10px;
    border-bottom: 2px solid #000;
    font-size: 0.85rem;
    vertical-align: top;
  }
  .ranking-table tr:nth-child(even) { background: #FFF0E0; }
  .ranking-table tr:hover { background: #FFD166; }
  .rank-num {
    display: inline-block;
    width: 28px;
    height: 28px;
    line-height: 28px;
    text-align: center;
    font-weight: bold;
    font-size: 0.9rem;
    border: 2px solid #000;
  }
  .rank-1 { background: #FF6B35; color: #FFF; }
  .rank-2 { background: #004E98; color: #FFF; }
  .rank-3 { background: #3A7D44; color: #FFF; }

  /* --- MCP CODE BLOCK --- */
  .code-block {
    background: #1A1A1A;
    color: #FFF;
    padding: 20px;
    border: 4px solid #000;
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    overflow-x: auto;
    margin: 16px 0;
    box-shadow: 4px 4px 0 0 #000;
  }
  .code-block .comment { color: #FFD166; }
  .code-block .keyword { color: #FF6B35; }
  .code-block .string { color: #3A7D44; }

  /* --- FINDINGS --- */
  .findings-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
  .findings-list li {
    background: #FFF;
    border: 3px solid #000;
    padding: 16px 20px;
    box-shadow: 4px 4px 0 0 #000;
  }
  .findings-list li strong { text-transform: uppercase; }
  .source-link {
    font-size: 0.8rem;
    color: #004E98;
    text-decoration: underline;
    text-decoration-style: dotted;
  }

  /* --- TWO-COLUMN LAYOUT --- */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }

  /* --- CONFLICTS & GAPS --- */
  .conflict-card, .gap-card {
    background: #FFF;
    border: 4px solid #000;
    padding: 24px;
    box-shadow: 6px 6px 0 0 #000;
  }
  .conflict-card h3, .gap-card h3 {
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 1.4rem;
    text-transform: uppercase;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 4px solid;
  }
  .conflict-card h3 { border-color: #E8505B; }
  .gap-card h3 { border-color: #FF6B35; }
  .conflict-item, .gap-item {
    padding: 12px 0;
    border-bottom: 2px dashed #CCC;
    font-size: 0.9rem;
  }
  .conflict-item:last-child, .gap-item:last-child { border-bottom: none; }

  /* --- SOURCES TABLE --- */
  .sources-table {
    width: 100%;
    border-collapse: collapse;
    border: 4px solid #000;
  }
  .sources-table th {
    background: #1A1A1A;
    color: #FFF;
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 0.9rem;
    text-transform: uppercase;
    padding: 14px 16px;
    text-align: left;
    letter-spacing: 0.5px;
  }
  .sources-table td {
    padding: 10px 16px;
    border-bottom: 2px solid #000;
    font-size: 0.85rem;
  }
  .sources-table tr:nth-child(even) { background: #FFF0E0; }
  .sources-table tr:hover { background: #FFD166; }

  /* --- ARCHITECTURE DIAGRAM --- */
  .arch-box {
    background: #FFF;
    border: 4px solid #000;
    padding: 24px;
    box-shadow: 6px 6px 0 0 #000;
    text-align: center;
  }
  .arch-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    margin: 16px 0;
  }
  .arch-node {
    padding: 12px 20px;
    border: 3px solid #000;
    font-weight: bold;
    font-size: 0.85rem;
    text-align: center;
    m
