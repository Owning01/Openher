#!/usr/bin/env python3
"""Mandar un mensaje corto a otro agente de esta máquina.
Uso:
  python3 scripts/team-send.py <sesion> "<tu-nombre>" "<texto>" [queue|steer]
Ejemplo:
  python3 scripts/team-send.py ses_abc123... "agente-flutter" "ya terminé la pantalla X"
Le llega a su inbox y en su chat se ve de otro color con tu nombre.
"""
import json
import os
import sys
import time
import urllib.request

if len(sys.argv) < 4:
    print(__doc__)
    sys.exit(2)
to_session, name, text = sys.argv[1], sys.argv[2].strip(), sys.argv[3]
delivery = sys.argv[4] if len(sys.argv) > 4 else "queue"
if delivery not in ("queue", "steer"):
    print("delivery: queue|steer")
    sys.exit(2)
if not to_session or not name or not text.strip():
    print("sesion, nombre y texto requeridos")
    sys.exit(2)
body = json.dumps({"toSession": to_session, "text": text[:8000], "from": name[:80], "delivery": delivery}).encode()
req = urllib.request.Request(
    "http://127.0.0.1:4848/shell/team/send", data=body, headers={"Content-Type": "application/json"}, method="POST"
)
MAX_LOG_BYTES = 48000  # < limite de /shell/fs/read (65536): el panel lee el archivo entero


def _append_log(to_session, name, text):
    """Bitacora del relevo (la lee el panel Equipo de OpenHer). Best-effort.

    El panel lee el archivo por /shell/fs/read, que corta en 65536 bytes DESDE
    EL INICIO: si el log crece mas, el feed se congela en los mensajes viejos.
    Por eso se recorta a las ultimas lineas cuando supera MAX_LOG_BYTES.
    """
    try:
        team = os.path.join(os.path.expanduser("~"), ".local", "share", "opencode", "team")
        os.makedirs(team, exist_ok=True)
        path = os.path.join(team, "messages.jsonl")
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps({"ts": int(time.time() * 1000), "from": name[:80], "to": to_session, "text": text[:8000]}, ensure_ascii=False) + "\n")
        if os.path.getsize(path) > MAX_LOG_BYTES:
            with open(path, encoding="utf-8") as f:
                lines = f.read().splitlines()
            keep, total = [], 0
            for line in reversed(lines):
                total += len(line.encode("utf-8")) + 1
                keep.append(line)
                if total > MAX_LOG_BYTES:
                    break
            keep.reverse()
            with open(path, "w", encoding="utf-8") as f:
                f.write("\n".join(keep) + "\n")
    except Exception:
        pass


try:
    with urllib.request.urlopen(req, timeout=40) as r:
        status = r.status
        print(status, r.read().decode()[:200])
    if 200 <= status < 300:
        _append_log(to_session, name, text)
except Exception as e:
    print("FALLO:", str(e)[:200])
    sys.exit(1)
