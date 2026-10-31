#!/usr/bin/env python3
"""Receives the renders posted by helpers.js: POST /save?name=looks/cel.png with a base64 body -> <out>/looks/cel.png.

    python3 scripts/capture/receive.py 8732 /some/scratch/renders
"""
import base64, os, sys, re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

OUT = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.join(os.getcwd(), "renders")
os.makedirs(OUT, exist_ok=True)

class H(BaseHTTPRequestHandler):
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "content-type")

    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()

    def do_POST(self):
        q = parse_qs(urlparse(self.path).query)
        name = q.get("name", ["out.png"])[0]
        if not re.fullmatch(r"[A-Za-z0-9._/-]+", name) or ".." in name:
            self.send_response(400); self.cors(); self.end_headers(); return
        n = int(self.headers.get("content-length", "0"))
        body = self.rfile.read(n)
        data = base64.b64decode(body)
        path = os.path.join(OUT, name)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "wb") as f:
            f.write(data)
        self.send_response(200); self.cors(); self.end_headers(); self.wfile.write(b"ok")

    def log_message(self, *a):
        pass

ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1]) if len(sys.argv) > 1 else 8732), H).serve_forever()
