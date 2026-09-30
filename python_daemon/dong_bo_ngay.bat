@echo off
chcp 65001 >nul
title CREDITCORES - DONG BO DU LIEU TUC THI TU SQL CORE (KH_CORE & HDTD_CORE)
echo =========================================================================
echo    CREDITCORES - DONG BO DU LIEU TUC THI (KH_CORE & HDTD_CORE)
echo =========================================================================
echo.
echo - Dang thuc hien trich xuat du lieu tu NG-eFUND va day len Google Sheets...
echo.
cd /d "%~dp0"
python sync_daemon.py --now
echo.
echo - Hoan tat qua trinh dong bo!
pause
