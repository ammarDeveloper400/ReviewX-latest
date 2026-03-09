#!/bin/bash
# Start Laravel backend (replaces FastAPI)
cd /app/backend-laravel
exec php artisan serve --host=0.0.0.0 --port=8001
