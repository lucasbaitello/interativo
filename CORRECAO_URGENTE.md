node scripts/generate-all-manifests.js


# 🚨 CORREÇÃO URGENTE - Viewer.jsx Quebrado

## 1️⃣ RESTAURAR O VIEWER.JSX

Execute UM destes comandos no PowerShell:

```powershell
# Opção 1: Restaurar do backup (se existir)
Copy-Item "src\pages\Viewer.jsx.backup" "src\pages\Viewer.jsx" -Force

# Opção 2: Restaurar do Git
git restore src/pages/Viewer.jsx

# Opção 3: Se nenhum funcionar, restaure do Git com checkout
git checkout HEAD -- src/pages/Viewer.jsx
```

Depois teste:
```powershell
npm run dev
```

---

## 2️⃣ USAR O SCRIPT PYTHON

Agora você tem um script Python completo para gerenciar ambientes!

### Listar Ambientes:
```powershell
python scripts/manage-environments.py list
```

### Remover Ambiente (ex: "luzes"):
```powershell
python scripts/manage-environments.py remove luzes
```

### Adicionar Ambiente:
```powershell
python scripts/manage-environments.py add "Nome do Ambiente"
```

---

## 3️⃣ EXEMPLO: REMOVER "LUZES"

```powershell
# 1. Ver ambientes atuais
python scripts/manage-environments.py list

# 2. Remover "luzes"
python scripts/manage-environments.py remove luzes

# 3. Confirmar quando perguntado (digite 's')

# 4. Verificar
python scripts/manage-environments.py list
```

**Nota:** O script NÃO deleta as pastas automaticamente (segurança).
Se quiser deletar as pastas também:

```powershell
Remove-Item -Recurse -Force "public\img\luzes"
Remove-Item -Recurse -Force "public\presets\luzes"
```

---

## 4️⃣ VANTAGENS DO SCRIPT PYTHON

✅ Adiciona ambientes
✅ Remove ambientes (com confirmação)
✅ Lista todos os ambientes
✅ Verifica se pastas existem
✅ Conta quantas imagens tem
✅ Não deleta pastas por engano (segurança)
✅ Gera viewerState.json automaticamente

---

## 5️⃣ SEUS AMBIENTES ATUAIS

Você tem:
- ✅ luzes (Sala de Estar)
- ✅ sala
- ✅ varanda

Para remover "luzes" e deixar só "sala" e "varanda":

```powershell
python scripts/manage-environments.py remove luzes
```

---

## ⚠️ IMPORTANTE

1. **PRIMEIRO** restaure o Viewer.jsx (passo 1)
2. **TESTE** se o app roda (`npm run dev`)
3. **DEPOIS** use o script Python para gerenciar ambientes

---

## 📝 RESUMO DOS COMANDOS

```powershell
# Restaurar Viewer.jsx
git restore src/pages/Viewer.jsx

# Testar
npm run dev

# Listar ambientes
python scripts/manage-environments.py list

# Remover "luzes"
python scripts/manage-environments.py remove luzes

# Adicionar novo
python scripts/manage-environments.py add "Cozinha"
```

---

**Execute os comandos acima e me avise se funcionou!** 🚀
