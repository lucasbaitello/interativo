# Guia de Integração - Sistema de Ambientes e Portais

## ⚠️ Instruções para Integração Manual

Devido à complexidade do arquivo `Viewer.jsx`, aqui está um guia passo a passo para integrar o sistema de ambientes e portais.

## 📝 Passo 1: Adicionar Imports

No início do arquivo `src/pages/Viewer.jsx`, adicione os seguintes imports após os existentes:

```javascript
import Portal from '../components/Portal'
import EnvironmentSelector from '../components/EnvironmentSelector'
import { useEnvironment } from '../hooks/useEnvironment'
```

## 📝 Passo 2: Adicionar Estados para Portais

Após a linha onde você declara `const [hotspots, setHotspots] = useState([])`, adicione:

```javascript
const [portals, setPortals] = useState([])
const [editingPortalId, setEditingPortalId] = useState(null)
const [isPortalMode, setIsPortalMode] = useState(false)
```

## 📝 Passo 3: Adicionar Hook de Ambiente

Logo após as declarações de estado (antes dos useEffects), adicione:

```javascript
// Sistema de ambientes
const { currentEnv, envConfig, setCurrentEnv, environments } = useEnvironment()
```

## 📝 Passo 4: Modificar baseUrl para Usar Ambiente Dinâmico

Encontre a linha:
```javascript
const baseUrl = '/img/luzes/'
```

E substitua por:
```javascript
const baseUrl = envConfig?.imgPath ? `${envConfig.imgPath}/` : '/img/luzes/'
```

## 📝 Passo 5: Carregar Portais do Preset

No useEffect que carrega o preset (linha ~145), adicione após carregar hotspots:

```javascript
if (Array.isArray(preset.portals)) setPortals(preset.portals)
```

## 📝 Passo 6: Persistir Portais no localStorage

No useEffect de persistência (linha ~389), modifique o payload para incluir portals:

```javascript
const payload = {
  values,
  lightsState,
  hotspots,
  portals, // ADICIONAR ESTA LINHA
  debugClick,
  showFinal,
  daylightTargets,
  adjustments
}
```

## 📝 Passo 7: Adicionar Função para Criar Portal

Após a função `addHotspot` (linha ~316), adicione:

```javascript
// Adiciona portal na superfície da esfera ao clicar em modo portal
const addPortal = (point) => {
  const id = (self.crypto && self.crypto.randomUUID) ? self.crypto.randomUUID() : `${Date.now()}-${Math.floor(Math.random()*1e6)}`
  setPortals(prev => [...prev, { 
    id, 
    position: [point.x, point.y, point.z], 
    targetEnvironment: environments[0]?.id || 'luzes',
    label: 'Portal',
    shape: 'sphere', 
    size: 0.6 
  }])
  setEditingPortalId(id)
}
```

## 📝 Passo 8: Adicionar Handler de Clique em Portal

Após a função `onHotspotClick` (linha ~350), adicione:

```javascript
const onPortalClick = ({ targetEnvironment }) => {
  if (!debugClick) {
    // Navegar para o ambiente de destino
    setCurrentEnv(targetEnvironment)
  }
}
```

## 📝 Passo 9: Renderizar Portais no Canvas

Dentro do `<Canvas>`, após o map de hotspots (linha ~476), adicione:

```javascript
{/* Portais */}
{portals.map(p => (
  <Portal
    key={p.id}
    id={p.id}
    position={p.position}
    targetEnvironment={p.targetEnvironment}
    label={p.label}
    shape={p.shape}
    size={p.size}
    debugMode={debugClick}
    onPortalClick={onPortalClick}
    onDragStart={() => setDraggingHotspot(true)}
    onDragEnd={() => setDraggingHotspot(false)}
  />
))}
```

## 📝 Passo 10: Adicionar Seletor de Ambientes na UI

No início do JSX de retorno, logo após `<div ref={containerRef}...>`, adicione:

```javascript
{/* Seletor de Ambientes */}
<div className="absolute top-4 left-4 z-50">
  <EnvironmentSelector 
    currentEnvironment={currentEnv}
    onEnvironmentChange={setCurrentEnv}
  />
</div>
```

## 📝 Passo 11: Modificar Duplo Clique para Suportar Portais

Encontre o handler `onDoubleClick` na mesh de picking (linha ~442) e modifique:

```javascript
onDoubleClick={(e) => {
  if (!debugClick) return
  if (editingHotspotId || editingPortalId) return
  if (isPortalMode) {
    addPortal(e.point)
  } else {
    addHotspot(e.point)
  }
}}
```

## 📝 Passo 12: Adicionar Toggle de Modo Portal no LightControls

No componente `<LightControls>`, adicione as props:

```javascript
<LightControls
  // ... props existentes ...
  isPortalMode={isPortalMode}
  onTogglePortalMode={() => setIsPortalMode(v => !v)}
  portals={portals}
  onUpdatePortal={(id, updates) => setPortals(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))}
  onDeletePortal={(id) => setPortals(prev => prev.filter(p => p.id !== id))}
  environments={environments}
/>
```

## ✅ Verificação

Após fazer todas as modificações:

1. Salve o arquivo
2. Execute `npm run dev`
3. Verifique se não há erros no console
4. Teste criar um portal em modo desenvolvedor
5. Teste navegar entre ambientes

## 🔧 Troubleshooting

Se houver erros:
- Verifique se todos os imports estão corretos
- Confirme que os arquivos `Portal.jsx`, `EnvironmentSelector.jsx` e `useEnvironment.js` existem
- Veja o console do navegador para erros específicos

## 📚 Próximos Passos

Depois da integração:
1. Teste o script: `node scripts/setup-environment.js sala`
2. Adicione imagens na pasta criada
3. Configure portais entre ambientes
4. Salve as configurações

---

**Nota:** Se preferir, posso criar uma versão completamente nova do Viewer.jsx com todas as modificações já aplicadas, mas isso substituiria o arquivo inteiro. Me avise se prefere essa abordagem!
