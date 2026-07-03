#!/bin/sh
set -e

# Render define a porta dinamicamente via $PORT; usa 10000 como fallback local
PORT="${PORT:-10000}"
sed "s/__PORT__/${PORT}/g" /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

cd /var/www

php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf