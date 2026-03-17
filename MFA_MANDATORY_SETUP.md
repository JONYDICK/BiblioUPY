# MFA Obligatorio en Registro - BiblioUPY

## Descripción General

El sistema ahora requiere que **todos los nuevos usuarios confirmen MFA (Multi-Factor Authentication)** al momento del registro. Esto implementa buenas prácticas de seguridad donde MFA no es opcional sino requisito desde el inicio.

Los usuarios pueden usar cualquier app de autenticación compatible:
- ✅ Google Authenticator
- ✅ Authy
- ✅ Microsoft Authenticator
- ✅ 1Password
- ✅ Otras apps de TOTP

## Flujo de Registro con MFA

### Paso 1: Registro Inicial
**Endpoint:** `POST /api/auth/register`

```bash
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "username",
    "firstName": "Juan",
    "lastName": "Pérez",
    "password": "SecurePassword123",
    "confirmPassword": "SecurePassword123"
  }'
```

**Respuesta:**
```json
{
  "message": "Cuenta creada. Escanea el código QR con tu app de autenticación (Google Authenticator, Authy, etc.)",
  "user": {
    "id": 10,
    "email": "user@example.com",
    "username": "username"
  },
  "mfaQrCode": "data:image/png;base64,...",
  "mfaSecret": "JBSWY3DPEBLW64TMMQ======"
}
```

**Estado en BD:**
- `is_verified` = `false` (aún no confirmado)
- `mfa_enabled` = `false` (no habilitado hasta confirmación)
- `mfa_secret` = almacenado en sesión temporalmente

### Paso 2: Usuario Escanea Código QR
El usuario abre su app de autenticación (Google Authenticator, Authy, etc.) y escanea el código QR retornado en el paso 1.

El código QR contiene:
- Email del usuario
- Secret OTP de 32 caracteres
- Nombre de la aplicación: "BiblioUPY"

### Paso 3: Confirmación de MFA
**Endpoint:** `POST /api/auth/confirm-mfa`

El usuario introduce en el frontend el código de 6 dígitos que su app de autenticación genera:

```bash
curl -X POST https://yourdomain.com/api/auth/confirm-mfa \
  -H "Content-Type: application/json" \
  -b "connect.sid=SESSION_COOKIE" \
  -d '{
    "mfaToken": "123456"
  }'
```

**Respuesta Exitosa:**
```json
{
  "message": "¡MFA confirmado correctamente! Ya puedes iniciar sesión.",
  "user": {
    "id": 10,
    "email": "user@example.com",
    "username": "username"
  }
}
```

**Estado en BD después de confirmación:**
- `is_verified` = `true` ✅
- `mfa_enabled` = `true` ✅
- `mfa_secret` = almacenado permanentemente en BD

**Respuesta si Código es Inválido:**
```json
{
  "message": "Código OTP inválido. Intenta de nuevo."
}
```

### Paso 4: Login con MFA

Después de confirmar MFA, el usuario puede hacer login. **El código MFA ahora es requerido en cada login**:

**Endpoint:** `POST /api/auth/login`

```bash
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123",
    "mfaToken": "123456"
  }'
```

**Si intenta login sin MFA confirmado:**
```json
{
  "message": "Cuenta no verificada. Completa la configuración de MFA."
}
```

**Si intenta login sin código MFA (pero ya confirmó):**
```json
{
  "requiresMfa": true,
  "message": "Se requiere código MFA"
}
```

**Login exitoso:**
```json
{
  "message": "Sesión iniciada",
  "user": {
    "id": 10,
    "email": "user@example.com",
    "username": "username",
    "firstName": "Juan",
    "lastName": "Pérez",
    "avatarUrl": null,
    "mfaEnabled": true
  }
}
```

## Google OAuth + MFA

Los usuarios que se registran con Google OAuth también están sujetos a MFA obligatorio:

### Flujo OAuth con MFA:

1. Usuario hace clic en "Sign in with Google"
2. Se redirige a: `GET /api/auth/google`
3. Google autentica al usuario
4. Callback a: `GET /api/auth/google/callback`
5. Si es usuario nuevo:
   - Se crea cuenta con `is_verified = false`
   - Se genera MFA secret y QR
   - Se redirige a: `/?google_auth=mfa_required&userId=...&qrCode=...&secret=...`
   - El frontend muestra el QR para escanear
6. Usuario confirma MFA en: `POST /api/auth/confirm-mfa`
7. Si es usuario existente:
   - Se valida que MFA esté confirmado
   - Login automático
   - Se redirige a: `/?google_auth=success&userId=...`

## Cambios en la Base de Datos

Se agregó una nueva columna a la tabla `users`:

```sql
ALTER TABLE users ADD COLUMN google_id varchar(255);
```

Campos relacionados con MFA:
- `is_verified` (boolean) - Indica si el usuario confirmó su MFA setup
- `mfa_enabled` (boolean) - Indica si MFA está habilitado y activo
- `mfa_secret` (text) - Almacena el secret OTP para TOTP
- `google_id` (varchar) - Almacena el ID de Google para OAuth

## Endpoints Operacionales

### Registro
- **POST** `/api/auth/register` - Registro con generación automática de QR

### Confirmación MFA
- **POST** `/api/auth/confirm-mfa` - Confirmar código OTP del usuario

### Login
- **POST** `/api/auth/login` - Login con opción mfaToken si MFA está habilitado

### MFA Setup (Opcional después de login)
- **POST** `/api/auth/mfa/setup` - Generar nuevo secret MFA (requiere autenticación)
- **POST** `/api/auth/mfa/verify` - Verificar y habilitar nuevo secret
- **POST** `/api/auth/mfa/disable` - Deshabilitar MFA (requiere código actual)

### Google OAuth
- **GET** `/api/auth/google` - Iniciar flujo OAuth con Google
- **GET** `/api/auth/google/callback` - Callback después de autenticación

## Estados del Usuario

### 1. Nuevo Usuario - Esperando MFA
```sql
is_verified = false
mfa_enabled = false
mfa_secret = "BC4GCREBZ33VPOL4BZZX2A3WDQ4BCAIR"  -- En sesión temporalmente
```
- ❌ No puede hacer login
- ✅ Puede confirmar MFA

### 2. Usuario MFA Confirmado - Listo
```sql
is_verified = true
mfa_enabled = true
mfa_secret = "BC4GCREBZ33VPOL4BZZX2A3WDQ4BCAIR"
```
- ✅ Puede hacer login
- ⚠️ Requiere código MFA en cada login
- ✅ Puede cambiar/deshabilitar MFA (con código actual)

### 3. Usuario MFA Deshabilitado
```sql
is_verified = true
mfa_enabled = false
mfa_secret = NULL
```
- ✅ Puede hacer login
- ✅ Sin requerir código MFA
- ⚠️ Menos seguro

## Auditoría

Todas las acciones de MFA se registran en `audit_logs`:

```sql
SELECT * FROM audit_logs WHERE action IN ('register', 'mfa_confirmed', 'mfa_enabled', 'mfa_disabled', 'login');
```

Ejemplo:
```
id   | user_id | action          | entity_type | entity_id | ip_address    | user_agent          | created_at
-----|---------|-----------------|-------------|-----------|----------------|---------------------|------------------
100  | 10      | register        | user        | 10        | 192.168.1.100  | Mozilla/5.0...      | 2026-03-16 19:30
101  | 10      | mfa_confirmed   | user        | 10        | 192.168.1.100  | Mozilla/5.0...      | 2026-03-16 19:31
102  | 10      | login           | user        | 10        | 192.168.1.100  | Mozilla/5.0...      | 2026-03-16 19:32
```

## Archivos Modificados

1. **`backend/src/auth.ts`**
   - LocalStrategy: Validar `isVerified` antes de permitir login
   - Google OAuth: Crear usuarios nuevos con MFA requerido

2. **`backend/src/routes.ts`**
   - POST /api/auth/register: Generar QR automáticamente
   - POST /api/auth/confirm-mfa: Nuevo endpoint para confirmar MFA
   - POST /api/auth/login: Ya valida MFA
   - Google OAuth callback: Mostrar QR a usuarios nuevos

3. **`shared/schema.ts`**
   - Agregado campo: `googleId` en tabla users

4. **Base de Datos**
   - Agregada columna: `google_id` en tabla users

## Seguridad

✅ **Implementado:**
- TOTP (Time-based One-Time Password) - OTP válido solo 30 segundos
- Secret almacenado securely en la BD
- Validación de tokens en ambos lados (cliente y servidor)
- Rate limiting en registro y login
- Auditoría de todas las acciones
- Session-based token storage (temporalmente en sesión)

⚠️ **Considerar en futuro:**
- Backup codes para recuperación si pierden acceso a su app
- Configurar múltiples dispositivos MFA
- SMS como segundo factor (adicional)
- WebAuthn/FIDO2 como alternativa más segura

## Testing

### Verificar que MFA es obligatorio:
```bash
# 1. Registro - obtiene QR
curl -X POST https://127.0.0.1:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com",...}'

# 2. Intenta login sin confirmar MFA - falla
curl -X POST https://127.0.0.1:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"..."}'
# Respuesta: "Cuenta no verificada. Completa la configuración de MFA."

# 3. Confirma MFA con código OTP
curl -X POST https://127.0.0.1:3001/api/auth/confirm-mfa \
  -H "Content-Type: application/json" \
  -d '{"mfaToken":"123456"}'

# 4. Login después de confirmar - requiere código MFA
curl -X POST https://127.0.0.1:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"...","mfaToken":"654321"}'
# Respuesta: {"message":"Sesión iniciada","user":{...}}
```

## Preguntas Frecuentes

**P: ¿Qué pasa si el usuario pierde su dispositivo con la app de autenticación?**
A: Actualmente no hay opción de recuperación. Se considera una mejora futura (backup codes).

**P: ¿Puedo deshabilitar MFA?**
A: Sí, con el endpoint POST /api/auth/mfa/disable, pero requiere autenticación y el código MFA actual.

**P: ¿Google OAuth requiere MFA?**
A: Sí, ahora todos los usuarios nuevos de OAuth también deben confirmar MFA.

**P: ¿El código MFA es el mismo cada vez?**
A: No, es un TOTP. Cambia cada 30 segundos. El usuario ve un código diferente en su app constantemente.

**P: ¿Cuántos intentos fallidos permite para confirmar MFA?**
A: Sin límite de intentos (considerar agregarlo en futuro). Solo expira si se cierra la sesión.
