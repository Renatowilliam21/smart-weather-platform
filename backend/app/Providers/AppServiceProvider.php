<?php

namespace App\Providers;

use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\Mailer\Bridge\Brevo\Transport\BrevoTransportFactory;
use Symfony\Component\Mailer\Transport\Dsn;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        date_default_timezone_set(config('app.timezone'));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Carbon::setLocale(config('app.locale'));

        Vite::prefetch(concurrency: 3);

        if ($this->app->environment('production')) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        Mail::extend('brevo', function () {
            return (new BrevoTransportFactory)->create(
                new Dsn('brevo+api', 'default', config('services.brevo.key'))
            );
        });
    }
}
