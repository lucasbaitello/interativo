# Viewer de Camadas (R3F / three-stdlib)

Visualizador 3D com camadas esféricas, controles de luz e modo tela cheia. Inclui sliders em escala 0–100 com padrão 50, zoom funcional com movimento mais fluido (damping), e UI com botões e toggle estilizados para melhor legibilidade.

## Instalação

- Requisitos: Node.js 18+, npm
- Instale dependências: `npm install`
- Sincronize assets (opcional, se houver): `sync-assets` via `deploy.bat`
- Execute em desenvolvimento: `npm run dev`

## Uso

- Acesse `http://localhost:5173/viewer`.
- Sliders: cada controle opera na escala `0–100` e inicia em `50` por padrão.
- Zoom: use o scroll do mouse sobre o Canvas para aproximar/afastar. Movimento mais fluido com `enableDamping`. Implementado via FOV para maior potência (segure Shift para acelerar).
- Tela cheia:
  - Passe o mouse no canto inferior direito para revelar o botão de tela cheia (hover-only).
  - Clique para entrar/sair (toggle único). Ícones: `bi-aspect-ratio` (entrar) e `bi-box-arrow-in-down-left` (sair).
  - Em tela cheia, o botão de sair também aparece no topo ao passar o mouse.
- Imagem FINAL: toggle estilo iOS, menor, cores compatíveis com os sliders (cinza), e com sombra para legibilidade. Desligado por padrão.

## Estrutura de Arquivos

- `index.html`
  - Carrega Bootstrap Icons via CDN para os ícones dos botões.
  - Monta a aplicação.

- `src/pages/Viewer.jsx`
  - Canvas principal (React Three Fiber) e `OrbitControls` (dolly desativado para evitar conflito com FOV).
  - Configura câmera (`near`, `far`, posição) e controles com `enableDamping`, `dampingFactor`, `minDistance`, `maxDistance`, `rotateSpeed`.
  - Implementa modo tela cheia com toggle único (`requestFullscreen`/`exitFullscreen`). Botões são hover-only e possuem sombras para visibilidade.
  - Integração com estado `showFinal` (inicia `false`).
  - Implementa zoom por FOV (`FovZoom`): ajuste manual em `minFov`, `maxFov`, `sensitivity`. Segure Shift para acelerar.

- `src/components/LightControls.jsx`
  - HUD colapsável com sliders (0–100) usando fallback `values[f] ?? 50`.
  - Toggle "Imagem FINAL" estilo iOS, menor e com cores compatíveis com os sliders (cinza). Inclui sombras e `text-shadow` para legibilidade.

- `src/components/SphereLayer.jsx`
  - Renderiza camadas esféricas com materiais/texturas conforme intensidade dos sliders.

- `public/manifest.json`
  - Mapeia assets das camadas e metadados de exibição.

- `deploy.bat`
  - Sincroniza assets (se aplicável), roda build e executa `npm run deploy` (GitHub/Vercel). Pode reportar vulnerabilidades do `npm audit` (2 moderadas, 3 altas) — não afetam build.

## Detalhes de UI e Interações

- Botões com sombra para visibilidade em fundo branco.
- Fullscreen: botão no canto inferior direito é hover-only e alterna entrada/saída.
- Ícones Bootstrap: `bi-aspect-ratio` e `bi-box-arrow-in-down-left`.
- Toggle "Imagem FINAL": menor, com cores dos sliders (cinza), desligado por padrão.

## Notas de Zoom

- Zoom por FOV (mais poderoso):
  - Ajuste `minFov` (zoom-in mais forte), `maxFov` (zoom-out maior) e `sensitivity` (passo por rolagem) no componente `FovZoom` em `Viewer.jsx`.
  - Segure Shift para acelerar o zoom.
- Damping: `enableDamping: true` e `dampingFactor: 0.06` para suavidade nos movimentos.

## Exemplos Rápidos

- Entrar em tela cheia: passar o mouse no canto inferior direito e clicar no ícone.
- Sair da tela cheia: repetir o clique (toggle) ou usar o ícone no topo quando em hover.
- Ajustar intensidade: mover sliders; valores iniciais são 50.

## Observações

- Regras de rewrite do deploy direcionam para `/viewer` (limitação conhecida).
- Se o scroll não acionar zoom, garanta que o mouse está sobre o Canvas (não sobre painéis).
- Após alterações, rode `deploy.bat` para publicar em Vercel via GitHub.