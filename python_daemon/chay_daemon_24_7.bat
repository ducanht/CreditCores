@echo off
chcp 65001 > nul
title CREDITCORES - DAEMON ĐỒNG BỘ SQL SERVER TỰ ĐỘNG 24/7 (QTDND YÊN THỌ)
echo =========================================================================
echo    CREDITCORES - DAEMON ĐỒNG BỘ SQL SERVER TỰ ĐỘNG (QTDND YÊN THỌ)
echo =========================================================================
echo.
echo [*] Đang khởi động Daemon lắng nghe WebApp và tự động đồng bộ định kỳ...
echo [*] Để dừng, nhấn Ctrl + C
echo.
cd /d "%~dp0"
python sync_daemon.py
pause
