# PowerShell script to generate self-signed SSL certificates for local development

$CERT_DIR = "./certs"
$CERT_FILE = "$CERT_DIR/cert.pem"
$KEY_FILE = "$CERT_DIR/key.pem"

# Create certs directory if it doesn't exist
if (-not (Test-Path $CERT_DIR)) {
    New-Item -ItemType Directory -Path $CERT_DIR -Force | Out-Null
}

Write-Host "Generating self-signed SSL certificate..." -ForegroundColor Yellow

# Check if OpenSSL is available
$openssl = Get-Command openssl -ErrorAction SilentlyContinue

if ($openssl) {
    # Use OpenSSL if available
    & openssl req -x509 -newkey rsa:4096 -keyout $KEY_FILE -out $CERT_FILE -days 365 -nodes `
        -subj "/C=IL/ST=Israel/L=TelAviv/O=Development/OU=Development/CN=localhost"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SSL certificates generated successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Certificate: $CERT_FILE"
        Write-Host "Private Key: $KEY_FILE"
        Write-Host ""
        Write-Host "These certificates are for LOCAL DEVELOPMENT ONLY!" -ForegroundColor Yellow
        Write-Host "Your browser will show a security warning - this is expected."
        Write-Host "For production, use certificates from a trusted CA (e.g., Let's Encrypt)."
        Write-Host ""
        Write-Host "To start the server with HTTPS, set USE_HTTPS=true in your .env file"
    }
} else {
    # Use PowerShell's built-in certificate generation
    Write-Host "OpenSSL not found, using PowerShell certificate generation..." -ForegroundColor Yellow
    
    try {
        $cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "Cert:\CurrentUser\My" `
            -NotAfter (Get-Date).AddDays(365) -KeyAlgorithm RSA -KeyLength 4096

        # Export certificate
        $certPath = "Cert:\CurrentUser\My\$($cert.Thumbprint)"
        
        # Export as PFX first, then convert
        $password = ConvertTo-SecureString -String "temp123" -Force -AsPlainText
        $pfxPath = "$CERT_DIR/temp.pfx"
        
        Export-PfxCertificate -Cert $certPath -FilePath $pfxPath -Password $password | Out-Null
        
        # Try to use OpenSSL from common locations to convert
        $opensslPaths = @(
            "C:\Program Files\Git\usr\bin\openssl.exe",
            "C:\Program Files\OpenSSL-Win64\bin\openssl.exe",
            "C:\OpenSSL-Win64\bin\openssl.exe"
        )
        
        $opensslFound = $false
        foreach ($path in $opensslPaths) {
            if (Test-Path $path) {
                & $path pkcs12 -in $pfxPath -out $KEY_FILE -nodes -nocerts -password pass:temp123
                & $path pkcs12 -in $pfxPath -out $CERT_FILE -nodes -nokeys -password pass:temp123
                $opensslFound = $true
                break
            }
        }
        
        if (-not $opensslFound) {
            Write-Host ""
            Write-Host "Certificate created but OpenSSL not found to export to PEM format." -ForegroundColor Red
            Write-Host "Please install OpenSSL or Git for Windows and run this script again."
            Write-Host ""
            Write-Host "Install options:" -ForegroundColor Yellow
            Write-Host "  - Git for Windows: https://git-scm.com/download/win"
            Write-Host "  - Chocolatey: choco install openssl"
            Write-Host "  - Scoop: scoop install openssl"
        } else {
            Remove-Item $pfxPath -Force -ErrorAction SilentlyContinue
            
            Write-Host ""
            Write-Host "SSL certificates generated successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Certificate: $CERT_FILE"
            Write-Host "Private Key: $KEY_FILE"
        }
        
        # Clean up certificate from store
        Remove-Item $certPath -Force -ErrorAction SilentlyContinue
        
    } catch {
        Write-Host ""
        Write-Host "Failed to generate certificates: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please install OpenSSL and try again."
    }
}
