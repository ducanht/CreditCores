# PowerShell Script Dong Bo Song Song 2 Du An Google Apps Script
# CreditCores - QTDND Yen Tho

$SCRIPT_1 = "1-S-5ukEamyQeA3c6x5UrZLnWySPgqLhg4nawy21-AHZ5vjYdz8n3Ky2W"
$SCRIPT_2 = "1NI0PAQ56mfyrEALtn_MtaJ2EBwD0lS3TUOyHSOD72eiG8lEh9LlY_1vp"
$DEPLOYMENT_ID = "AKfycbxLQHAgdH2cus1zX_z28b31qixMWqq5K0fgIsdy4QFD6xsjRlUyRrwmRyKU28jljAc2"

Write-Host "=== [1/3] Push code to Script 1 ($SCRIPT_1) ===" -ForegroundColor Cyan
Set-Content -Path ".clasp.json" -Value "{`"scriptId`": `"$SCRIPT_1`", `"rootDir`": `"gas_backend`"}" -Encoding UTF8
npx @google/clasp push -f

Write-Host "=== [2/3] Push code to Script 2 ($SCRIPT_2) ===" -ForegroundColor Cyan
Set-Content -Path ".clasp.json" -Value "{`"scriptId`": `"$SCRIPT_2`", `"rootDir`": `"gas_backend`"}" -Encoding UTF8
npx @google/clasp push -f

Write-Host "=== [3/3] Deploy live Web App on Script 2 ===" -ForegroundColor Cyan
npx @google/clasp deploy -i $DEPLOYMENT_ID -d "CreditCores Auto-Deploy Dashboard v1.3.2"

Write-Host "=== Set primary script back to Script 2 ===" -ForegroundColor Green
Set-Content -Path ".clasp.json" -Value "{`"scriptId`": `"$SCRIPT_2`", `"rootDir`": `"gas_backend`"}" -Encoding UTF8

Write-Host "DONE: Successfully synced both Google Apps Script projects!" -ForegroundColor Green
