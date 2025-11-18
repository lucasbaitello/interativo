@echo off

git add -A
git commit -m "chore: update and deploy ai"
git push -u origin main
pause

echo Push concluido com sucesso.
pause