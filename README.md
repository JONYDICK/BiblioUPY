# BiblioUPY 📚

Una plataforma fullstack moderna para gestión y visualización de recursos bibliográficos. Construida con **Express**, **React**, **PostgreSQL** y **TypeScript**.

## 🎯 Características

- 🔐 **Autenticación segura** con Passport.js y MFA (TOTP)
- 📄 **Visor de PDFs** integrado con soporte para búsqueda
- 🚀 **Upload de archivos** con almacenamiento en S3
- 💬 **Sistema de foros** para discusiones
- 🎨 **UI moderna** con Tailwind CSS y Radix UI
- 📊 **Panel de administración** con estadísticas
- 🛡️ **Seguridad avanzada** (helmet, rate limiting, sanitización)

## 🏗️ Estructura del Proyecto

```
BiblioUPY/
├── backend/                 # API Express + PostgreSQL
│   ├── src/
│   │   ├── index.ts         # Punto de entrada del servidor
│   │   ├── routes.ts        # Definición de rutas
│   │   ├── auth.ts          # Autenticación
│   │   ├── db.ts            # Conexión a BD
│   │   ├── s3.ts            # Integración AWS S3
│   │   └── middleware/      # Middleware (rate limit, seguridad)
│   ├── migrations/          # Migraciones Drizzle ORM
│   └── script/              # Scripts de utilidad (seed, build)
├── frontend/                # Aplicación React + Vite
│   ├── src/
│   │   ├── pages/           # Páginas principales
│   │   ├── components/      # Componentes React
│   │   ├── hooks/           # Custom hooks
│   │   └── lib/             # Utilidades
│   ├── public/              # Activos estáticos
│   └── vite.config.ts       # Configuración Vite
├── shared/                  # Código compartido
│   ├── routes.ts            # Definiciones de rutas
│   └── schema.ts            # Schema Drizzle ORM
├── docs/                    # Documentación
└── certs/                   # Certificados HTTPS (desarrollo)
```

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js + Express 5.x
- **Base de datos**: PostgreSQL con Drizzle ORM
- **Autenticación**: Passport.js + Sessions
- **Almacenamiento**: AWS S3 con presigned URLs
- **Validación**: Zod schemas
- **Seguridad**: Helmet, express-rate-limit, bcryptjs
- **WebSockets**: ws para comunicación real-time

### Frontend
- **Framework**: React 18.3 + TypeScript
- **Bundler**: Vite 7.3
- **Styling**: Tailwind CSS 3.4 + PostCSS
- **UI**: Radix UI + shadcn/ui components
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form
- **Routing**: Wouter
- **PDF Viewer**: react-pdf
- **Charts**: Recharts
- **Animations**: Framer Motion

## 📋 Requisitos Previos

- **Node.js** >= 18.x
- **PostgreSQL** >= 12
- **npm** o **yarn**
- (Opcional) **AWS S3** para almacenamiento en producción

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/yourusername/BiblioUPY.git
cd BiblioUPY
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
# Copiar plantilla
cp .env.example .env

# Editar .env con tus valores reales
# - DATABASE_URL: conexión PostgreSQL
# - AWS_* (opcional, para upload S3)
# - SMTP_* (opcional, para emails)
```

### 4. Configurar base de datos

```bash
# Crear base de datos
createdb biblioupy

# Ejecutar migraciones
npm run db:push
```

### 5. (Opcional) Generar certificados HTTPS locales

```bash
npm run build:certs
```

## 🎮 Desarrollo

### Iniciar servidor de desarrollo

```bash
npm run dev
```

El proyecto estará disponible en:
- **Frontend**: https://localhost:5173 (con Vite)
- **Backend API**: https://localhost:5000
- **Base de datos**: PostgreSQL en localhost:5432

### Scripts disponibles

```bash
# Desarrollo
npm run dev              # Inicia backend + frontend dev server

# Base de datos
npm run db:push         # Sincroniza esquema con BD
npm run db:seed         # Siembra datos de ejemplo
npm run db:migrate      # Ejecuta migraciones pendientes

# Build & Producción
npm run build           # Compila backend + frontend
npm start               # Inicia en producción

# Utilidades
npm run build:certs     # Genera certificados SSL/TLS locales
npm run type-check      # Verifica tipos TypeScript
```

## 📚 Documentación

- [HTTPS-SETUP.md](./docs/HTTPS-SETUP.md) - Configuración de certificados locales
- [Backend](./backend/src/README.md) - Detalles de la API
- [Frontend](./frontend/src/README.md) - Estructura de componentes

## 🔒 Seguridad

- ✅ Variables de entorno sensibles en `.env` (excluidas de git)
- ✅ Contraseñas hasheadas con bcryptjs
- ✅ CSRF protection con express-session
- ✅ Rate limiting en endpoints críticos
- ✅ Sanitización de HTML con DOMPurify
- ✅ Headers de seguridad con Helmet
- ✅ HTTPS habilitado en desarrollo y producción

### Variables sensibles

Nunca commitees:
- `.env` con credenciales reales
- Certificados SSL privados
- Claves privadas SSH
- Tokens de acceso

Usa siempre `.env.example` como referencia.

## 🚀 Deployment

### Producción (Ejemplo: Railway, Heroku, Render)

```bash
# 1. Crear repositorio en GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/BiblioUPY.git
git push -u origin main

# 2. Configurar plataforma de hosting
# 3. Establecer variables de entorno en producción
# 4. Deploy automático desde GitHub
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios mayores:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](./LICENSE) para más detalles.

## 👥 Autores

- **BiblioUPY Contributors**

## 📞 Soporte

Para reportar bugs o sugerir features, abre un [Issue](https://github.com/yourusername/BiblioUPY/issues).
