@echo off
if "%1"=="" (
  echo Uso: delete-env.bat <ambiente>
  exit /b 1
)
node scripts\manage-envs.js delete %1
echo Ambiente removido (arquivos em public e manifestos atualizados).