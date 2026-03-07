# SSL Certificates Directory

This directory is reserved for SSL/TLS certificates.

## Setup Instructions

### Option 1: Let's Encrypt (Recommended)

1. Install Certbot:
```bash
sudo apt install certbot
```

2. Generate certificates:
```bash
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

3. Copy certificates to this directory:
```bash
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/
```

### Option 2: Self-Signed Certificates (Development)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/selfsigned.key \
  -out ssl/selfsigned.crt
```

### Required Files

- `fullchain.pem` - Your SSL certificate chain
- `privkey.pem` - Your private key

Or for self-signed:
- `selfsigned.crt` - Self-signed certificate
- `selfsigned.key` - Private key

### Permissions

Ensure proper permissions:
```bash
chmod 600 ssl/*.pem
chmod 600 ssl/*.key
```
