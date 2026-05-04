<?php

use Illuminate\Support\Facades\Route;




use Illuminate\Support\Facades\Artisan;


Route::get('/make-storage-link', function () {
    Artisan::call('storage:link');
    return 'Storage link created!';
});


Route::get('/clear-all-cache', function () {

    Artisan::call('cache:clear');        // Application cache
    Artisan::call('config:clear');       // Config cache
    Artisan::call('config:cache');       // Rebuild config cache
    Artisan::call('route:clear');        // Route cache
    Artisan::call('view:clear');         // View cache
    Artisan::call('optimize:clear');     // Optimization cache

    return 'All caches cleared successfully!';
});
Route::get('/{any?}', function () {
    $path = base_path('../public_html/index.html');
    abort_unless(file_exists($path), 404, 'React index.html not found');
    return response()->file($path);
})->where('any', '^(?!api).*$');