# Sistema de Múltiplos Ambientes e Portais

## 📋 Visão Geral

O projeto agora suporta **múltiplos ambientes 3D** com navegação entre eles através de **portais**. Você pode adicionar novos ambientes facilmente apenas adicionando imagens em pastas e executando um script automatizado.

## 🚀 Como Adicionar um Novo Ambiente

### Método Automático (Recomendado)

1. **Execute o script de configuração:**
   ```bash
   node scripts/setup-environment.js nome-do-ambiente
   ```
   
   Exemplo:
   ```bash
   node scripts/setup-environment.js cozinha
   ```

2. **O script irá:**
   - ✅ Criar `public/img/cozinha/` (pasta para imagens)
   - ✅ Criar `public/presets/cozinha/` (pasta para configurações)
   - ✅ Gerar `viewerState.json` inicial baseado nas imagens
   - ✅ Atualizar `public/environments.json` com o novo ambiente

3. **Adicione as imagens:**
   - Coloque os arquivos PNG das camadas em `public/img/cozinha/`
   - Nomeie os arquivos seguindo o padrão: `0 - nome.png`, `1 - nome.png`, etc
   - O arquivo `FINAL.png` será usado como thumbnail

4. **Configure no viewer:**
   - Abra o viewer e selecione o novo ambiente
   - Configure hotspots e portais
   - Salve a configuração usando "Salvar config"

### Método Manual

Se preferir fazer manualmente:

1. Crie as pastas:
   ```
   public/img/seu-ambiente/
   public/presets/seu-ambiente/
   ```

2. Adicione as imagens em `public/img/seu-ambiente/`

3. Edite `public/environments.json`:
   ```json
   [
     {
       "id": "seu-ambiente",
       "name": "Nome Exibido",
       "imgPath": "/img/seu-ambiente",
       "presetPath": "/presets/seu-ambiente/viewerState.json",
       "thumbnail": "/img/seu-ambiente/FINAL.png"
     }
   ]
   ```

4. Crie `public/presets/seu-ambiente/viewerState.json` com a estrutura básica

## 🌀 Sistema de Portais

Portais são hotspots especiais que permitem navegar entre ambientes.

### Criando um Portal

1. **Ative o modo desenvolvedor** ("Adicionar pontos")

2. **Duplo clique** no panorama onde deseja criar o portal

3. **No menu de edição do hotspot:**
   - Marque a opção "Portal"
   - Selecione o ambiente de destino
   - Defina um label descritivo (ex: "Ir para Cozinha")
   - Ajuste forma e tamanho

4. **Confirme** para salvar

### Diferenças entre Hotspot e Portal

| Característica | Hotspot Normal | Portal |
|---------------|----------------|--------|
| Cor (debug) | Azul | Magenta |
| Função | Liga/desliga luzes | Navega para outro ambiente |
| Ícone | Nenhum | 🚪 Porta |
| Configuração | Associa luzes | Seleciona ambiente destino |

### Usando Portais

- **Modo normal:** Clique no portal para ir para o ambiente de destino
- **Modo debug:** Clique para editar configurações do portal
- **Hover:** Mostra label e ambiente de destino

## 📁 Estrutura de Arquivos

```
public/
├── environments.json          # Lista de ambientes disponíveis
├── img/
│   ├── luzes/                # Ambiente 1
│   │   ├── 0 - Dome.png
│   │   ├── 1 - Luminária.png
│   │   └── FINAL.png         # Thumbnail
│   └── cozinha/              # Ambiente 2
│       ├── 0 - Dome.png
│       └── FINAL.png
└── presets/
    ├── luzes/
    │   └── viewerState.json  # Config do ambiente 1
    └── cozinha/
        └── viewerState.json  # Config do ambiente 2
```

## 🔧 Formato do viewerState.json

```json
{
  "values": {
    "0 - Dome.png": 50,
    "__daylight": 50
  },
  "lightsState": {
    "0 - Dome.png": {
      "nome": "DOME",
      "estado": true,
      "dimmerizavel": false,
      "valor": 50,
      "pontos": []
    }
  },
  "hotspots": [
    {
      "id": "uuid",
      "position": [x, y, z],
      "lights": ["0 - Dome.png"],
      "shape": "sphere",
      "size": 0.5
    }
  ],
  "portals": [
    {
      "id": "uuid",
      "position": [x, y, z],
      "targetEnvironment": "cozinha",
      "label": "Ir para Cozinha",
      "shape": "sphere",
      "size": 0.6
    }
  ],
  "debugClick": false,
  "showFinal": false,
  "daylightTargets": ["0 - Dome.png"]
}
```

## 🎨 Seletor de Ambientes

O componente `EnvironmentSelector` permite navegar entre ambientes:

- **Localização:** Canto superior esquerdo do viewer
- **Funcionalidade:** Dropdown com lista de ambientes
- **Thumbnails:** Mostra preview de cada ambiente
- **Indicador:** Marca o ambiente atual

## 💡 Dicas e Boas Práticas

### Nomenclatura de Arquivos

- Use prefixos numéricos para ordenação: `0 -`, `1 -`, `2 -`
- Luzes de ambiente (dome, cortina): prefixo `0 -`
- Luzes dimerizáveis: prefixos maiores
- Arquivo final: sempre `FINAL.png`

### Organização de Portais

- Coloque portais em locais lógicos (portas, janelas, corredores)
- Use labels descritivos ("Ir para Sala", "Voltar para Hall")
- Tamanho recomendado: 0.5 a 0.8 para boa visibilidade

### Performance

- Limite o número de camadas por ambiente (máx 15-20)
- Use compressão PNG para reduzir tamanho dos arquivos
- Evite muitos portais em um único ambiente (máx 5-6)

## 🔄 Fluxo de Trabalho Recomendado

1. **Planejamento:**
   - Defina quais ambientes você precisa
   - Mapeie as conexões entre eles (portais)

2. **Criação:**
   - Execute `setup-environment.js` para cada ambiente
   - Adicione as imagens renderizadas

3. **Configuração:**
   - Configure luzes e hotspots em cada ambiente
   - Adicione portais para navegação
   - Teste a navegação entre ambientes

4. **Refinamento:**
   - Ajuste posições de portais
   - Configure presets de iluminação
   - Salve configurações finais

## 🐛 Troubleshooting

### Ambiente não aparece no seletor
- Verifique se `environments.json` está correto
- Confirme que o `id` é único
- Recarregue a página

### Imagens não carregam
- Verifique o caminho em `imgPath`
- Confirme que as imagens estão na pasta correta
- Veja o console do navegador para erros

### Portal não funciona
- Verifique se `targetEnvironment` existe em `environments.json`
- Confirme que o portal está salvo em `viewerState.json`
- Teste em modo debug primeiro

## 📝 Exemplo Completo

```bash
# 1. Criar novo ambiente
node scripts/setup-environment.js sala-jantar

# 2. Adicionar imagens
# Copie os arquivos PNG para public/img/sala-jantar/

# 3. Abrir no navegador
# http://localhost:5173/viewer?env=sala-jantar

# 4. Configurar no viewer
# - Adicionar hotspots
# - Criar portais para outros ambientes
# - Salvar configuração

# 5. Testar navegação
# Clique nos portais para navegar entre ambientes
```

## 🎯 Próximos Passos

Agora você pode:
- ✅ Adicionar quantos ambientes quiser
- ✅ Criar portais para navegação fluida
- ✅ Configurar iluminação independente por ambiente
- ✅ Exportar/importar configurações

Para mais detalhes, consulte o README principal do projeto.
