#!/bin/bash

# Script to generate self-signed SSL certificates for local development

CERT_DIR="./certs"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"

# Create certs directory if it doesn't exist
mkdir -p $CERT_DIR

# Generate self-signed certificate
echo "Generating self-signed SSL certificate..."
openssl req -x509 -newkey rsa:4096 -keyout $KEY_FILE -out $CERT_FILE -days 365 -nodes \
  -subj "/C=IL/ST=Israel/L=TelAviv/O=Development/OU=Development/CN=localhost"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSL certificates generated successfully!"
    echo ""
    echo "Certificate: $CERT_FILE"
    echo "Private Key: $KEY_FILE"
    echo ""
    echo "⚠️  These certificates are for LOCAL DEVELOPMENT ONLY!"
    echo "   Your browser will show a security warning - this is expected."
    echo "   For production, use certificates from a trusted CA (e.g., Let's Encrypt)."
    echo ""
    echo "To start the server with HTTPS, set USE_HTTPS=true in your .env file"
else
    echo ""
    echo "❌ Failed to generate certificates."
    echo "   Make sure OpenSSL is installed on your system."
    echo ""
    echo "   On Windows (with Git Bash or WSL):"
    echo "   - OpenSSL should be available in Git Bash"
    echo "   - Or install via: choco install openssl"
    echo ""
    echo "   On macOS:"
    echo "   - brew install openssl"
    echo ""
    echo "   On Ubuntu/Debian:"
    echo "   - sudo apt-get install openssl"
fi
