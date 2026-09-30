@echo off
chcp 65001 >nul
title CREDITCORES - DAEMON DONG BO SQL SERVER TU DONG 24/7 (QTDND YEN THO)
echo =========================================================================
echo    CREDITCORES - DAEMON DONG BO SQL SERVER TU DONG (QTDND YEN THO)
echo =========================================================================
echo.
echo - Dang khoi dong Daemon lang nghe WebApp va tu dong dong bo dinh ky...
echo - De dung tien trinh, nhan to hop phim Ctrl + C
echo.
cd /d "%~dp0"
python sync_daemon.py
pause
