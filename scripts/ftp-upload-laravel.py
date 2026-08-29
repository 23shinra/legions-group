#!/usr/bin/env python3
"""Upload Laravel app to Plesk additional domain /legionis-group.asia."""

from __future__ import annotations

import ftplib
import os
import sys
import time
from pathlib import Path

HOST = os.environ.get("FTP_HOST", "185.98.5.120")
USER = os.environ.get("FTP_USER", "nur_stroy_kz")
PASSWORD = os.environ.get("FTP_PASS", "")
REMOTE_ROOT = os.environ.get("FTP_REMOTE_ROOT", "/legionis-group.asia")
LOCAL_DIR = Path(os.environ.get("FTP_LOCAL_DIR", Path(__file__).resolve().parent.parent))

SKIP_DIR_NAMES = {
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
# Local composer discover includes require-dev (Boost). Never upload those caches.
SKIP_RELATIVE_FILES = {
    "bootstrap/cache/packages.php",
    "bootstrap/cache/services.php",
    "bootstrap/cache/config.php",
    "bootstrap/cache/events.php",
    "bootstrap/cache/routes-v7.php",
    "bootstrap/cache/routes.php",
}
SKIP_FILE_PREFIXES = (".deploy-tmp",)
SKIP_FILE_NAMES = {
    ".env",
    ".env.example",
    ".env.production",
    ".gitignore",
    "phpunit.xml",
    "package.json",
    "package-lock.json",
    ".node-version",
    "phpver.php",
    "probe.php",
    "index.html",
    "unzip-deploy.php",
    ".php-version",
    ".deploy-root.htaccess",
}
SKIP_SUFFIXES = {".sqlite-journal", ".sqlite", ".log"}
ALWAYS = {".env", ".htaccess", "artisan", "manifest.json", "sw.js", "site.webmanifest"}


def should_skip(rel: Path) -> bool:
    parts = set(rel.parts)
    if parts & SKIP_DIR_NAMES:
        return True
    if rel.as_posix() in SKIP_RELATIVE_FILES:
        return True
    name = rel.name
    if name in SKIP_FILE_NAMES:
        return True
    if name.startswith(SKIP_FILE_PREFIXES):
        return True
    if rel.suffix in SKIP_SUFFIXES:
        return True
    if name.startswith("Homestead"):
        return True
    return False


def ftp_connect() -> ftplib.FTP:
    ftp = ftplib.FTP()
    ftp.connect(HOST, 21, timeout=60)
    ftp.login(USER, PASSWORD)
    ftp.set_pasv(True)
    ftp.encoding = "utf-8"
    if ftp.sock:
        ftp.sock.settimeout(90)
    return ftp


def ensure_dir(ftp: ftplib.FTP, remote: str) -> None:
    parts = [p for p in remote.strip("/").split("/") if p]
    path = ""
    for part in parts:
        path += "/" + part
        try:
            ftp.mkd(path)
        except ftplib.error_perm:
            pass


def remote_size(ftp: ftplib.FTP, path: str) -> int | None:
    try:
        return ftp.size(path)
    except Exception:
        return None


def upload_file(ftp: ftplib.FTP, local: Path, remote: str, retries: int = 4) -> str:
    want = local.stat().st_size
    have = remote_size(ftp, remote)
    if have == want and local.name not in ALWAYS:
        return "skip"
    parent = remote.rsplit("/", 1)[0]
    if parent:
        ensure_dir(ftp, parent)
    last_err: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            with local.open("rb") as fh:
                ftp.storbinary(f"STOR {remote}", fh)
            return "up"
        except Exception as exc:
            last_err = exc
            time.sleep(min(2 * attempt, 8))
            try:
                ftp.close()
            except Exception:
                pass
            ftp = ftp_connect()
            globals()["_ftp"] = ftp
    raise RuntimeError(f"upload failed {remote}: {last_err}")


def iter_files() -> list[Path]:
    files: list[Path] = []
    for root, dirs, names in os.walk(LOCAL_DIR):
        dirs[:] = [d for d in dirs if d not in SKIP_DIR_NAMES]
        for name in names:
            files.append(Path(root) / name)
    return files


def main() -> int:
    if not PASSWORD:
        print("FTP_PASS is required", file=sys.stderr)
        return 1

    ftp = ftp_connect()
    globals()["_ftp"] = ftp
    print(f"LOCAL {LOCAL_DIR}")
    print(f"REMOTE {REMOTE_ROOT}")

    try:
        ftp.delete(f"{REMOTE_ROOT}/index.html")
        print("removed placeholder index.html")
    except Exception:
        pass

    env_src = LOCAL_DIR / ".env.production"
    ht_src = LOCAL_DIR / ".deploy-root.htaccess"
    specials = [
        (env_src, f"{REMOTE_ROOT}/.env"),
        (ht_src, f"{REMOTE_ROOT}/.htaccess"),
    ]
    for src, dest in specials:
        if src.exists():
            ftp = globals()["_ftp"]
            status = upload_file(ftp, src, dest)
            print(f"{status:4} {dest}")

    print("scanning files...")
    files = iter_files()
    total = len(files)
    print(f"found {total} files after pruning skip dirs")
    uploaded = skipped = 0
    for i, path in enumerate(files, 1):
        rel = path.relative_to(LOCAL_DIR)
        if should_skip(rel):
            continue
        remote = f"{REMOTE_ROOT}/{rel.as_posix()}"
        ftp = globals()["_ftp"]
        try:
            status = upload_file(ftp, path, remote)
        except Exception as exc:
            print(f"ERR  {remote}: {exc}")
            return 1
        if status == "up":
            uploaded += 1
        else:
            skipped += 1
        if i % 50 == 0 or uploaded in {1, 5, 20} or skipped in {50, 200}:
            print(f"... {i}/{total} up={uploaded} skip={skipped} last={rel.as_posix()}", flush=True)

    print(f"DONE up={uploaded} skip={skipped}")
    try:
        globals()["_ftp"].quit()
    except Exception:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
