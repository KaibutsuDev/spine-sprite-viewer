# 👾 AetherSpine Viewer

**AetherSpine Viewer** es una herramienta web interactiva diseñada para desarrolladores de videojuegos y animadores que necesitan previsualizar de forma rápida y sencilla sus modelos y animaciones creados en **Esoteric Software Spine**.

### 🚀 Características principales

- **Carga local rápida:** Simplemente arrastra o selecciona los archivos de tu modelo (`.atlas`, `.json`/`.skel` y las texturas `.png`).
- **Compatibilidad multi-versión:** Cambia de forma dinámica la versión del motor de renderizado (compatible con runtimes Spine **3.6, 4.0, 4.1, 4.2 y 4.3**).
- **Control de reproducción:** Explora la lista de animaciones y skins disponibles en el esqueleto.
- **Entornos de prueba personalizados:** Cambia entre fondos interactivos (cuadrícula, plano técnico, espacio, modo estudio) o sube tu propia imagen de fondo.
- **Construido con tecnología moderna:** Desarrollado con **React 19**, **Vite** y **CSS personalizado**.

---

## 🛠️ Comenzando

Sigue estos pasos para ejecutar el proyecto en tu entorno local.

### Prerrequisitos

Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior recomendada). Este proyecto utiliza `pnpm` como gestor de paquetes.

### Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/KaibutsuDev/spine-sprite-viewer.git
   cd spine-sprite-viewer
   ```

2. Instala las dependencias:
   ```bash
   pnpm install
   ```
   _(También puedes usar `npm install` o `yarn install` si lo prefieres)_

### Desarrollo

Para iniciar el servidor de desarrollo local con recarga rápida (HMR):

```bash
pnpm dev
```

Abre tu navegador en [http://localhost:5173](http://localhost:5173) para ver la aplicación en funcionamiento.

### Construcción para Producción

Para compilar el proyecto optimizado para producción:

```bash
pnpm build
```

Los archivos listos para desplegar se generarán en la carpeta `/dist`.

