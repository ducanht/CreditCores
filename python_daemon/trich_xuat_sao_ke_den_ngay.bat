@echo off
chcp 65001 >nul
title CREDITCORES - TRICH XUAT SAO KE HDTD DEN NGAY (HDTD_CORE_DN)
echo =========================================================================
echo    CREDITCORES - TRICH XUAT SAO KE HDTD DEN NGAY (HDTD_CORE_DN)
echo =========================================================================
echo.
set /p AS_OF_DATE="Nhap ngay sao ke (dinh dang dd/MM/yyyy hoac nhan Enter de lay hom nay): "
cd /d "%~dp0"
if "%AS_OF_DATE%"=="" (
    echo - Dang trich xuat sao ke den ngay hom nay...
    python sync_daemon.py --extract-dn
) else (
    echo - Dang trich xuat sao ke den ngay %AS_OF_DATE%...
    python sync_daemon.py --extract-dn --as-of-date %AS_OF_DATE%
)
echo.
echo - Hoan tat trich xuat HDTD_CORE_DN!
pause
