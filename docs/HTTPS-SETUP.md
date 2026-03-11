# Configuración HTTPS/TLS

## Desarrollo Local (mkcert)

BiblioUPY usa certificados auto-firmados generados con `mkcert` para desarrollo local.

### Requisitos Previos
```bash
npm install -D mkcert
```

### Generar Certificados (primera vez)

```bash
# Desde la raíz del proyecto (c:\BiblioUPY)
npx mkcert create-ca
npx mkcert create-cert --domains localhost,127.0.0.1

# Mover certificados a la carpeta certs/
mkdir certs
move ca.key ca.crt cert.key cert.crt certs/
```

### Archivos Generados

```
certs/
├── ca.key        # Clave privada de la CA (NO compartir)
├── ca.crt        # Certificado de la CA
├── cert.key      # Clave privada del servidor
└── cert.crt      # Certificado del servidor
```

### Instalar CA en el Sistema (Opcional)

Para evitar advertencias del navegador, puedes instalar la CA raíz:

**Windows:**
1. Doble clic en `certs/ca.crt`
2. Clic en "Instalar certificado"
3. Selecciona "Máquina local" → "Siguiente"
4. Selecciona "Colocar todos los certificados en el siguiente almacén"
5. Examinar → "Entidades de certificación raíz de confianza"
6. Finalizar

**macOS:**
```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/ca.crt
```

**Linux (Ubuntu/Debian):**
```bash
sudo cp certs/ca.crt /usr/local/share/ca-certificates/mkcert-ca.crt
sudo update-ca-certificates
```

### Iniciar en Desarrollo

El servidor detecta automáticamente los certificados y usa HTTPS:

```bash
npm run dev
```

Accede a: **https://127.0.0.1:5000**

---

## Producción (Let's Encrypt)

Para producción, usa [Let's Encrypt](https://letsencrypt.org/) con Certbot.

### Instalación de Certbot

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install certbot
```

**CentOS/RHEL:**
```bash
sudo yum install certbot
```

### Obtener Certificados

```bash
# Detener el servidor temporalmente
sudo certbot certonly --standalone -d tu-dominio.com -d www.tu-dominio.com

# Los certificados se guardan en:
# /etc/letsencrypt/live/tu-dominio.com/
```

### Configuración del Servidor

Configura las variables de entorno en producción:

```bash
# .env (producción)
NODE_ENV=production
USE_HTTPS=true
SSL_KEY_PATH=/etc/letsencrypt/live/tu-dominio.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/tu-dominio.com/fullchain.pem
```

### Renovación Automática

Let's Encrypt requiere renovación cada 90 días:

```bash
# Añadir cron job para renovación automática
sudo crontab -e

# Añadir esta línea:
0 0 1 * * certbot renew --quiet && systemctl restart biblioupy
```

---

## Configuración con Nginx (Recomendado para Producción)

Para mayor rendimiento, usa Nginx como proxy inverso:

```nginx
server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name tu-dominio.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Solución de Problemas

### Error: "Certificados no encontrados"
- Verifica que los archivos `cert.key` y `cert.crt` existen en `certs/`
- Regenera los certificados si es necesario

### Error: "Certificate not trusted" en el navegador
- Instala el certificado CA raíz en tu sistema
- O haz clic en "Avanzado" → "Continuar hacia localhost (inseguro)"

### Errores de HMR (Hot Module Replacement)
- Asegúrate de acceder vía `https://` no `http://`
- Verifica que WebSocket esté usando WSS
