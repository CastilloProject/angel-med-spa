$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host 'Instala Node.js 20 o superior y vuelve a ejecutar este archivo.' -ForegroundColor Red
  exit 1
}
if ([string]::IsNullOrWhiteSpace($env:ADMIN_PASSWORD)) {
  $secure = Read-Host 'Crea una contrasena de administrador (minimo 12 caracteres)' -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $env:ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
if ($env:ADMIN_PASSWORD.Length -lt 12) { throw 'La contrasena debe tener al menos 12 caracteres.' }
Write-Host 'Abre http://localhost:3000/ o http://localhost:3000/admin' -ForegroundColor Green
node server.js
