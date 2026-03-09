<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'ReviewX API',
        'endpoints' => [
            'POST /api/auth/login',
            'GET  /api/auth/me',
        ],
    ]);
});


use Illuminate\Support\Facades\Artisan;


Route::get('/storage-link', function () {
    Artisan::call('storage:link');
    return 'Storage link created!';
});


Route::get('/clear-all-cache', function () {
    Artisan::call('cache:clear');
    Artisan::call('config:clear');
    Artisan::call('route:clear');
    Artisan::call('view:clear');
    return '✅ All caches cleared!';
});