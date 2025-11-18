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
  - Modo desenvolvedor: captura de cliques para criar hotspots na esfera e abre menu flutuante para associar luzes.

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

- Botões com sombra para visibilidade em fundo branco.
- Fullscreen: botão no canto inferior direito é hover-only e alterna entrada/saída.
- Ícones Bootstrap: `bi-aspect-ratio` e `bi-box-arrow-in-down-left`.
- Toggle "Imagem FINAL": menor, com cores dos sliders (cinza), desligado por padrão.
- Toggle "Adicionar pontos": quando ativado, cliques dentro do panorama criam esferas clicáveis (hotspots) para associação de luzes.
  - Em modo desenvolvedor, os hotspots aparecem em azul com opacidade.
  - Fora do modo, ficam transparentes (continuam clicáveis).

## Notas de Zoom

- Zoom por FOV (mais poderoso):
  - Ajuste `minFov` (zoom-in mais forte), `maxFov` (zoom-out maior) e `sensitivity` (passo por rolagem) no componente `FovZoom` em `Viewer.jsx`.
  - Segure Shift para acelerar o zoom.
- Damping: `enableDamping: true` e `dampingFactor: 0.06` para suavidade nos movimentos.

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
 - Textos com sombra no painel do desenvolvedor: "Compactar", "Salvar config" e "Baixar preset" recebem `text-shadow` para melhor legibilidade.
 - Preset inclui alvos da Luz do Dia: o arquivo `viewerState.json` gerado agora contém `daylightTargets` para persistir quais luzes são afetadas pelo slider "Luz do Dia".
 - Janela de ajustes sem blur: o overlay não aplica desfoque ao ambiente, permitindo ajustar a imagem com precisão.
 - Slider de brilho e botão "restaurar padrão": o modal de ajustes inclui controle de brilho e um botão para voltar aos valores padrão (Saturação 1, Contraste 1, Gama 1, Brilho 1, Highlight 0, Ruído 0, Temperatura 0).
 - Painel do usuário: quando não há luzes dimerizáveis, a área permanece vazia (sem mensagem).