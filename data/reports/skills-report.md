---
id: skills-report
title: "Inventario de Skills — Reporte Completo"
date: 2026-07-18
category: Inventario
tags: [skills, opencode, inventario, plugins, reporte]
---

Inventario de Skills — Reporte Completo

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    font-family: 'Courier New', Courier, monospace;
    background: #FFF8F0;
    color: #1A1A1A;
    display: flex;
    line-height: 1.6;
  }

  .sidebar {
    width: 280px;
    min-width: 280px;
    background: #1A1A1A;
    color: #FFF;
    display: flex;
    flex-direction: column;
    border-right: 4px solid #FF6B35;
  }
  .sidebar-header {
    padding: 28px 20px 20px;
    border-bottom: 3px solid #FF6B35;
  }
  .sidebar-header h1 {
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 1.8rem;
    text-transform: uppercase;
    letter-spacing: -1px;
    line-height: 1;
    margin-bottom: 8px;
  }
  .sidebar-header .sub {
    font-size: 0.7rem;
    color: #FFD166;
  }
  .sidebar-nav { flex: 1; overflow-y: auto; padding: 8px 0; }
  .sidebar-nav::-webkit-scrollbar { width: 4px; }
  .sidebar-nav::-webkit-scrollbar-track { background: #222; }
  .sidebar-nav::-webkit-scrollbar-thumb { background: #FF6B35; }

  .cat-btn, .guide-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 12px 20px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #aaa;
    transition: all 0.15s;
    border: none;
    background: none;
    font-family: inherit;
    text-align: left;
    border-left: 3px solid transparent;
  }
  .cat-btn:hover, .guide-btn:hover { background: #2a2a2a; color: #fff; }
  .cat-btn .count {
    font-size: 0.6rem;
    background: #333;
    padding: 1px 8px;
    color: #999;
  }
  .cat-btn.active {
    background: #FF6B35;
    color: #fff;
    border-left-color: #FFD166;
  }
  .cat-btn.active .count { background: rgba(0,0,0,0.3); color: #FFD166; }

  .guide-btn {
    padding: 6px 20px 6px 32px;
    font-size: 0.68rem;
    color: #FFD166;
    border-left-color: transparent;
    font-weight: normal;
    text-transform: none;
    letter-spacing: 0.3px;
  }
  .guide-btn:hover { color: #fff; background: #2a2a2a; border-left-color: #FFD166; }
  .guide-btn.active { color: #fff; background: #333; border-left-color: #FF6B35; font-weight: bold; }

  .main {
    flex: 1;
    padding: 40px 48px;
    overflow-y: auto;
    background: #FFF8F0;
  }
  .main::-webkit-scrollbar { width: 6px; }
  .main::-webkit-scrollbar-track { background: #f0e8e0; }
  .main::-webkit-scrollbar-thumb { background: #ccc; }

  .empty-state {
    display: flex; align-items: center; justify-content: center;
    height: 60vh; color: #ccc; font-size: 1rem; flex-direction: column; gap: 12px;
  }
  .empty-state .big { font-size: 4rem; font-family: Impact, 'Arial Black', sans-serif; color: #ddd; }

  .cat-view { display: none; }
  .cat-view.open { display: block; animation: fadeIn 0.25s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .cat-view .cat-title {
    font-family: Impact, 'Arial Black', sans-serif;
    font-size: 2.4rem;
    text-transform: uppercase;
    letter-spacing: -1px;
    margin-bottom: 8px;
    padding-bottom: 12px;
    border-bottom: 6px solid #FF6B35;
  }
  .cat-view .cat-title .count {
    font-size: 1rem;
    background: #1A1A1A;
    color: #FFF;
    padding: 2px 12px;
    margin-left: 12px;
    vertical-align: middle;
  }

  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 28px;
  }
  .tab-btn {
    padding: 8px 20px;
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    font-weight: bold;
    text-transform: uppercase;
    cursor: pointer;
    border: 3px solid #000;
    background: #fff;
    color: #888;
    transition: all 0.12s;
  }
  .tab-btn:hover { background: #f0f0f0; }
  .tab-btn.active {
    background: #1A1A1A;
    color: #FFD166;
    box-shadow: 3px 3px 0 0 #000;
  }

  .tab-content { display: none; }
  .tab-content.open { display: block; }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
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
  .card-wide { grid-column: 1 / -1; }
  .card h3 {
    font-size: 1rem;
    font-weight: bold;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .card .loc-badge {
    display: inline-block;
    font-size: 0.65rem;
    font-weight: bold;
    text-transform: uppercase;
    padding: 2px 8px;
    border: 2px solid #000;
    margin-bottom: 10px;
  }
  .loc-agents { background: #004E98; color: #FFF; }
  .loc-claude { background: #3A7D44; color: #FFF; }
  .loc-opencode { background: #E8505B; color: #FFF; }
  .card .desc { font-size: 0.82rem; margin-bottom: 8px; color: #444; }
  .card .when { font-size: 0.78rem; color: #888; margin-bottom: 8px; }
  .card .detail { font-size: 0.75rem; color: #555; margin-top: 4px; }
  .card .key-cmd {
    background: #1A1A1A;
    color: #FFD166;
    font-size: 0.7rem;
    padding: 6px 10px;
    margin-top: 8px;
    border-left: 4px solid #FF6B35;
  }

  /* Guide styles */
  .guide {
    max-width: 900px;
  }
  .guide h3 {
    font-size: 1.3rem;
    text-transform: uppercase;
    margin: 28px 0 12px;
    padding-bottom: 6px;
    border-bottom: 3px solid #FF6B35;
  }
  .guide h4 {
    font-size: 0.95rem;
    text-transform: uppercase;
    margin: 20px 0 8px;
    color: #333;
  }
  .guide p, .guide li {
    font-size: 0.85rem;
    color: #444;
    line-height: 1.7;
  }
  .guide ul { list-style: none; padding-left: 0; }
  .guide li {
    padding: 6px 0 6px 20px;
    border-left: 3px solid #ddd;
    margin-bottom: 4px;
    padding-left: 16px;
  }
  .guide li strong { color: #1a1a1a; }
  .guide .step-num {
    display: inline-block;
    background: #FF6B35;
    color: #fff;
    font-weight: bold;
    font-size: 0.7rem;
    padding: 1px 8px;
    margin-right: 8px;
  }
  .guide .flow-arrow {
    text-align: center;
    font-size: 1.2rem;
    color: #FF6B35;
    padding: 4px 0;
    font-weight: bold;
  }
  .guide .tip {
    background: #FFF0E0;
    border-left: 4px solid #FF6B35;
    padding: 12px 16px;
    margin: 16px 0;
    font-size: 0.82rem;
  }
  .guide .tip strong { color: #1a1a1a; }

  @media (max-width: 768px) {
    body { flex-direction: column; }
    .sidebar { width: 100%; min-width: 0; max-height: 40vh; border-right: none; border-bottom: 4px solid #FF6B35; }
    .main { padding: 24px 20px; }
    .cat-view .cat-title { font-size: 1.6rem; }
    .card-grid { grid-template-columns: 1fr; }
  }

  
    SKILLS
    53 skills · 7 categorías
  
  

  
    ☰
    Seleccioná una categoría del panel izquierdo
  
  

const cats = [
  {
    id: "video", label: "🎬 Producción de Video", count: 19,
    cards: `
      config/opencodehyperframes — Router de EntradaPunto de entrada para TODAS las solicitudes de video, animación y motion graphics. Enruta al workflow especializado. Renderiza video desde HTML, composiciones deterministas seekeables.Comenzar aquí para cualquier solicitud de video.Rutas: /product-launch-video, /faceless-explainer, /embedded-captions, /motion-graphics, /general-video
      config/opencodehyperframes-coreContrato técnico de composición: atributos data-*, clips, pistas, sub-composiciones, variables, determinismo, validación.Leer ANTES de escribir HTML de composición.data-duration, data-start, class="clip", GSAP timeline pausada
      config/opencodehyperframes-animationReglas atómicas, blueprints multi-fase, transiciones, 7 adaptadores runtime (GSAP, Lottie, Three.js, Anime.js, CSS, WAAPI, TypeGPU).Cualquier tarea de animación.rules-index.md, blueprints-index.md, adapters/
      config/opencodehyperframes-cliCLI: init, add, capture, lint, validate, inspect, pr
