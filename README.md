  - Modo desenvolvedor: captura de cliques para criar hotspots na esfera e abre menu flutuante para associar luzes.

- `src/main.jsx`
  - Inicializa React com `BrowserRouter` e monta `App` em `#root`.

- `src/App.jsx`
  - Define as rotas principais (`/` → Landing, `/viewer` → Viewer) e fallback.

- `src/components/UserPanel.jsx`
  - Painel lateral do usuário; inclui slider "Luz do Dia", botões e abertura do modal de Ajustes.

- `src/components/SliderBar.jsx`
  - Componente de slider unificado com barra de progresso visível e input range invisível.

- `src/index.css`
  - Utilitários `.glass`, `.no-select`, `.no-caret` e estilos dos sliders (espessura, cores, hover).

- `vercel.json`
  - Configura build Vite e `rewrites` para `/viewer` em produção.

- `src/components/LightControls.jsx`
- HUD colapsável com sliders (0–100) usando fallback `values[f] ?? 50`.
- Toggle "Imagem FINAL" estilo iOS, menor e com cores compatíveis com os sliders (cinza). Inclui sombras e `text-shadow` para legibilidade.
- Toggle "Adicionar pontos" para ativar o modo desenvolvedor (debug click).
- Input `valor` sincronizado com o slider de cada luz (0–100).
 - Painel do usuário (lado direito) minimalista:
   - Slider vertical "Luz do Dia" com gradiente pastel interno (amarelo → azul), ícones discretos de sol e lua e sem textos.
   - Controla simultaneamente as luzes DOME, DOME 2 e REFORÇO DO SOL (ajusta os três sliders juntos).
   - Sliders compactos para luzes dimerizáveis: duas linhas por luz (nome em cima, slider fino e translúcido abaixo).

- `src/components/SphereLayer.jsx`
  - Renderiza camadas esféricas com materiais/texturas conforme intensidade dos sliders.

- `src/components/Hotspot.jsx`
  - Componente React que renderiza uma esfera clicável (`<mesh>` + `<sphereGeometry>`).
  - Cor azul semitransparente quando em modo desenvolvedor; transparente fora do modo.

- `public/manifest.json`
  - Mapeia assets das camadas e metadados de exibição.

- `deploy.bat`
  - Sincroniza assets (se aplicável), roda build e executa `npm run deploy` (GitHub/Vercel). Pode reportar vulnerabilidades do `npm audit` (2 moderadas, 3 altas) — não afetam build.

## Detalhes de UI e Interações

- Botões com sombra para visibilidade em fundo branco e glow escuro sutil (`.dark-glow`).
  - Ícones dentro dos botões agora também recebem glow de texto (`.text-glow-dark`) para legibilidade consistente.
- Fullscreen: botão no canto inferior direito é hover-only e alterna entrada/saída.
- Ícones Bootstrap: `bi-aspect-ratio` e `bi-box-arrow-in-down-left`.
- Toggle "Imagem FINAL": menor, com cores dos sliders (cinza), desligado por padrão.
- Toggle "Adicionar pontos": quando ativado, cliques dentro do panorama criam esferas clicáveis (hotspots) para associação de luzes.
  - Em modo desenvolvedor, os hotspots aparecem em azul com opacidade.
  - Fora do modo, ficam transparentes (continuam clicáveis).
 - Modal "Ajustes avançados":
  - Renderizado via Portal diretamente em `document.body` para evitar problemas de stacking context, overlays e Quirks Mode.
  - Z-index elevado (`z-[9999]`) e `pointer-events: auto` para interatividade confiável.
  - Fallback de posição visível (`top/left = 20px`); após medir dimensões, centraliza com `top/left` sem `translate(-50%, -50%)`.
  - Arrasto pelas bordas (faixas de 3px) sem interferir em sliders e botões internos.
  - Posição é limitada à viewport com margem de 20px.
  - Seleção de texto/caret é bloqueada durante o arrasto (`.no-select`, `.no-caret`).
  - Atalhos: tecla `A` abre; `Esc` fecha.

### Nota sobre Quirks Mode

- Caso veja o alerta de Quirks Mode no console, verifique que a primeira linha do `index.html` é `<!DOCTYPE html>` e que o servidor não está injetando HTML anterior ao DOCTYPE. Quirks Mode pode quebrar posicionamentos (`fixed`, `top/left`) e causar comportamentos inesperados.

## Notas de Zoom

- Zoom por FOV (mais poderoso):
  - Ajuste `minFov` (zoom-in mais forte), `maxFov` (zoom-out maior) e `sensitivity` (passo por rolagem) no componente `FovZoom` em `Viewer.jsx`.
  - Segure Shift para acelerar o zoom.
- Damping: `enableDamping: true` e `dampingFactor: 0.06` para suavidade nos movimentos.

### Padronização dos Sliders e Legibilidade

- Sliders redesenhados (`SliderBar`) com barra de progresso visível no tom cinza dos toggles (`bg-gray-400/70`).
- Fundo translúcido com leve blur e borda sutil (`bg-white/12`, `border-white/15`).
- Glow escuro quase transparente (`.dark-glow`) aplicado para melhor legibilidade em fundos muito claros.
- Efeito hover consistente (`hover:bg-white/16`, `hover:border-white/20`).

### Centralização do Modal de Ajustes

- Janela de Ajustes Avançados agora aparece centralizada usando `transform: translate(-50%, -50%)` com `top/left` em coordenadas de centro da viewport.

## Modo Desenvolvedor e Hotspots

- Ative "Adicionar pontos" no painel lateral.
- Crie pontos com duplo clique (evita criações acidentais durante a navegação).
- Ao clicar no hotspot em modo desenvolvedor, abre um menu flutuante com lista de luzes.
  - Selecione uma ou mais luzes e clique em "Confirmar" para associar o ponto.
- Ao clicar no hotspot fora do modo desenvolvedor, o ponto alterna o "Estado" das luzes associadas (ligado/desligado).
  - Se a luz não for "Dimmerizável", sua intensidade muda entre `0` e `100` junto com o estado.
 - Em modo desenvolvedor, é possível mover o ponto arrastando-o.
 - Para forma "Quadrado", há controles independentes de largura e altura, permitindo criar retângulos como áreas ativas de link.

### Propriedades de cada luz (painel "Interruptores de Luz")

- Nome: extraído do arquivo PNG (exibido ao lado do slider).
- Estado: indicador `On/Off` (a renderização zera a opacidade quando Off).
- Dimmerizável: toggle para mostrar/ocultar slider (quando Off, a luz só liga/desliga).
- slider: controle 0–100 (mostrado apenas se Dimmerizável estiver ativo).
- valor: input numérico sincronizado 0–100.
- coordenadas: lista dos pontos (hotspots) associados com suas posições; é possível apagar o link diretamente no painel.

## Exemplos Rápidos

- Adicionar um ponto:
  - Ative "Adicionar pontos".
  - Faça duplo clique no panorama para criar o hotspot.
  - Clique no hotspot e associe luzes no menu flutuante centralizado (fundo cinza semitransparente).
  - Desative "Adicionar pontos"; agora, clicar no hotspot alterna o estado das luzes associadas.

## Exemplos Rápidos

- Entrar em tela cheia: passar o mouse no canto inferior direito e clicar no ícone.
- Sair da tela cheia: repetir o clique (toggle) ou usar o ícone no topo quando em hover.
- Ajustar intensidade: mover sliders; valores iniciais são 50.
 - Ajustar Luz do Dia: mover o slider vertical (gradiente). Afeta as luzes DOME, DOME 2 e REFORÇO DO SOL em conjunto.

## Observações

- Regras de rewrite do deploy direcionam para `/viewer` (limitação conhecida).
- Se o scroll não acionar zoom, garanta que o mouse está sobre o Canvas (não sobre painéis).
- Após alterações, rode `deploy.bat` para publicar em Vercel via GitHub.

## Presets e Salvamento de Configurações

- Botão "Salvar config": grava em `public/config/viewerState.json` durante o desenvolvimento (dev server).
- Botão "Baixar preset": baixa um arquivo `viewerState.json` com o estado atual (`values`, `lightsState`, `hotspots`, `debugClick`, `showFinal`).
- Local recomendado para organizar presets: `public/presets/<ambiente>/viewerState.json`.
  - Exemplos: `public/presets/sala/viewerState.json`, `public/presets/cozinha/viewerState.json`.
- Se o servidor retornar "Resposta vazia do servidor", utilize o botão de download e mova o arquivo manualmente para a pasta de presets.
 - Auto-carregamento de preset: se existir `public/presets/luzes/viewerState.json`, o aplicativo carrega automaticamente ao iniciar e aplica o estado.

## Atualizações de UI e Comportamento

- Menu do usuário: bordas bem mais arredondadas e scrollbar fina (`scroll-thin`). O último slider possui margem extra para não colidir com as bordas.
- Menu do desenvolvedor: sliders mais espessos (`range-thick`) e linha dedicada para maior precisão.
- Valor exibido: em vez de input numérico, mostramos porcentagem somente leitura para evitar cursor de digitação.
- Luzes não dimerizáveis: ao alternar o estado, o valor do slider permanece absoluto; apenas o estado muda (liga/desliga).
- Ações rápidas no slider "Luz do Dia":
   - `Lightbulb fill`: acende todas as luzes aplicando a configuração do preset carregado.
   - `Lightbulb off`: apaga todas as luzes exceto as de Luz do Dia.
   - `Ajustes` (ícone de sliders): abre uma janela flutuante com ajustes avançados.

## Novidades recentes

- Auto-ligar dimerizáveis: ao mover qualquer slider marcado como "Dimmerizável", a luz correspondente é automaticamente ligada (`estado: true`).
- Hotspots sem duplicação: ao confirmar a edição de um ponto, os links com as luzes são reconciliados (adicionados apenas uma vez e removidos das luzes desmarcadas).
- Arraste mais suave dos hotspots: o movimento agora usa a interseção do raio do ponteiro com a esfera, mantendo o ponto na superfície com menos truncamento.
- Alvos da Luz do Dia configuráveis: no painel de desenvolvedor, há uma seção "Luzes controladas pela Luz do Dia" com checkboxes para escolher quais luzes o slider vertical deve ajustar. Essa configuração é persistida em `localStorage` e também é suportada em presets.
- Layout padronizado do painel do usuário: o espaçamento dos sliders compactos foi ajustado para se manter consistente mesmo quando há 0 ou 1 luz dimerizável.
- Ajustes avançados: botão de "Ajustes" no painel do usuário abre uma janela com sliders de Temperatura, Saturação, Contraste, Gama, Highlight Burn e Redução de Ruído. As alterações de Saturação/Contraste/Gama/Highlight e Redução de Ruído são aplicadas globalmente via filtros CSS no Canvas.
- Sliders com arestas mais suaves e contraste aumentado: elementos brancos utilizam ~50% de opacidade; trilhas cinzas foram escurecidas com ~70% de opacidade para melhorar a legibilidade.
 - Sliders redesenhados: Ajustes, Luzes dimerizáveis e Menu do desenvolvedor usam um componente unificado com barra de progresso visível (bg branco translúcido, blur leve, borda), e um `input range` invisível por cima — o mesmo estilo de referência do slider da Luz do Dia.
 - Textos com sombra no painel do desenvolvedor: "Compactar", "Salvar config" e "Baixar preset" recebem `text-shadow` para melhor legibilidade.
 - Preset inclui alvos da Luz do Dia: o arquivo `viewerState.json` gerado agora contém `daylightTargets` para persistir quais luzes são afetadas pelo slider "Luz do Dia".
 - Janela de ajustes sem blur: o overlay não aplica desfoque ao ambiente, permitindo ajustar a imagem com precisão.
- Janela de ajustes centralizada e arrastável: surge no centro da página, pode ser movida para qualquer canto e não escurece/oculta o restante da interface.
  - Arraste sem seleção: durante o arraste, a seleção de texto é bloqueada e restaurada ao soltar, evitando comportamento estranho de selecionar textos e sliders.
  - Container do modal com `select-none` para impedir seleção acidental de conteúdo.

### Painel do Usuário

- Espaçamento entre o slider de Luz do Dia e os botões é ajustável via constante `DAYLIGHT_BUTTONS_GAP_PX` em `src/components/UserPanel.jsx` (comentado no código).
 - Arraste de hotspots contínuo: o ponto segue o cursor mesmo fora da sua área até o momento de soltar o mouse (mouseup).
 - Sombra aplicada amplamente aos textos: adicionamos `text-shadow` nas principais superfícies (Landing, modal de Ajustes e painéis) para legibilidade superior em fundos claros e com efeitos.
 - Movimento da câmera com amortecimento elástico: reduzimos a `rotateSpeed` e aumentamos o `dampingFactor` enquanto um hotspot está sendo arrastado, deixando a esfera acompanhar com suavidade e sem ultrapassar os pontos.
 - Slider de brilho e botão "restaurar padrão": o modal de ajustes inclui controle de brilho e um botão para voltar aos valores padrão (Saturação 1, Contraste 1, Gama 1, Brilho 1, Highlight 0, Ruído 0, Temperatura 0).
 - Painel do usuário: quando não há luzes dimerizáveis, a área permanece vazia (sem mensagem).