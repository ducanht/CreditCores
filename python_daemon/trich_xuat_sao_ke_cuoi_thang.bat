@echo off
chcp 65001 >nul
title CREDITCORES - TRICH XUAT SAO KE HDTD CAC NGAY CUOI THANG (HDTD_CORE_ALL)
echo =========================================================================
echo    CREDITCORES - TRICH XUAT SAO KE HDTD CUOI CAC THANG (HDTD_CORE_ALL)
echo =========================================================================
echo.
echo - Dang thuc hien trich xuat sao ke cac ngay cuoi thang tu NG-eFUND...
echo.
cd /d "%~dp0"
python sync_daemon.py --extract-all
echo.
echo - Hoan tat trich xuat HDTD_CORE_ALL!
pause
