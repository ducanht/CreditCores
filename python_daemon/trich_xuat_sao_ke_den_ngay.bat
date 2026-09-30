@echo off
chcp 65001 > nul
title CREDITCORES - TRÍCH XUẤT SAO KÊ HĐTD ĐẾN NGÀY (HDTD_CORE_DN)
echo =========================================================================
echo    CREDITCORES - TRÍCH XUẤT SAO KÊ HĐTD ĐẾN NGÀY (HDTD_CORE_DN)
echo =========================================================================
echo.
set /p AS_OF_DATE="Nhập ngày sao kê (định dạng dd/MM/yyyy hoặc nhấn Enter để lấy hôm nay): "
cd /d "%~dp0"
if "%AS_OF_DATE%"=="" (
    echo [*] Đang trích xuất sao kê đến ngày hôm nay...
    python sync_daemon.py --extract-dn
) else (
    echo [*] Đang trích xuất sao kê đến ngày %AS_OF_DATE%...
    python sync_daemon.py --extract-dn --as-of-date %AS_OF_DATE%
)
echo.
echo [*] Hoàn tất trích xuất HDTD_CORE_DN!
pause
