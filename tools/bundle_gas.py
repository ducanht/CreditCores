#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script ghép các module độc lập trong gas_backend/ thành CreditCores_GAS_ALL_IN_ONE.gs
Đảm bảo tính đồng bộ 100% giữa các module phân rã và file triển khai GAS.
"""

import os
import sys
from datetime import datetime

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GAS_DIR = os.path.join(ROOT_DIR, "gas_backend")
OUTPUT_FILE = os.path.join(GAS_DIR, "CreditCores_GAS_ALL_IN_ONE.gs")

MODULE_ORDER = [
    "Utils/DateUtils.gs",
    "Utils/HeaderUtils.gs",
    "Database/Cache.gs",
    "Database/SchemaSetup.gs",
    "Dashboard/DashboardController.gs",
    "Auth/AuthController.gs",
    "Auth/RoleController.gs",
    "Customer/Customer360Controller.gs",
    "Collateral/CollateralController.gs",
    "Appraisal/AppraisalController.gs",
    "Inspection/InspectionController.gs",
    "Debit/DebitController.gs",
    "Reconciliation/ReconciliationController.gs",
    "Debt/DebtWarningController.gs",
    "Reports/ReportController.gs",
    "Sync/SyncController.gs",
    "Modules/DocumentController.gs",
    "Modules/ConfigController.gs",
    "Modules/ModuleRegistryController.gs",
    "AutoGeneratGoogleSheets.gs",
    "Code.gs"
]

def bundle():
    now_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    header = f"""/**
 * ========================================================================================
 * CREDITCORES - ALL-IN-ONE GOOGLE APPS SCRIPT BACKEND ENGINE
 * Quỹ Tín Dụng Nhân Dân Yên Thọ (QTDND Yên Thọ)
 * 
 * @description Trọn bộ Backend Google Apps Script All-In-One:
 *              - Header-Name Based Mapping (chống lệch cột, an toàn khi thêm/bớt cột)
 *              - Tối ưu tra cứu O(1) Hash Map cho 5.175+ khách hàng & 549+ hợp đồng
 *              - Thẩm định, Trích nợ Auto-Debit, Kiểm tra vốn, In hợp đồng Mail Merge
 *              - Độc lập hoàn toàn, không nghẽn Timeout, Zero Mock Data
 * @updated     {now_str}
 * @version     3.3 Resilient Debt Statistics Engine (DuNo vs TienVay Strictly Separated)
 * ========================================================================================
 */

"""
    bundled_content = [header]

    for rel_path in MODULE_ORDER:
        file_path = os.path.join(GAS_DIR, rel_path.replace("/", os.sep))
        if not os.path.exists(file_path):
            print(f"⚠️ Cảnh báo: Không tìm thấy file {file_path}")
            continue

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        separator = f"\n\n// ==========================================\n// MODULE FILE: gas_backend/{rel_path}\n// ==========================================\n\n"
        bundled_content.append(separator)
        bundled_content.append(content.strip())

    final_content = "".join(bundled_content) + "\n"

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(final_content)

    print(f"✅ Đã đóng gói thành công {len(MODULE_ORDER)} module vào {OUTPUT_FILE} ({len(final_content)} bytes).")

if __name__ == "__main__":
    bundle()
