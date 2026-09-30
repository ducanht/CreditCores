@echo off
chcp 65001 > nul
title CREDITCORES - TRÍCH XUẤT SAO KÊ HĐTD CÁC NGÀY CUỐI THÁNG (HDTD_CORE_ALL)
echo =========================================================================
echo    CREDITCORES - TRÍCH XUẤT SAO KÊ HĐTD CÁC NGÀY CUỐI THÁNG (HDTD_CORE_ALL)
echo =========================================================================
echo.
echo [*] Đang thực hiện trích xuất sao kê các ngày cuối tháng trong năm...
echo.
cd /d "%~dp0"
python sync_daemon.py --extract-all
echo.
echo [*] Hoàn tất trích xuất HDTD_CORE_ALL!
pause
