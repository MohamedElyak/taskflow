<?php

use Illuminate\Cookie\Middleware\EncryptCookies;
use Laravel\Sanctum\Http\Middleware\AuthenticateSession;
use Laravel\Sanctum\Sanctum;

return [
    // Domains whose requests are treated as first-party SPA requests (cookie auth).
    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:5173,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
        Sanctum::currentApplicationUrlWithPort(),
    ))),

    'guard' => ['web'],
    'expiration' => null,
    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'authenticate_session' => AuthenticateSession::class,
        'encrypt_cookies' => EncryptCookies::class,
        // Class name differs between Laravel versions.
        'validate_csrf_token' => class_exists(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ? \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class
            : \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
    ],
];