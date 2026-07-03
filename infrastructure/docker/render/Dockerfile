# ===== Stage 1: build dos assets front-end (React/Vite) =====
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/resources ./resources
COPY backend/vite.config.js ./
COPY backend/tailwind.config.js ./
COPY backend/postcss.config.js ./
COPY backend/public ./public
RUN npm run build

# ===== Stage 2: imagem final (PHP-FPM + Nginx + Supervisor) =====
FROM php:8.3-fpm

RUN apt-get update && apt-get install -y \
    git curl unzip zip nano \
    libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
    libzip-dev libonig-dev libxml2-dev libicu-dev libpq-dev \
    nginx supervisor \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-configure intl \
    && pecl install redis && docker-php-ext-enable redis \
    && docker-php-ext-install pdo pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip intl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --optimize-autoloader

COPY backend/ .
COPY --from=frontend-build /app/public/build ./public/build

RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/testing storage/framework/views storage/logs bootstrap/cache \
    && composer dump-autoload --optimize \
    && chown -R www-data:www-data /var/www \
    && chmod -R 775 storage bootstrap/cache

COPY infrastructure/docker/render/nginx.conf.template /etc/nginx/nginx.conf.template
COPY infrastructure/docker/render/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY infrastructure/docker/render/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 10000

ENTRYPOINT ["/entrypoint.sh"]