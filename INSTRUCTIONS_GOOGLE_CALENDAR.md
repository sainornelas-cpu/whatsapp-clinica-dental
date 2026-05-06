# Instrucciones para Configurar Google Calendar API - OAuth 2.0

## IMPORTANTE - CAMBIO DE ENFOQUE

**¡ATENCIÓN!** Hemos cambiado a **OAuth 2.0** porque la opción de Service Account no funciona correctamente.

**Diferencias:**
- ✅ Más flexible y seguro
- ✅ El dentista autoriza la app directamente (sin configurar cuentas de servicio)
- ⚠️ Requiere que el dentista agregue la app como editor del calendario
- ⚠️ Requiere crear endpoint de callback para manejar la autorización

---

## Pasos en Google Cloud Console (Tú, como desarrollador)

### 1. Crear Proyecto
1. Ir a: https://console.cloud.google.com/
2. Haz clic en "Create Project"
3. Nombre: `WhatsApp Dental Bot`
4. Haz clic en "Create"

---

### 2. Habilitar Google Calendar API
1. En el proyecto recién creado, ve a: APIs & Services → Library
2. Busca: `Google Calendar API`
3. Haz clic en el botón "Enable"
4. Espera a que diga "API enabled"

---

### 3. Crear Aplicación OAuth 2.0
1. Ve a: APIs & Services → Credentials
2. Haz clic en el botón superior: "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Tipo: "Web application"
4. Nombre: `WhatsApp Dental Bot OAuth`
5. Authorized JavaScript origins: `https://whatsapp-clinica-dental.vercel.app`
6. Authorized redirect URIs: Agrega **DOS** URIs:
   - `https://whatsapp-clinica-dental.vercel.app/auth/google/callback` (para producción)
   - `http://localhost:3000/auth/google/callback` (para desarrollo)
7. Application type: "Public"
8. Haz clic en "Create"

---

### 4. Obtener OAuth Client ID y Secret
1. En la pantalla de credenciales de la app OAuth:
2. Copia estos valores:
   - **OAuth 2.0 Client ID**: `client_id_del_oauth.apps.googleusercontent.com`
   - **OAuth 2.0 Client Secret**: `client_secret_del_oauth.apps.googleusercontent.com`

---

### 5. Autorizar la Aplicación (EL DENTISTA debe hacerlo)

**PASOS DEL DENTISTA:**

1. Copia el siguiente enlace y ábrelo en el navegador:
```
https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/calendar%20https://www.googleapis.com/auth/calendar.events&access_type=offline&prompt=consent&response_type=code&client_id=COLOCA_AQUI_EL_CLIENT_ID&redirect_uri=https://whatsapp-clinica-dental.vercel.app/auth/google/callback
```

**IMPORTANTE:** Reemplaza `COLOCA_AQUI_EL_CLIENT_ID` con el Client ID que copiaste en el paso 4

2. Inicia sesión con la cuenta de Gmail que usarás para las citas (ej: `sain.ornelas@uabc.edu.mx`)

3. Haz clic en "Permitir" o "Allow"

4. Se generará un código de autorización

5. **COPIA EL CÓDIGO y PÁSAMELO** para configurarlo

---

## Configurar Variables de Entorno

### En Vercel:

1. Ve a: https://vercel.com/dashboard
2. Abre el proyecto: `whatsapp-clinica-dental`
3. Ve a: Settings → Environment Variables
4. Agrega:

```bash
# Google Calendar OAuth 2.0
GOOGLE_OAUTH_CLIENT_ID=coloca_aqui_el_client_id
GOOGLE_OAUTH_CLIENT_SECRET=coloca_aqui_el_client_secret
GOOGLE_CALENDAR_ID=sain.ornelas@uabc.edu.mx
GOOGLE_OAUTH_REDIRECT_URI=https://whatsapp-clinica-dental.vercel.app/auth/google/callback
GOOGLE_REFRESH_TOKEN=
```

### En Local (para pruebas):

Actualiza `.env.local`:

```bash
# Google Calendar OAuth 2.0
GOOGLE_OAUTH_CLIENT_ID=coloca_aqui_el_client_id
GOOGLE_OAUTH_CLIENT_SECRET=coloca_aqui_el_client_secret
GOOGLE_CALENDAR_ID=sain.ornelas@uabc.edu.mx
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_REFRESH_TOKEN=
```

---

## Flujo de Trabajo

### 1. Configuración inicial (Tú, como desarrollador)
   - Crear proyecto en Google Cloud Console
   - Habilitar Calendar API
   - Crear app OAuth 2.0
   - Obtener Client ID y Secret
   - Configurar variables en Vercel

### 2. Autorización (EL DENTISTA)
   - El dentista abre el enlace de autorización
   - Inicia sesión con su cuenta de Gmail
   - Permite el acceso a la app
   - Te da el código de autorización
   - Configuras el código en el sistema

### 3. Funcionamiento
   - El bot crea eventos automáticamente en el calendario del dentista
   - El dentista puede ver/editar las citas en Google Calendar
   - Cancelación y reagendamiento funcionan automáticamente

---

## Troubleshooting

### Si el dentista no puede ver las citas:

**Causa posible**: El calendario no está compartido con la app OAuth

**Solución**: El dentista debe agregar la app como editor:

1. Ve a: https://calendar.google.com
2. Ve a: ⚙️ Configuración → Configuración y uso (Settings and sharing)
3. En "Compartir con personas específicas":
   - Agrega: `la_app_client_id_del_oauth.apps.googleusercontent.com`
   - Permiso: "Puede ver y editar eventos" (Make changes to events)
   - Haz clic en "Enviar" y luego "Compartir"

### Si obtienes error "Unauthorized":

**Causa posible**: La app OAuth no tiene el Client ID correcto o no está autorizada

**Solución**:
1. Verifica que el Client ID sea correcto en Vercel
2. Verifica que el redirect URI coincida
3. Verifica que la app esté habilitada

---

## Checklist de Completado

- [ ] Proyecto creado en Google Cloud Console
- [ ] Google Calendar API habilitada
- [ ] App OAuth 2.0 creada
- [ ] Client ID y Secret obtenidos
- [ ] Variables configuradas en Vercel
- [ ] `.env.local` actualizado
- [ ] El dentista abrió el enlace de autorización
- [ ] Código de autorización configurado en el sistema
- [ ] Calendario compartido con la app OAuth
- [ ] Bot probado con el dentista autorizado
- [ ] Citas visibles en el calendario del dentista

---

## Recursos

- [Google Calendar API Docs](https://developers.google.com/workspace/calendar/api/guides/overview)
- [OAuth 2.0 Guide](https://developers.google.com/workspace/calendar/api/guides/authorize)
- [Node.js Quickstart](https://developers.google.com/workspace/calendar/api/quickstart/nodejs)
