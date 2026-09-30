@echo off
chcp 65001 >nul
title CREDITCORES - KIEM TRA KET NOI GOOGLE SHEETS & SQL SERVER
echo =========================================================================
echo    CREDITCORES - KIEM TRA KET NOI HE THONG (QTDND YEN THO)
echo =========================================================================
echo.
cd /d "%~dp0"
python sync_daemon.py --test-connection
echo.
pause
