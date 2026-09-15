#!/usr/bin/env python3
"""Mandar un mensaje corto a otro agente de esta máquina.
Uso:
  python3 scripts/team-send.py <sesion> "<tu-nombre>" "<texto>" [queue|steer]
Ejemplo:
  python3 scripts/team-send.py ses_abc123... "agente-flutter" "ya terminé la pantalla X"
Le llega a su inbox y en su chat se ve de otro color con tu nombre.
"""
import json
import sys
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
try:
    with urllib.request.urlopen(req, timeout=40) as r:
        print(r.status, r.read().decode()[:200])
except Exception as e:
    print("FALLO:", str(e)[:200])
    sys.exit(1)
