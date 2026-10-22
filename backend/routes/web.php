<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'name' => config('app.name'),
    'message' => 'TaskFlow API is running. Open the React app at '.config('app.frontend_url'),
]));
