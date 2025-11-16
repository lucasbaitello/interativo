# Interativo2 — Documentação

Este projeto é um visualizador 360° com camadas de luz, controle de intensidade por sliders, e uma sobreposição de imagem "FINAL". Foi construído com Vite + React e Three.js, seguindo boas práticas de legibilidade e manutenção.

## Evolução do Aplicativo
- Correção da inversão horizontal do panorama 360° no `SphereLayer.jsx` (escala `[-1,1,1]`).
- Ocultação de números nos rótulos e manutenção de agrupamento interno por índice.
- Menu de controles colapsável em forma de círculo, com sombra sutil para legibilidade.
- Mistura de luzes fixada em modo aditivo, reduzindo artefatos configurando renderização em espaço linear.
- Remoção do seletor de blending global e padronização para aditivo.
- Sliders com valor padrão `5` e visual cinza (sem azul do navegador).

## Funcionalidades Principais
- Visualização 360° e camadas de luz por textura sobreposta.
- Controle de intensidade por slider (0–10) por camada.
- Overlay independente da imagem `FINAL` com toggle.
- Menu colapsável compacto (círculo) e expandido com sombra para melhor contraste.
- Renderização em espaço de cor linear para acumulação aditiva mais suave.

## Estrutura do Projeto
- `src/pages/Viewer.jsx`: Página principal do viewer, estado global de intensidades, toggle do `FINAL` e setup do renderer (linear space).
- `src/components/LightControls.jsx`: HUD de controles, agrupamento por número, sliders e estilos.
- `src/components/SphereLayer.jsx`: Mesh da esfera e aplicação das texturas por camada, correção de inversão e espaço de cor da textura.
- `src/lib/utils.js`: Utilitários, incluindo `sanitizeLabel` (remove números dos rótulos e padroniza maiúsculas).
- `scripts/sync-assets.js`: Sincroniza imagens de `./img` para `./public/img` e (quando habilitado) gera `manifest.json` com lista das luzes.
- `src/index.css`: Estilos globais, sombra de texto (`.text-shadow`) e slider cinza (`.range-gray`).

## Personalizações
- Aparência do HUD:
  - Classe `.text-shadow` em `src/index.css` aumenta contraste dos rótulos sobre fundos claros.
  - Sliders em cinza via `.range-gray` e `accent-color` (evita azul padrão).
- Rótulos das luzes:
  - `sanitizeLabel` em `src/lib/utils.js` remove prefixos numéricos e padroniza para maiúsculas.
- Mistura das luzes:
  - Padronizada para aditivo; renderer configurado em `Viewer.jsx` com `outputColorSpace = LinearSRGBColorSpace` e `toneMapping = NoToneMapping`.
- Overlay FINAL:
  - Toggle independente na UI; textura carregada como camada especial.

## Como personalizar os valores dos sliders
Há dois pontos diretos para controlar o valor padrão e comportamento:
- `src/pages/Viewer.jsx`: Estado inicial das intensidades (valores padrão por camada). Ajuste os valores para `5` (ou outro) na estrutura inicial do estado.
- `src/components/LightControls.jsx`: No `<input type="range" />`, o valor usa `values[f] ?? 5`. Alterar o `5` aqui muda o fallback quando um valor não está presente no estado.

Exemplo rápido (Viewer.jsx):
```jsx
// Estado inicial dos valores de luzes
const [values, setValues] = useState({
  '0 - Dome.png': 5,
  '1 - Luminária de chão.png': 5,
  // ... demais entradas
});
```

Exemplo rápido (LightControls.jsx):
```jsx
<input
  type="range"
  min={0}
  max={10}
  step={1}
  value={values[f] ?? 5} // <- fallback padrão
  onChange={e => onChange(f, parseInt(e.target.value, 10))}
  className="w-32 range-gray accent-gray-400"
/>
```

## Passo-a-passo para adicionar mais um ambiente
Este projeto trabalha com um conjunto de camadas de luz (texturas) sobre um panorama 360°. Para adicionar outro ambiente:
1. Prepare as imagens do novo ambiente:
   - Uma imagem 360° base (equiretangular) para o ambiente.
   - As camadas de luz em PNG (mesmo mapeamento), idealmente nomeadas com índices para agrupamento (ex.: `0 - Luz geral.png`, `1 - Abajur.png`, etc.).
2. Crie uma pasta para o novo ambiente em `img\<nome-do-ambiente>\luzes` e coloque as imagens lá.
3. Rode o sincronizador de assets:
   - `node scripts\sync-assets.js` (este script copia de `img` para `public\img`; se quiser gerar `manifest.json`, ajuste o script conforme necessidade).
4. Configure o `Viewer.jsx` para apontar para o novo conjunto:
   - Defina uma variável `basePath` para o ambiente novo (ex.: `public/img/<nome-do-ambiente>/luzes`).
   - Liste as camadas do novo ambiente e adicione ao estado inicial `values`.
   - Carregue as texturas da nova pasta em `SphereLayer`.
5. Opcional: Adicionar um seletor de ambiente na UI:
   - Crie um estado `selectedEnvironment` e troque o `basePath` e a lista de camadas conforme o ambiente selecionado.
6. Teste no `npm run dev` e ajuste as intensidades por slider.
7. Execute `deploy.bat` para atualizar e publicar.

## Deploy e atualização com um clique
- Use o arquivo `deploy.bat` na raiz do projeto.
- Ele instala dependências, sincroniza assets (se configurado), valida com build, comita alterações e faz push para `origin/main`.
- Se o projeto estiver conectado na Vercel via GitHub, o push em `main` dispara o deploy automaticamente. Se tiver o Vercel CLI instalado, o script também tenta publicar com `vercel --prod`.

## Notas
- Espaço de cor linear (`LinearSRGBColorSpace`) é usado nas texturas e no renderer para reduzir ruído na acumulação aditiva.
- Labels usam sombra de texto para melhorar legibilidade em fundos claros.
- O menu colapsável permanece como círculo pequeno com sombra sutil.