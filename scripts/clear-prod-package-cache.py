#!/usr/bin/env python3
"""Delete production composer package caches that reference require-dev providers."""

from __future__ import annotations

import ftplib
import os

HOST = os.environ.get("FTP_HOST", "185.98.5.120")
USER = os.environ.get("FTP_USER", "nur_stroy_kz")
PASSWORD = os.environ.get("FTP_PASS", "")
ROOT = os.environ.get("FTP_REMOTE_ROOT", "/legionis-group.asia")

TARGETS = (
    f"{ROOT}/bootstrap/cache/packages.php",
    f"{ROOT}/bootstrap/cache/services.php",
    f"{ROOT}/bootstrap/cache/config.php",
    f"{ROOT}/bootstrap/cache/events.php",
    f"{ROOT}/bootstrap/cache/routes-v7.php",
    f"{ROOT}/bootstrap/cache/routes.php",
)


def main() -> int:
    if not PASSWORD:
        print("FTP_PASS is required")
        return 1
    ftp = ftplib.FTP()
    ftp.connect(HOST, 21, timeout=30)
    ftp.login(USER, PASSWORD)
    ftp.set_pasv(True)
    for path in TARGETS:
        try:
            ftp.delete(path)
            print("deleted", path)
        except Exception as exc:
            print("skip", path, type(exc).__name__)
    ftp.quit()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
