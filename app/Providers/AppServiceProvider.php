<?php

namespace App\Providers;

use App\Contracts\PaClientInterface;
use App\Encryption\Encrypter;
use App\Models\Article;
use App\Models\Document;
use App\Models\Tier;
use App\Services\GenericPaApiClient;
use App\Services\RestPaApiClient;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if ($this->app->environment('production')) {
            config([
                'session.secure' => filter_var(env('SESSION_SECURE_COOKIE', true), FILTER_VALIDATE_BOOL),
                'session.same_site' => env('SESSION_SAME_SITE', 'lax'),
            ]);
        }

        // Simulation locale : GenericPaApiClient::class
        $this->app->bind(PaClientInterface::class, RestPaApiClient::class);

        $this->app->singleton('encrypter', function ($app) {
            $config = $app->make('config')->get('app');

            $key = $config['key'];

            if (Str::startsWith($key, 'base64:')) {
                $key = base64_decode(Str::after($key, 'base64:'));
            }

            return (new Encrypter($key, $config['cipher']))
                ->previousKeys(array_map(function (string $previousKey) {
                    if (Str::startsWith($previousKey, 'base64:')) {
                        return base64_decode(Str::after($previousKey, 'base64:'));
                    }

                    return $previousKey;
                }, $config['previous_keys'] ?? []));
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (str_starts_with((string) config('app.url'), 'https://')) {
            URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);

        Route::bind('facture', fn (string $value) => Document::query()
            ->whereIn('type', [Document::TYPE_FACTURE, Document::TYPE_AVOIR])
            ->whereHas('tier')
            ->findOrFail($value));

        Route::bind('devis', fn (string $value) => Document::query()
            ->where('type', Document::TYPE_DEVIS)
            ->whereHas('tier')
            ->findOrFail($value));

        Route::bind('client', fn (string $value) => Tier::query()->findOrFail($value));

        Route::bind('article', fn (string $value) => Article::query()->findOrFail($value));
    }
}
