---
id: openmontage-vs-videouse
title: "Research: OpenMontage vs video-use"
date: 2026-07-18
category: Investigación
tags: [hyperframes, video, openmontage, video-use, comparativa]
---

Research: OpenMontage vs video-use

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Courier New', Courier, monospace;
    background: #FFF8F0;
    color: #1A1A1A;
    line-height: 1.6;
    padding: 0;
  }

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
    font-size: 3.6rem;
    text-transform: uppercase;
    letter-spacing: -1px;
    line-height: 1;
    margin-bottom: 16px;
  }
  .header h1 span { color: #FF6B35; }
  .header .subtitle {
    font-size: 1.3rem;
    color: #CCC;
    margin-bottom: 20px;
    font-weight: bold;
  }
  .header .meta {
    font-size: 0.85rem;
    color: #FFD166;
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }
  .header .meta span {
    background: rgba(255,255,255,0.08);
    padding: 4px 14px;
    border: 2px solid rgba(255,255,255,0.15);
  }

  .container { max-width: 1260px; margin: 0 auto; padding: 0 40px; }

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
  .section-alt4 { background: #FFF5F5; }

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
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
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
  .card ul { list-style: none; padding: 0; }
  .card ul li { padding: 4px 0 4px 16px; position: relative; }
  .card ul li::before { content: '— '; position: absolute; left: 0; color: #FF6B35; font-weight: bold; }
  .source-link {
    font-size: 0.8rem;
    color: #004E98;
    text-decoration: underline;
    text-decoration-style: dotted;
  }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }

  .comp-table {
    width: 100%;
    border-collapse: collapse;
    border: 4px solid #000;
    margin-bottom: 24px;
  }
  .comp-table th {
    background: #1A1A1A;
    color: #FFF;
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 1rem;
    text-transform: uppercase;
    padding: 14px 16px;
    text-align: left;
    letter-spacing: 0.5px;
  }
  .comp-table th:first-child { width: 22%; }
  .comp-table th:nth-child(2) { width: 39%; }
  .comp-table th:nth-child(3) { width: 39%; }
  .comp-table td {
    padding: 12px 16px;
    border-bottom: 2px solid #000;
    font-size: 0.9rem;
    vertical-align: top;
  }
  .comp-table tr:nth-child(even) { background: #FFF0E0; }
  .comp-table tr:hover { background: #FFD166; }
  .comp-table td:first-child { font-weight: bold; background: #1A1A1A; color: #FFD166; }
  .comp-table tr:nth-child(even) td:first-child { background: #1A1A1A; }

  .winner { display: inline-block; background: #3A7D44; color: #FFF; font-size: 0.65rem; font-weight: bold; padding: 1px 8px; border: 2px solid #000; text-transform: uppercase; margin-left: 4px; }
  .tie { display: inline-block; background: #FFD166; color: #1A1A1A; font-size: 0.65rem; font-weight: bold; padding: 1px 8px; border: 2px solid #000; text-transform: uppercase; margin-left: 4px; }

  .verdict-card {
    background: #FFF;
    border: 4px solid #000;
    padding: 28px;
    box-shadow: 8px 8px 0 0 #000;
  }
  .verdict-card h3 {
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 1.6rem;
    text-transform: uppercase;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 4px solid #FF6B35;
  }
  .verdict-card ul { list-style: none; }
  .verdict-card ul li { padding: 8px 0 8px 20px; position: relative; border-bottom: 1px dashed #DDD; }
  .verdict-card ul li:last-child { border-bottom: none; }
  .verdict-card ul li::before { content: '▸ '; position: absolute; left: 0; color: #FF6B35; font-weight: bold; }
  .verdict-card .score { font-size: 0.75rem; font-weight: bold; text-transform: uppercase; padding: 1px 8px; border: 2px solid #000; display: inline-block; }
  .score-om { background: #004E98; color: #FFF; }
  .score-vu { background: #E8505B; color: #FFF; }

  .badge {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: bold;
    text-transform: uppercase;
    padding: 2px 10px;
    border: 2px solid #000;
  }
  .badge-license { background: #004E98; color: #FFF; }
  .badge-stars { background: #FFD166; color: #1A1A1A; }
  .badge-pipe { background: #3A7D44; color: #FFF; }
  .badge-tool { background: #E8505B; color: #FFF; }
  .badge-open { background: #3A7D44; color: #FFF; }

  .footer {
    background: #1A1A1A;
    color: #FFF;
    text-align: center;
    padding: 32px;
    font-size: 0.8rem;
    border-top: 6px solid #FF6B35;
  }
  .footer a { color: #FFD166; }
  .footer .stats { display: flex; justify-content: center; gap: 40px; margin-bottom: 16px; flex-wrap: wrap; }
  .footer .stats div { text-align: center; }
  .footer .stats .num { font-family: Impact, 'Arial Black', sans-serif; font-size: 1.6rem; color: #FF6B35; }
  .footer .stats .label { font-size: 0.7rem; text-transform: uppercase; opacity: 0.6; }

  @media (max-width: 768px) {
    .header { padding: 40px 20px; }
    .header h1 { font-size: 2.2rem; }
    .container { padding: 0 20px; }
    .card-grid { grid-template-columns: 1fr; }
    .card-wide { grid-column: span 1; }
    .two-col, .three-col { grid-template-columns: 1fr; }
    .section-title { font-size: 1.8rem; }
    .comp-table { font-size: 0.8rem; }
    .comp-table th, .comp-table td { padding: 8px 10px; }
  }

  
    ⚡ OpenMontage VS video-use
    Agentic Video Production Systems — Deep Comparative Analysis
    
      📅 2026-07-17
      📚 15+ sources analyzed
      🔄 3 iterative deepening passes
      ⏱ Comprehensive
    
  

  
    
      ⚡ Executive Summary
      
        OpenMontage (39.5k ★) is a full-agentic video production studio — 12 pipelines, 52 tools, 400+ skills. It generates videos from scratch (explainers, trailers, documentaries) via an LLM orches
