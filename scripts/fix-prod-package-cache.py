#!/usr/bin/env python3
"""Upload production-only package manifest and reset OPcache."""

from __future__ import annotations

import ftplib
import os
from io import BytesIO
from pathlib import Path

HOST = os.environ.get("FTP_HOST", "185.98.5.120")
USER = os.environ.get("FTP_USER", "nur_stroy_kz")
PASSWORD = os.environ.get("FTP_PASS", "")
ROOT = os.environ.get("FTP_REMOTE_ROOT", "/legionis-group.asia")
LOCAL = Path(__file__).resolve().parent


def main() -> int:
    if not PASSWORD:
        print("FTP_PASS is required")
        return 1

    ftp = ftplib.FTP()
    ftp.connect(HOST, 21, timeout=30)
    ftp.login(USER, PASSWORD)
    ftp.set_pasv(True)
    ftp.encoding = "utf-8"

    packages = LOCAL / "production-packages.php"
    with packages.open("rb") as fh:
        ftp.storbinary(f"STOR {ROOT}/bootstrap/cache/packages.php", fh)
    print("uploaded packages.php")

    gitignore = b"*\n!.gitignore\n"
    ftp.storbinary(f"STOR {ROOT}/bootstrap/cache/.gitignore", BytesIO(gitignore))

    reset = b"<?php\nif (function_exists('opcache_reset')) { opcache_reset(); echo 'opcache-reset-ok'; } else { echo 'opcache-missing'; }\n"
    ftp.storbinary(f"STOR {ROOT}/public/oc-reset.php", BytesIO(reset))
    print("uploaded oc-reset.php")

    for path in (
        f"{ROOT}/bootstrap/cache",
        f"{ROOT}/storage/logs",
        f"{ROOT}/storage/framework",
        f"{ROOT}/storage/framework/views",
        f"{ROOT}/storage/framework/cache",
        f"{ROOT}/storage/framework/sessions",
    ):
        try:
            print(ftp.sendcmd(f"SITE CHMOD 775 {path}"))
        except Exception as exc:
            print("chmod skip", path, type(exc).__name__, exc)

    ftp.quit()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
