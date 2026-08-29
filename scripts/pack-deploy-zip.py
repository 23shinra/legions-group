#!/usr/bin/env python3
"""Build deploy.zip for Plesk (Laravel without node_modules/.git)."""

import os
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "deploy.zip"
SKIP_DIRS = {
    ".git",
    ".cursor",
    ".claude",
    ".agents",
    ".codex",
    ".idea",
    ".vscode",
    "node_modules",
    "tests",
    "terminals",
}
SKIP_NAMES = {
    "deploy.zip",
    ".env",
    ".env.example",
    ".env.production",
    "phpver.php",
    "probe.php",
    "index.html",
    ".php-version",
    ".node-version",
    ".deploy-root.htaccess",
    "phpunit.xml",
    "package.json",
    "package-lock.json",
    "unzip-deploy.php",
}


def skip_dir(name: str) -> bool:
    return name in SKIP_DIRS


def main() -> None:
    if OUT.exists():
        OUT.unlink()
    count = 0
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        env = ROOT / ".env.production"
        ht = ROOT / ".deploy-root.htaccess"
        if env.exists():
            zf.write(env, ".env")
        if ht.exists():
            zf.write(ht, ".htaccess")
        prod_packages = ROOT / "scripts" / "production-packages.php"
        if prod_packages.exists():
            zf.write(prod_packages, "bootstrap/cache/packages.php")
        for root, dirs, files in os.walk(ROOT):
            dirs[:] = [d for d in dirs if not skip_dir(d)]
            for name in files:
                if name in SKIP_NAMES or name.startswith(".deploy-tmp"):
                    continue
                if name.endswith((".log", ".sqlite-journal", ".sqlite")):
                    continue
                path = Path(root) / name
                rel = path.relative_to(ROOT).as_posix()
                if rel in {
                    "bootstrap/cache/packages.php",
                    "bootstrap/cache/services.php",
                    "bootstrap/cache/config.php",
                    "bootstrap/cache/events.php",
                    "bootstrap/cache/routes-v7.php",
                    "bootstrap/cache/routes.php",
                }:
                    continue
                zf.write(path, rel)
                count += 1
    print(f"wrote {OUT} files={count} size_mb={OUT.stat().st_size / 1024 / 1024:.1f}")


if __name__ == "__main__":
    main()
