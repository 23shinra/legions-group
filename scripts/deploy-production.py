#!/usr/bin/env python3
"""Build production assets, pack deploy.zip, upload to Plesk via FTP."""

from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_PRODUCTION = ROOT / ".env.production"
PACK = ROOT / "scripts" / "pack-deploy-zip.py"
FTP = ROOT / "scripts" / "ftp-upload-laravel.py"


def parse_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, raw = line.partition("=")
        value = raw.strip().strip('"').strip("'")
        value = re.sub(r"\$\{([^}]+)\}", lambda m: values.get(m.group(1), m.group(0)), value)
        values[key.strip()] = value
    return values


def run(cmd: list[str], env: dict[str, str] | None = None) -> None:
    print("+", " ".join(cmd), flush=True)
    subprocess.run(cmd, cwd=ROOT, env=env, check=True, shell=os.name == "nt")


def build_frontend(production_env: dict[str, str]) -> None:
    vite_keys = (
        "VITE_APP_NAME",
        "VITE_REVERB_APP_KEY",
        "VITE_REVERB_HOST",
        "VITE_REVERB_PORT",
        "VITE_REVERB_SCHEME",
    )
    env = os.environ.copy()
    for key in vite_keys:
        if key in production_env:
            env[key] = production_env[key]
    run(["npm", "run", "build"], env=env)


def main() -> int:
    if not ENV_PRODUCTION.exists():
        print(f"Missing {ENV_PRODUCTION}", file=sys.stderr)
        return 1

    production_env = parse_env(ENV_PRODUCTION)
    required = ("VITE_REVERB_APP_KEY", "VITE_REVERB_HOST", "BROADCAST_CONNECTION")
    missing = [key for key in required if production_env.get(key) in (None, "")]
    if missing:
        print(f".env.production missing: {', '.join(missing)}", file=sys.stderr)
        return 1

    if production_env.get("BROADCAST_CONNECTION") != "reverb":
        print("Warning: BROADCAST_CONNECTION is not reverb", file=sys.stderr)

    build_frontend(production_env)
    run([sys.executable, str(PACK)])

    if os.environ.get("FTP_PASS"):
        return subprocess.call([sys.executable, str(FTP)], cwd=ROOT)

    print("\nDeploy zip ready: deploy.zip")
    print("Upload: set FTP_PASS and run this script again, or upload deploy.zip manually.")
    print("On server after extract: enable nginx /app proxy + Supervisor reverb:start")
    print("See scripts/reverb-plesk.example.conf")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
