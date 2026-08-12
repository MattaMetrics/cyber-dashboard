from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from pathlib import Path
import os

RESULTS_FILE = Path(__file__).parent / 'test_dashboard_export.json'

class YOLOServer(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/yolo/results/latest':
            if RESULTS_FILE.exists():
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(RESULTS_FILE.read_bytes())
            else:
                self.send_error(404, 'No results file')
        else:
            self.send_error(404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8001), YOLOServer)
    print('YOLO Results Server on http://localhost:8001')
    server.serve_forever()
