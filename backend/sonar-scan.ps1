Write-Host "Iniciando a analise do SonarQube..." -ForegroundColor Green
docker run --rm -v "${PWD}:/usr/src" sonarsource/sonar-scanner-cli
Write-Host "Analise concluida! Verifique o painel do SonarQube." -ForegroundColor Green
