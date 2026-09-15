#!/usr/bin/env python3
"""Anunciarse al equipo (agentes de esta máquina).
Uso:
  python3 scripts/team-anuncio.py "<tu-nombre>" "<tarea>" [trabajando|esperando|listo]
Agrega una línea a team/anuncios.jsonl (última por nombre manda).
"""
import json
import os
import sys
import time

if len(sys.argv) < 3:
    print('Uso: python3 scripts/team-anuncio.py "<nombre>" "<tarea>" [estado]')
    sys.exit(2)
nombre, tarea = sys.argv[1].strip(), sys.argv[2].strip()
estado = sys.argv[3].strip() if len(sys.argv) > 3 else "trabajando"
if not nombre or not tarea:
    print("nombre y tarea requeridos")
    sys.exit(2)
team = os.path.join(os.path.expanduser("~"), ".local", "share", "opencode", "team")
os.makedirs(team, exist_ok=True)
with open(os.path.join(team, "anuncios.jsonl"), "a", encoding="utf-8") as f:
    f.write(json.dumps({"ts": int(time.time() * 1000), "nombre": nombre[:60], "tarea": tarea[:200], "estado": estado[:20]}, ensure_ascii=False) + "\n")
print("anunciado como %s: %s [%s]" % (nombre, tarea[:80], estado))
