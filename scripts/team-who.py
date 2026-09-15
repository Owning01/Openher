#!/usr/bin/env python3
"""Quiénes están y qué hacen los agentes de esta máquina (solo lectura).
Uso:
  python3 scripts/team-who.py                 # sesiones recientes
  python3 scripts/team-who.py --actividad     # + último mensaje de cada una
  python3 scripts/team-who.py --anuncios      # + tablero de anuncios vigentes
Lee opencode.db y team/anuncios.jsonl. Nunca escribe nada.
"""
import json
import os
import sqlite3
import sys
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

DATA = os.path.join(os.path.expanduser("~"), ".local", "share", "opencode")
DB = os.path.join(DATA, "opencode.db")
ANUNCIOS = os.path.join(DATA, "team", "anuncios.jsonl")


def data_of(blob):
    try:
        d = json.loads(blob)
        return d if isinstance(d, dict) else {}
    except Exception:
        return {}


def main():
    args = set(sys.argv[1:])
    try:
        db = sqlite3.connect("file:%s?mode=ro" % DB.replace("\\", "/"), uri=True)
    except Exception as e:
        print("Sin DB (%s)" % e)
        return 1
    rows = db.execute(
        "select id,title,directory,time_updated,parent_id from session "
        "order by time_updated desc limit 15"
    ).fetchall()
    for sid, title, directory, upd, parent in rows:
        when = time.strftime("%d %H:%M", time.localtime((upd or 0) / 1000))
        print("%s | %s | %s | %s%s" % (sid, (title or "?")[:40], when, (directory or "")[-50:], " | hijo-de:" + parent[-8:] if parent else ""))
        if "--actividad" in args:
            p = db.execute(
                "select data from part where session_id=? and json_extract(data,'$.type')='text' "
                "order by time_created desc limit 1", (sid,)
            ).fetchone()
            if p:
                d = data_of(p[0])
                print("    ultimo: %s" % (str(d.get("text") or "")[:120].replace("\n", " ")))
    if "--anuncios" in args:
        print("--- anuncios vigentes ---")
        latest = {}
        try:
            with open(ANUNCIOS, encoding="utf-8") as f:
                for line in f:
                    try:
                        a = json.loads(line)
                    except Exception:
                        continue
                    if isinstance(a, dict) and a.get("nombre"):
                        latest[str(a["nombre"])] = a
        except FileNotFoundError:
            print("(vacío)")
            return 0
        now = int(time.time() * 1000)
        for nombre, a in latest.items():
            if now - int(a.get("ts") or 0) > 2 * 3600 * 1000:
                continue
            print("%s | %s | %s" % (nombre, a.get("estado", "?"), str(a.get("tarea", ""))[:100]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
