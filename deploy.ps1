# =============================================================================
# deploy.ps1 — CreditCores Full Auto-Deploy Pipeline
# QTDND Yên Thọ | Mỗi lần chạy sẽ:
#   [1] Bundle tất cả module → CreditCores_GAS_ALL_IN_ONE.gs
#   [2] clasp push -f → Script 1 (Sync) + Script 2 (Live WebApp)
#   [3] clasp deploy → Deploy mới nhất lên Script 2
#   [4] git add -A → git commit → git push origin main
#
# Usage:
#   .\deploy.ps1                         → Auto commit message
#   .\deploy.ps1 -msg "fix: something"  → Custom commit message
#   .\deploy.ps1 -gasOnly               → Chỉ deploy GAS, không push git
#   .\deploy.ps1 -gitOnly               → Chỉ push git, không deploy GAS
# =============================================================================
param(
    [string]$msg = "",
    [switch]$gasOnly,
    [switch]$gitOnly
)

$ErrorActionPreference = "Stop"
$SCRIPT_ID_1 = "1-S-5ukEamyQeA3c6x5UrZLnWySPgqLhg4nawy21-AHZ5vjYdz8n3Ky2W"  # Sync/Backup
$SCRIPT_ID_2 = "1NI0PAQ56mfyrEALtn_MtaJ2EBwD0lS3TUOyHSOD72eiG8lEh9LlY_1vp"  # Live WebApp
$DEPLOY_ID   = "AKfycbxLQHAgdH2cus1zX_z28b31qixMWqq5K0fgIsdy4QFD6xsjRlUyRrwmRyKU28jljAc2"
$CLASP_JSON  = ".clasp.json"
$ROOT        = $PSScriptRoot

function Write-Step($n, $total, $text) {
    Write-Host ""
    Write-Host "[$n/$total] $text" -ForegroundColor Cyan
    Write-Host ("-" * 60) -ForegroundColor DarkGray
}

function Write-OK($text) { Write-Host "  [OK] $text" -ForegroundColor Green }
function Write-Fail($text) { Write-Host "  [FAIL] $text" -ForegroundColor Red }
function Write-Info($text) { Write-Host "  [INFO] $text" -ForegroundColor Yellow }
$totalSteps = 5
if ($gasOnly -or $gitOnly) { $totalSteps = 3 }

# ===========================================================================
# STEP 1: Bundle tất cả module GAS → ALL_IN_ONE.gs
# ===========================================================================
if (-not $gitOnly) {
    Write-Step 1 $totalSteps "Bundle GAS modules → CreditCores_GAS_ALL_IN_ONE.gs"
    try {
        $bundleOut = python tools/bundle_gas.py 2>&1
        Write-Host $bundleOut
        Write-OK "Bundle GAS thành công"
    } catch {
        Write-Fail "Bundle GAS thất bại: $_"
        exit 1
    }

    # ===========================================================================
    # STEP 2: clasp push → Script 2 (Live WebApp) — primary
    # ===========================================================================
    Write-Step 2 $totalSteps "clasp push -f → Script 2 [Live WebApp] ($SCRIPT_ID_2)"
    Set-Content -Path $CLASP_JSON -Value "{`"scriptId`": `"$SCRIPT_ID_2`", `"rootDir`": `"gas_backend`"}" -Encoding UTF8
    try {
        $pushOut = npx -y @google/clasp push -f 2>&1
        Write-Host $pushOut
        Write-OK "Push lên Script 2 thành công"
    } catch {
        Write-Fail "Push Script 2 thất bại: $_"
        # Vẫn tiếp tục để push Script 1
    }

    # OPTIONAL: Push sang Script 1 (Sync/Backup)
    Write-Info "Push lên Script 1 [Sync/Backup] ($SCRIPT_ID_1) ..."
    Set-Content -Path $CLASP_JSON -Value "{`"scriptId`": `"$SCRIPT_ID_1`", `"rootDir`": `"gas_backend`"}" -Encoding UTF8
    try {
        npx -y @google/clasp push -f 2>&1 | Out-Null
        Write-OK "Push lên Script 1 thành công"
    } catch {
        Write-Fail "Push Script 1 thất bại (không critical): $_"
    }

    # Restore về Script 2 (primary)
    Set-Content -Path $CLASP_JSON -Value "{`"scriptId`": `"$SCRIPT_ID_2`", `"rootDir`": `"gas_backend`"}" -Encoding UTF8

    # ===========================================================================
    # STEP 3: clasp deploy → cập nhật deployment live
    # ===========================================================================
    Write-Step 3 $totalSteps "clasp deploy -i $DEPLOY_ID [cập nhật WebApp live]"
    try {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
        $deployOut = npx -y @google/clasp deploy -i $DEPLOY_ID -d "CreditCores Auto-Deploy $timestamp" 2>&1
        Write-Host $deployOut
        Write-OK "Deploy GAS WebApp thành công"
    } catch {
        Write-Fail "Deploy thất bại: $_"
        exit 1
    }
}

if ($gasOnly) {
    Write-Host ""
    Write-Host "=== GAS Deploy hoàn tất (--gasOnly) ===" -ForegroundColor Green
    exit 0
}

# ===========================================================================
# STEP 4: git add -A
# ===========================================================================
$gitStep = 4
if ($gitOnly) { $gitStep = 1 }
Write-Step $gitStep $totalSteps "git add -A — Stage tất cả thay đổi"
try {
    $gitStatus = git status --porcelain
    if (-not $gitStatus) {
        Write-Info "Không có thay đổi nào để commit. Bỏ qua git push."
        Write-Host ""
        Write-Host "=== Pipeline hoàn tất (nothing to commit) ===" -ForegroundColor Green
        exit 0
    }
    git add -A
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "git add thất bại"
        exit 1
    }
    Write-OK "Stage thành công $(($gitStatus -split "`n").Count) file(s)"
    Write-Host ""
    Write-Host $gitStatus -ForegroundColor DarkGray
} catch {
    Write-Fail "git add thất bại: $_"
    exit 1
}

# ===========================================================================
# STEP 5: git commit + push
# ===========================================================================
$pushStep = 5
if ($gitOnly) { $pushStep = 2 }
Write-Step $pushStep $totalSteps "git commit + push origin main"

# Tự động sinh commit message nếu không truyền vào
if (-not $msg) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $changedFiles = git diff --cached --name-only
    
    # Phân loại loại thay đổi
    $gasFiles  = $changedFiles | Where-Object { $_ -match "gas_backend/" }
    $srcFiles  = $changedFiles | Where-Object { $_ -match "src/" }
    $daemonFiles = $changedFiles | Where-Object { $_ -match "python_daemon/" }
    $docFiles  = $changedFiles | Where-Object { $_ -match "docs/" }

    $types = @()
    if ($gasFiles)    { $types += "gas" }
    if ($srcFiles)    { $types += "frontend" }
    if ($daemonFiles) { $types += "daemon" }
    if ($docFiles)    { $types += "docs" }

    $scope = ""
    if ($types.Count -gt 0) { $scope = "($($types -join ','))" }
    $msg = "feat$scope`: auto-deploy $timestamp"
}

git commit -m $msg
if ($LASTEXITCODE -ne 0) {
    Write-Fail "git commit thất bại"
    exit 1
}
Write-OK "Commit thành công: $msg"

git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Fail "git push thất bại"
    exit 1
}
Write-OK "Push lên remote origin/main thành công"

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Green
Write-Host "  🚀 DEPLOY PIPELINE HOÀN TẤT" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Green
Write-Host "  GAS WebApp : https://script.google.com/macros/s/$DEPLOY_ID/exec" -ForegroundColor White
Write-Host "  Git branch : main (origin)" -ForegroundColor White
Write-Host ("=" * 60) -ForegroundColor Green
