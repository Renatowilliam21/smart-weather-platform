#!/bin/bash
# Inicia o ambiente local do Smart Weather Platform de forma rapida,
# com auto-correcao para o bug conhecido de "File not found" que
# acontece quando o Docker fica muito tempo parado.

set -e
cd ~/smart-weather-platform

echo "Subindo os containers..."
docker compose up -d > /dev/null 2>&1

echo "Aguardando o servidor responder..."
sleep 8

RESPOSTA=$(curl -s http://127.0.0.1:8000/up 2>/dev/null | grep -o "Application up" || true)

if [ "$RESPOSTA" != "Application up" ]; then
    echo "Primeira tentativa falhou (bug conhecido do Docker apos periodo parado)."
    echo "Recriando os containers do zero..."
    docker compose down > /dev/null 2>&1
    docker compose up -d > /dev/null 2>&1
    sleep 10
    RESPOSTA=$(curl -s http://127.0.0.1:8000/up 2>/dev/null | grep -o "Application up" || true)
fi

echo ""
if [ "$RESPOSTA" == "Application up" ]; then
    echo "✅ Sistema pronto! Acesse: http://127.0.0.1:8000"
    echo ""
    docker compose ps
else
    echo "⚠️  Algo ainda nao esta certo. Rode 'docker compose logs' para investigar."
fi
