#!/usr/bin/env bash
# =============================================================================
# install-redis.sh
# Script d'installation et de démarrage de Redis pour le projet
# =============================================================================

set -e

echo "=== Installation / démarrage de Redis via Docker ==="

# 1. Vérification de Docker
if ! command -v docker &> /dev/null; then
    echo "Docker n'est pas installé. Installation en cours (Debian/Ubuntu)..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
else
    echo "Docker est déjà installé : $(docker --version)"
fi

# 2. Vérification de docker compose (plugin v2)
if ! docker compose version &> /dev/null; then
    echo "Le plugin 'docker compose' est introuvable. Veuillez installer docker-compose-plugin."
    exit 1
fi

# 3. Fichier .env pour le mot de passe Redis
if [ ! -f .env ]; then
    echo "REDIS_PASSWORD=redispass" > .env
    echo "Fichier .env créé avec un mot de passe Redis par défaut (à modifier en production)."
fi

# 4. Démarrage des conteneurs
echo "Démarrage de Redis et de l'interface d'administration (redis-commander)..."
docker compose up -d

# 5. Attente que Redis soit prêt
echo "Attente de la disponibilité de Redis..."
until docker exec session-redis redis-cli -a "${REDIS_PASSWORD:-redispass}" ping 2>/dev/null | grep -q PONG; do
    sleep 1
done

echo ""
echo "=== Redis est opérationnel ==="
echo "Redis          : localhost:6379 (mot de passe dans .env)"
echo "Redis Commander : http://localhost:8081 (visualisation temps réel des clés)"
echo ""
echo "Test manuel rapide :"
echo "  docker exec -it session-redis redis-cli -a redispass"
echo "  > SET test \"hello\""
echo "  > GET test"
echo "  > EXPIRE test 10"
echo "  > TTL test"
