---
id: opencode-token-optimization
title: "Token Warfare — OpenCode + Antigravity + Gemini 3.5 Flash"
date: 2026-07-19
category: Guía
tags: [opencode, antigravity, gemini, tokens, optimización, dcp, rtk, caveman, mcp, agentsmd, plan-mode, 2026]
---

Investigación: Optimización de Tokens OpenCode + Antigravity + Gemini 3.5 Flash

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
    width: 160px;
    height: 6px;
    background: #FFD166;
  }
  .header h1 {
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 4rem;
    text-transform: uppercase;
    letter-spacing: -2px;
    line-height: 1;
    margin-bottom: 16px;
  }
  .header .subtitle {
    font-size: 1.2rem;
    color: #FFD166;
    margin-bottom: 20px;
    font-weight: bold;
    border-left: 4px solid #FF6B35;
    padding-left: 16px;
  }
  .header .meta {
    font-size: 0.85rem;
    color: #FFD166;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  .header .meta span {
    background: rgba(255,255,255,0.08);
    padding: 4px 12px;
    border: 2px solid rgba(255,255,255,0.15);
  }

  /* --- CONTAINER --- */
  .container { max-width: 1200px; margin: 0 auto; padding: 0 40px; }

  /* --- STICKY TOC --- */
  .sticky-bar {
    position: sticky;
    top: 0;
    background: #FFD166;
    border-bottom: 4px solid #000;
    padding: 10px 40px;
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: uppercase;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 100;
    flex-wrap: wrap;
    gap: 8px;
  }
  .sticky-bar .toc-links {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  .sticky-bar .toc-links a {
    color: #1A1A1A;
    text-decoration: none;
    border: 2px solid #1A1A1A;
    padding: 2px 8px;
    font-size: 0.7rem;
  }
  .sticky-bar .toc-links a:hover {
    background: #1A1A1A;
    color: #FFD166;
  }

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
  .section-alt4 { background: #FFF0F0; }

  /* --- EXECUTIVE SUMMARY --- */
  .exec-summary {
    background: #FF6B35;
    border: 4px solid #000;
    padding: 32px;
    box-shadow: 8px 8px 0 0 #000;
    margin-bottom: 0;
  }
  .exec-summary h2 {
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 2rem;
    color: #FFF;
    text-transform: uppercase;
    margin-bottom: 24px;
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

  /* --- CARDS --- */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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
  .card-full { grid-column: 1 / -1; }
  .card h3 {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .card h4 {
    font-size: 1rem;
    font-weight: bold;
    margin-top: 12px;
    margin-bottom: 8px;
  }
  .card .tag {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: bold;
    text-transform: uppercase;
    padding: 2px 10px;
    border: 2px solid #000;
    margin-bottom: 12px;
  }
  .tag-high { background: #3A7D44; color: #FFF; }
  .tag-medium { background: #FFD166; color: #1A1A1A; }
  .tag-low { background: #E8505B; color: #FFF; }
  .tag-info { background: #004E98; color: #FFF; }

  .card p { margin-bottom: 8px; font-size: 0.9rem; }
  .card-code {
    background: #1A1A1A;
    color: #7FFF00;
    padding: 12px;
    font-size: 0.8rem;
    font-family: 'Courier New', monospace;
    border: 2px solid #000;
    margin: 8px 0;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .card .source-link {
    display: inline-block;
    margin-top: 8px;
    font-size: 0.75rem;
    color: #004E98;
    text-decoration: underline;
    text-decoration-style: dotted;
  }

  /* --- CODE BLOCKS --- */
  .code-block {
    background: #1A1A1A;
    color: #7FFF00;
    padding: 16px;
    font-size: 0.85rem;
    font-family: 'Courier New', monospace;
    border: 3px solid #000;
    margin: 16px 0;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    box-shadow: 4px 4px 0 0 #000;
  }
  .code-block .comment { color: #888; }

  /* --- FINDINGS LIST --- */
  .findings-list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
  .findings-list li {
    background: #FFF;
    border: 3px solid #000;
    padding: 16px 20px;
    box-shadow: 4px 4px 0 0 #000;
  }
  .findings-list li strong { text-transform: uppercase; }

  /* --- TWO-COLUMN --- */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }

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
  }
  .conflict-item:last-child, .gap-item:last-child { border-bottom: none; }
  .conflict-item strong, .gap-item strong { display: block; margin-bottom: 4px; }

  /* --- TABLE --- */
  .sources-table {
    width: 100%;
    border-collapse: collapse;
    border: 4px solid #000;
    margin: 16px 0;
  }
  .sources-table th {
    background: #1A1A1A;
    color: #FFF;
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 0.9rem;
    text-transform: uppercase;
    padding: 12px 14px;
    text-align: left;
    letter-spacing: 0.5px;
  }
  .sources-table td {
    padding: 10px 14px;
    border-bottom: 2px solid #000;
    font-size: 0.82rem;
  }
  .sources-table tr:nth-child(even) { background: #FFF0E0; }
  .sources-table tr:hover { background: #FFD166; }

  .badge {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: bold;
    text-transform: uppercase;
    padding: 2px 8px;
    border: 2px solid #000;
  }
  .badge-primary { background: #004E98; color: #FFF; }
  .badge-secondary { background: #3A7D44; color: #FFF; }
  .badge-tertiary { background: #E8505B; color: #FFF; }
  .badge-warning { background: #FFD166; color: #1A1A1A; }

  /* --- STAT BLOCK --- */
  .stat-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin: 24px 0;
  }
  .stat-card {
    background: #FFF;
    border: 4px solid #000;
    padding: 20px;
    text-align: center;
    box-shadow: 4
