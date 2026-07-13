<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%2314110D'/%3E%3Cpath d='M16 6v10' stroke='%23E7B23B' stroke-width='2' stroke-linecap='round'/%3E%3Ccircle cx='16' cy='5' r='2' fill='%23E7B23B'/%3E%3Cpath d='M10 14a8 8 0 0112 0' stroke='%238FAE9B' stroke-width='2' stroke-linecap='round' fill='none'/%3E%3Cpath d='M7 18a12 12 0 0118 0' stroke='%238FAE9B' stroke-width='1.5' stroke-linecap='round' fill='none' opacity='.6'/%3E%3Cpath d='M9 27l3-6h8l3 6z' fill='%23B34A16'/%3E%3C/svg%3E">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
