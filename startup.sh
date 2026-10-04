#!/bin/sh
set -eu
cd /workspace
node scripts/preview.mjs stop || true

if [ ! -x /workspace/backend/.venv/bin/uvicorn ]; then
  python3 -m venv /workspace/backend/.venv
  /workspace/backend/.venv/bin/pip install -q -r /workspace/backend/requirements.txt
fi

if ! curl -sf -o /dev/null --max-time 1 http://127.0.0.1:8000/api/health; then
  /workspace/backend/.venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000 >>/tmp/fastapi-startup.log 2>&1 &
fi

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
