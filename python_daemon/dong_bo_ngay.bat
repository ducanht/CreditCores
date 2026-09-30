@echo off
chcp 65001 > nul
title CREDITCORES - ĐỒNG BỘ DỮ LIỆU TỨC THÌ TỪ SQL CORE (KH_CORE & HDTD_CORE)
echo =========================================================================
echo    CREDITCORES - ĐỒNG BỘ DỮ LIỆU TỨC THÌ (KH_CORE & HDTD_CORE)
echo =========================================================================
echo.
echo [*] Đang thực hiện trích xuất dữ liệu từ NG-eFUND và đẩy lên Google Sheets...
echo.
cd /d "%~dp0"
python sync_daemon.py --now
echo.
echo [*] Hoàn tất quá trình đồng bộ!
pause
