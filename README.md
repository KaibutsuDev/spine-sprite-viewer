# 👾 AetherSpine Viewer

**AetherSpine Viewer** es una herramienta web interactiva diseñada para desarrolladores de videojuegos y animadores que necesitan previsualizar de forma rápida y sencilla sus modelos y animaciones creados en **Esoteric Software Spine**.

[English Documentation](#english) | [Documentación en Español](#español)

---

<a name="español"></a>
## 🇪🇸 Español

### 🚀 Características principales

- **Carga local rápida:** Simplemente arrastra o selecciona los archivos de tu modelo (`.atlas`, `.json`/`.skel` y las texturas `.png`).
- **Compatibilidad multi-versión:** Cambia de forma dinámica la versión del motor de renderizado (compatible con runtimes Spine **3.6, 4.0, 4.1, 4.2 y 4.3**).
- **Barra de control dedicada:** Controla las animaciones del esqueleto, activa el bucle (loop) y alterna skins desde una barra de control limpia ubicada debajo del lienzo.
- **Relación de reproducción (Velocidad):** Modifica la velocidad de animación en tiempo real de `0.1x` a `3.0x`.
- **Entornos de prueba personalizados:** Cambia entre fondos interactivos (cuadrícula, plano técnico, espacio, modo estudio) o sube tu propia imagen de fondo.
- **Construido con tecnología moderna:** Desarrollado con **React 19**, **Vite**, **WebGL** y **CSS personalizado**.

### 🛠️ Comenzando

Sigue estos pasos para ejecutar el proyecto en tu entorno local.

#### Prerrequisitos

Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior recomendada). Este proyecto utiliza `pnpm` como gestor de paquetes.

#### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/KaibutsuDev/spine-sprite-viewer.git
   cd spine-sprite-viewer
   ```

2. Instala las dependencias:
   ```bash
   pnpm install
   ```

#### Desarrollo

Para iniciar el servidor de desarrollo local:
```bash
pnpm dev
```
Abre tu navegador en [http://localhost:5173](http://localhost:5173) para ver la aplicación en funcionamiento.

#### Construcción para Producción

Para compilar el proyecto optimizado para producción:
```bash
pnpm build
```
Los archivos listos para desplegar se generarán en la carpeta `/dist`.

---

<a name="english"></a>
## 🇺🇸 English

**AetherSpine Viewer** is an interactive web-based tool designed for game developers and animators to quickly and easily preview their models and animations exported from **Esoteric Software Spine**.

### 🚀 Key Features

- **Quick Local Upload:** Drag & drop or select your model assets (`.atlas`, `.json`/`.skel`, and `.png` textures).
- **Multi-Version Compatibility:** Dynamically switch the rendering engine runtime (supports Spine **3.6, 4.0, 4.1, 4.2, and 4.3**).
- **Dedicated Control Bar:** Control skeleton actions, toggle loop playback, and switch skins from a clean panel located right below the canvas viewport.
- **Playback Ratio (Speed):** Change the animation playback speed in real-time from `0.1x` to `3.0x`.
- **Custom Environments:** Toggle between interactive backgrounds (checkered grid, blueprint, space cosmic, studio mode) or upload your own custom background image.
- **Modern Tech Stack:** Developed with **React 19**, **Vite**, **WebGL**, and **Custom CSS**.

### 🛠️ Getting Started

Follow these steps to run the project in your local environment.

#### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed (version 18 or higher recommended). This project uses `pnpm` as the package manager.

#### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/KaibutsuDev/spine-sprite-viewer.git
   cd spine-sprite-viewer
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

#### Development

To spin up the local development server:
```bash
pnpm dev
```
Open your browser at [http://localhost:5173](http://localhost:5173) to see the app in action.

#### Production Build

To compile the project optimized for production:
```bash
pnpm build
```
Deployable files will be generated under the `/dist` directory.
