@echo off
REM Script de exemplo para criar um novo ambiente de teste

echo ========================================
echo  Criando Ambiente de Teste
echo ========================================
echo.

REM Criar ambiente de exemplo chamado "sala"
node scripts/setup-environment.js sala

echo.
echo ========================================
echo  Proximo passo:
echo ========================================
echo.
echo 1. Adicione imagens PNG em: public\img\sala\
echo 2. Abra o viewer: http://localhost:5173/viewer?env=sala
echo 3. Configure hotspots e portais
echo 4. Salve a configuracao
echo.
pause
