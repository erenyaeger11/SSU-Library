$ErrorActionPreference = 'Stop'

$email = Read-Host 'Email address for the existing admin account'
if ($email -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') {
    throw 'Enter a valid email address.'
}

$securePassword = Read-Host 'Choose a new password (at least 12 characters)' -AsSecureString
$password = [System.Net.NetworkCredential]::new('', $securePassword).Password
if ($password.Length -lt 12) {
    $password = $null
    $securePassword = $null
    throw 'The new password must be at least 12 characters.'
}

$php = 'C:\xampp\php\php.exe'
if (-not (Test-Path -LiteralPath $php)) {
    $phpCommand = Get-Command php -ErrorAction SilentlyContinue
    if (-not $phpCommand) {
        $password = $null
        $securePassword = $null
        throw 'PHP was not found. Install PHP or update the PHP path in this script.'
    }
    $php = $phpCommand.Source
}

$env:LIBRARY_ADMIN_EMAIL = $email
$env:LIBRARY_ADMIN_PASSWORD = $password
$password = $null
$securePassword = $null
try {
    & $php (Join-Path $PSScriptRoot 'reset_admin_password.php')
    if ($LASTEXITCODE -ne 0) {
        throw 'Password reset failed. Review the PHP error above and confirm MySQL is running.'
    }
} finally {
    Remove-Item Env:LIBRARY_ADMIN_EMAIL, Env:LIBRARY_ADMIN_PASSWORD -ErrorAction SilentlyContinue
}
