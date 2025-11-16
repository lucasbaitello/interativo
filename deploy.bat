@echo off
setlocal enabledelayedexpansion

REM Atualiza dependências, sincroniza assets, valida build, comita e publica
echo === Interativo2: Atualização e Deploy ===

REM 1) Instalar dependências
if exist package-lock.json (
  echo Instalando dependencias...
  npm install
) else (
  echo package-lock.json nao encontrado, prosseguindo...
)

REM 2) Sincronizar assets (se script existir)
if exist scripts\sync-assets.js (
  echo Sincronizando assets...
  node scripts\sync-assets.js
) else (
  echo scripts\\sync-assets.js nao encontrado, pulando sincronizacao...
)

REM 3) Build para validar
echo Gerando build...
npm run build
if errorlevel 1 (
  echo ERRO: build falhou. Corrija antes de publicar.
  pause
  exit /b 1
)

REM 4) Commit (apenas se ha mudanças)
echo Preparando commit...
git diff --quiet
if errorlevel 1 (
  git add -A
  set NOW=%date% %time%
  git commit -m "chore: update and deploy %NOW%"
) else (
  echo Nenhuma alteracao para commitar.
)

REM 5) Push para origin/main
echo Publicando para origin/main...
git push -u origin main
if errorlevel 1 (
  echo ERRO: push falhou. Verifique credenciais remoto/origem.
  pause
  exit /b 1
)

REM 6) Deploy direto (se Vercel CLI estiver instalado)
where vercel >nul 2>&1
if not errorlevel 1 (
  echo Vercel CLI encontrado. Iniciando deploy de producao...
  vercel --prod --confirm
) else (
  echo Vercel CLI nao encontrado. Se o projeto estiver conectado a Vercel via GitHub, o push ja dispara o deploy.
)

echo === Processo concluido. ===
pause