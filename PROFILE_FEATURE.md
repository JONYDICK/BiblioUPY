# Página de Perfil de Usuario - BiblioUPY

## ✅ Implementación Completada

Los estudiantes ahora pueden tener una página de perfil completa donde pueden:
- 🖼️ Subir y editar su foto de perfil (avatar)
- 🎨 Subir y editar su banner (imagen de portada)
- ✍️ Agregar una descripción personal (bio)
- 🎓 Registrar su matrícula/ID de estudiante
- 🏫 Indicar su carrera/especialidad

## Acceso

### Imagen de Perfil
1. Ir a Header (esquina superior derecha)
2. Hacer click en tu nombre con el ícono de usuario
3. Se abrirá tu página de perfil en `/profile`

### URL Directa
- `https://yoursite.com/profile` - Tu perfil (autenticado)

## Funcionalidades

### Ver Perfil
- Información personal completa
- Avatar y banner
- Bio/descripción
- Carrera y matrícula (si están completados)
- Estado de seguridad (MFA)

### Editar Perfil
1. Click en botón "Editar perfil"
2. Realizar cambios en los campos
3. Para cambiar foto o banner:
   - Click en el ícono de cámara sobre la imagen
   - Seleccionar archivo
   - La imagen se sube AUTOMÁTICAMENTE a AWS S3
   - Preview se muestra antes de guardar
4. Click "Guardar cambios"
5. Se actualiza todo en la base de datos

## Detalles Técnicos

### Campos Editables
| Campo | Obligatorio | Max Length | Tipo |
|-------|-----------|----------|------|
| Nombre | Sí | 100 | Texto |
| Apellido | Sí | 100 | Texto |
| Bio/Descripción | No | 500 | Textarea |
| Matrícula/ID | No | 20 | Texto |
| Carrera | No | 100 | Texto |
| Avatar | No | - | Imagen |
| Banner | No | - | Imagen |

### Tipos de Imagen Soportados
- ✅ JPEG / JPG
- ✅ PNG
- ✅ GIF
- ✅ WebP

### Límites
- Tamaño máximo: 100 MB por archivo
- Las imágenes se suben directamente a AWS S3
- URLs se guardan en la base de datos

## Endpoints de la API

### Ver Perfil Actual
**GET** `/api/auth/me`
```bash
curl -X GET https://yoursite.com/api/auth/me \
  -H "Content-Type: application/json" \
  --cookie "connect.sid=SESSION_ID"
```

**Respuesta:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "firstName": "Juan",
  "lastName": "Pérez",
  "bio": "Descripción del usuario",
  "avatarUrl": "https://s3.amazonaws.com/.../avatar.jpg",
  "bannerUrl": "https://s3.amazonaws.com/.../banner.jpg",
  "studentId": "123456",
  "career": "Ingeniería en Sistemas",
  "mfaEnabled": true,
  "roles": ["student"],
  "permissions": [...]
}
```

### Actualizar Perfil
**PATCH** `/api/users/me`
```bash
curl -X PATCH https://yoursite.com/api/users/me \
  -H "Content-Type: application/json" \
  --cookie "connect.sid=SESSION_ID" \
  -d '{
    "firstName": "Juan",
    "lastName": "Pérez",
    "bio": "Mi descripción",
    "studentId": "123456",
    "career": "Ingeniería",
    "avatarUrl": "https://s3.amazonaws.com/.../avatar.jpg",
    "bannerUrl": "https://s3.amazonaws.com/.../banner.jpg"
  }'
```

**Respuesta:**
```json
{
  "message": "Perfil actualizado exitosamente",
  "user": {
    "id": 1,
    "email": "user@example.com",
    ...
  }
}
```

## Flujo de Subida de Imagen a AWS S3

### Proceso Automático (desde la UI)
1. Usuario hace click en ícono de cámara
2. Selecciona archivo de su computadora
3. Frontend genera URL de presigned firmada
4. Frontend sube DIRECTAMENTE a AWS S3 (sin pasar por servidor)
5. S3 retorna URL pública
6. Frontend muestra preview de la imagen
7. Usuario hace click "Guardar cambios"
8. URL de S3 se guarda en la base de datos

### Ventajas
- ✅ Uploads rápidos (directo a S3)
- ✅ Servidor no se sobrecarga
- ✅ Sin limitaciones de bandwidth del servidor
- ✅ Imágenes servidas desde CDN de AWS
- ✅ URLs públicas permanentes

## Seguridad

✅ **Autenticación requerida** - Solo usuarios loggeados pueden editar su perfil
✅ **Validación de URLs** - Solo URLs válidas en campos de imagen
✅ **Presigned URLs** - Expiran en 15 minutos
✅ **CORS configurado** - Solo requests legítimos llegan a S3
✅ **Auditoría** - Todos los cambios se registran (audit logs)
✅ **Sanitización** - Bio y texto se desinfectan

## Estructura de la Página

```
┌─────────────────────────────────────────┐
│     Banner Image (editable)             │
│                                         │
│      ┌─────────┐                        │
│      │ Avatar  │    Nombre Apellido    │
│      │ (click) │    @username          │
│      └─────────┘    [Editar perfil]    │
└─────────────────────────────────────────┘

┌─ Card: Información de Perfil ─────────┐
│                                       │
│  En modo lectura:                     │
│  • Email                              │
│  • Descripción (bio)                  │
│  • Matrícula                          │
│  • Carrera                            │
│                                       │
│  En modo edición:                     │
│  • [Campos de texto editables]        │
│  • [Botón Guardar cambios]            │
│                                       │
└───────────────────────────────────────┘

┌─ Card: Seguridad ─────────────────────┐
│                                       │
│  Autenticación MFA: ✅ Activo         │
│                                       │
└───────────────────────────────────────┘
```

## Testing Manual

### 1. Acceder a Perfil
```
1. Login con usuario
2. Click en nombre (Header)
3. Verificar que estás en /profile
4. Todos los datos cargados correctamente
```

### 2. Ver Información
```
1. Verificar que todos los campos se muestran
2. Avatar y banner cargan correctamente
3. Bio, matrícula, carrera visibles
```

### 3. Editar Nombre
```
1. Click "Editar perfil"
2. Cambiar nombre/apellido
3. Click "Guardar cambios"
4. Verificar en BD:
   SELECT firstName, lastName FROM users WHERE id = X;
```

### 4. Subir Avatar
```
1. Click "Editar perfil"
2. Click ícono de cámara en avatar
3. Seleccionar imagen
4. Verificar preview
5. Click "Guardar cambios"
6. Acceder a AWS S3 bucket y verificar archivo
7. Verificar en BD que avatar_url tiene la URL correcta
```

### 5. Subir Banner
```
1. Repetir proceso del avatar pero con banner
2. Verificar que se sube a S3
3. Verificar BD tiene banner_url
```

### 6. Editar Bio
```
1. Click "Editar perfil"
2. Escribir descripción (max 500 caracteres)
3. Contador muestra caracteres
4. Click "Guardar cambios"
5. Verificar en BD que bio se actualizó
```

## Verificación de Base de Datos

```sql
-- Ver perfil completo del usuario
SELECT
  id, email, first_name, last_name, bio,
  avatar_url, banner_url, student_id, career
FROM users
WHERE id = 1;

-- Ver los cambios de perfil en audit logs
SELECT * FROM audit_logs
WHERE action = 'profile_update'
ORDER BY created_at DESC;
```

## Integración con AWS S3

Los archivos se guardan en tu bucket AWS configurado:
- Bucket: `biblioupy-files` (configurable en .env)
- Región: `us-east-1` (configurable en .env)
- Ruta: Presigned URLs determinan la estructura

### Variables de Entorno Necesarias
```
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=biblioupy-files
```

## Características Futuras Posibles

- 📷 Crop/resize de imágenes antes de subir
- 🎨 Filtros/efectos de imagen
- 👥 Ver perfil de otros usuarios (read-only)
- 📊 Estadísticas del perfil (recursos, descargas, etc.)
- 🔗 Links sociales en perfil
- 🏆 Badges/insignias de logros

## Troubleshooting

### "Error subiendo imagen"
- Verificar tipo de archivo (debe ser imagen)
- Verificar tamaño (< 100 MB)
- Verificar credenciales AWS en .env
- Verificar CORS en S3 bucket

### "La imagen no se muestra después de guardar"
- Esperar 5-10 segundos (S3 puede tener delay)
- Limpiar cache del navegador
- Verificar que la URL de S3 es pública

### "Bio no se guardó"
- Verificar no superar 500 caracteres
- Revisar la consola para errores
- Intentar de nuevo

## Contacto/Soporte
Para reportar bugs o sugerencias, contacta al equipo de desarrollo.
