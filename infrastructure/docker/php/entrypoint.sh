#!/bin/sh
set -e

# Gera a key apenas se estiver vazia
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

php artisan config:cache
php artisan migrate --force

exec php-fpm