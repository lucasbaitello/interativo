# Regras de Ambiente (Windows)

1. **Iniciando o Servidor:**
   NUNCA rode `npm run dev` diretamente, pois isso trava o terminal.
   Sempre use o comando para abrir em nova janela:
   `cmd /c start npm run dev`

2. **Bloqueio de Arquivos:**
   O Windows bloqueia arquivos em uso. Se você precisar excluir, renomear ou mover arquivos que estão sendo usados pelo servidor/app:
   NÃO tente forçar.
   Me peça para parar o servidor manualmente primeiro.
   Só prossiga com a refatoração após eu confirmar que o servidor está parado.

3. Atualize sempre esse aquivo GEMINI.md com todas as alteraçoes que fez no projeto e qual foi o propósito, esse documento faciliitará futuras edicoes e implementaçoes de novos recursos no app


# Project Overview

This project is a 3D interactive viewer built with React and `react-three-fiber`. It allows users to explore 360-degree equirectangular images and dynamically control lighting layers. The application is designed for creating and managing different "environments," each with its own set of images and lighting configurations.

The frontend is built with React and uses `react-router-dom` for navigation. The 3D rendering is handled by `react-three-fiber`, a React renderer for Three.js. The application is served by a Vite development server, which includes custom middleware for managing environments (creating, deleting, uploading images) and for saving and loading presets.

The project is set up for deployment on Vercel.

# Building and Running

## Prerequisites

*   Node.js (version 18 or higher)
*   npm

## Installation

1.  Clone the repository.
2.  Install the dependencies:

    ```bash
    npm install
    ```

## Running the Application

To start the development server, run:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`. The main page will be the "Landing" page, where you can select an environment to view.

## Building for Production

To build the application for production, run:

```bash
npm run build
```

The production-ready files will be placed in the `dist` directory.

## Other Scripts

*   `npm run preview`: This command will start a local server to preview the production build.
*   `npm run sync-assets`: This script, defined in `package.json` and executed by `scripts/sync-assets.js`, is used to synchronize assets between the `img` and `public/img` directories and to generate manifests. This is typically run as part of the build process or via the custom middleware in the Vite development server.

# Development Conventions

## File Structure

The project follows a standard React project structure:

*   `src/`: Contains the main source code for the application.
    *   `components/`: Reusable React components.
    *   `pages/`: Components that represent entire pages (e.g., `Landing.jsx`, `Viewer.jsx`).
    *   `lib/`: Utility functions.
*   `public/`: Contains static assets that are served directly.
    *   `img/`: Contains the image assets for the different environments.
    *   `manifests/`: Contains the manifest files for each environment, which list the image files and base URL.
    *   `presets/`: Contains JSON files with preset configurations for each environment.
*   `scripts/`: Contains Node.js scripts for managing assets.

## State Management

The application uses a combination of local component state (`useState`, `useRef`) and `localStorage` for persisting state between sessions. The state for each environment is saved separately in `localStorage` under a key like `viewerState:<ambiente>`.

## Environment Management

Environments are managed through a set of custom middleware in the Vite development server. This allows for creating, deleting, and uploading images to environments directly from the browser during development. The `sync-assets` script is used to keep the `public` directory in sync with the `img` directory.

## Routing

The application uses `react-router-dom` for routing. The main routes are defined in `src/App.jsx`.

## 3D Rendering

The 3D rendering is done with `react-three-fiber`. The main viewer component is in `src/pages/Viewer.jsx`. It uses a spherical geometry with multiple layers of textures to create the 3D effect. The lighting is controlled by a set of sliders that adjust the opacity of each texture layer.

# Implementações recentes

- **Adicionado Post-Processing**:
  - Instalado `@react-three/postprocessing` e `postprocessing` para permitir efeitos de pós-processamento.
  - Adicionado o `EffectComposer` e um efeito de `Bloom` à cena principal no `Viewer.jsx`.
  - Os controles para o efeito de `Bloom` (intensidade e raio) foram movidos para o painel de "Ajustes Avançados".

- **Melhorias na Interface**:
  - O estilo do painel do usuário foi revertido para o efeito "glass" mais claro, conforme solicitado.
  - O painel de controles do desenvolvedor (`LightControls`) foi restaurado para sua funcionalidade original, exibindo todos os sliders e interruptores.

- **Blending de Camadas**:
  - O dropdown de "Blending Mode" no `LightControls` agora inclui a opção "Screen".
  - A lógica em `SphereLayer.jsx` foi atualizada para lidar com o modo de mesclagem "Screen" usando `THREE.CustomBlending`, o que deve ajudar a evitar o efeito de "estouro" nas luzes.

- **Correções de Bugs**:
  - Corrigido um problema onde a propriedade `blending` das camadas de esfera estava recebendo um valor de string inválido. A lógica foi aprimorada para lidar com diferentes modos de mesclagem.

# Versionamento

- **Branch Atual**: `correrpelocerto`
- **Deploy**: O deploy desta branch para o Vercel pode ser feito após o push para o GitHub. A URL do deploy será gerada automaticamente pelo Vercel.
