#!/usr/bin/env pwsh
# Script: git_push.ps1
# Purpose: Stage, commit and push all CreditCores changes

Set-Location "D:\Antigravity Projects\CreditCores"

Write-Host "=== GIT ADD ===" -ForegroundColor Cyan
git add .

Write-Host "`n=== GIT STATUS ===" -ForegroundColor Cyan
git status --short

Write-Host "`n=== GIT COMMIT ===" -ForegroundColor Cyan
$msg = @"
feat: Dashboard charts, DebitManager, CreditStatement & GAS backend updates

- feat(dashboard): Them CommuneComparisonChart, LoanProductDonutChart, MonthlyDebtTrendChart, Top50DebtSection, SecurityTypeBreakdown
- feat(debit): Them DebitReconciliationView (doi soat), DebitWarningView (canh bao no ton dong)
- feat(credit): Them CreditStatement.jsx (sao ke tin dung)
- feat(gas): Cap nhat DashboardController, ReportController, HeaderUtils va bundle All-in-One
- feat(daemon): Cap nhat sync_daemon.py dong bo SQL Server
- docs: Them thu muc docs/dacta
- tools: Them bundle_gas.py
"@
git commit -m $msg

Write-Host "`n=== GIT PUSH ===" -ForegroundColor Cyan
git push origin main

Write-Host "`n=== DONE ===" -ForegroundColor Green
