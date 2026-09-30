@echo off
chcp 65001 > nul
title CREDITCORES - CHẨN ĐOÁN KẾT NỐI GOOGLE SHEETS VÀ SQL SERVER
echo =========================================================================
echo    CREDITCORES - KIỂM TRA KẾT NỐI HỆ THỐNG
echo =========================================================================
echo.
cd /d "%~dp0"
python sync_daemon.py --test-connection
echo.
pause
