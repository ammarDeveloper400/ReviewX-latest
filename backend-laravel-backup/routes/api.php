<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\InternalReviewController;
use App\Http\Controllers\MonthlyFinalController;
use App\Http\Controllers\BonusBracketController;
use App\Http\Controllers\SalaryPaymentController;
use App\Http\Controllers\AnnualBonusController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\WarningController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\SeedController;
use App\Http\Controllers\AuditLogController;

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Authenticated routes
Route::middleware(['jwt.auth'])->group(function () {
    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    
    // Admin-only routes
    Route::middleware(['role:Admin'])->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        
        // Admin Management (multi-admin)
        Route::get('/admins', [UserController::class, 'admins']);
        Route::post('/admins', [UserController::class, 'createAdmin']);
        
        // Users
        Route::get('/users', [UserController::class, 'index']);
        Route::put('/users/{user_id}/toggle-status', [UserController::class, 'toggleStatus']);
        Route::post('/users/{user_id}/reset-password', [UserController::class, 'resetPassword']);
        
        // Employees (CRUD)
        Route::post('/employees', [EmployeeController::class, 'store']);
        Route::put('/employees/{employee_id}', [EmployeeController::class, 'update']);
        Route::delete('/employees/{employee_id}', [EmployeeController::class, 'destroy']);
        Route::put('/employees/{employee_id}/toggle-status', [EmployeeController::class, 'toggleStatus']);
        Route::post('/employees/{employee_id}/create-account', [EmployeeController::class, 'createAccount']);
        
        // Categories (write)
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category_id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category_id}', [CategoryController::class, 'destroy']);
        
        // Bonus brackets
        Route::post('/bonus-brackets', [BonusBracketController::class, 'store']);
        Route::put('/bonus-brackets/{bracket_id}', [BonusBracketController::class, 'update']);
        Route::delete('/bonus-brackets/{bracket_id}', [BonusBracketController::class, 'destroy']);
        
        // Salary payments (legacy monthly - keep for now)
        Route::get('/salary-payments', [SalaryPaymentController::class, 'index']);
        Route::put('/salary-payments/{payment_id}', [SalaryPaymentController::class, 'update']);
        
        // Annual Bonus Payables (new anniversary-based model)
        Route::get('/annual-bonuses', [AnnualBonusController::class, 'index']);
        Route::get('/annual-bonuses/summary', [AnnualBonusController::class, 'summary']);
        Route::post('/annual-bonuses/calculate', [AnnualBonusController::class, 'calculate']);
        Route::get('/annual-bonuses/{id}', [AnnualBonusController::class, 'show']);
        Route::post('/annual-bonuses/{id}/mark-paid', [AnnualBonusController::class, 'markPaid']);
        
        // Monthly final delete (Admin only)
        Route::delete('/monthly-finals/{final_id}', [MonthlyFinalController::class, 'destroy']);
        
        // Seed data
        Route::post('/admin/seed-data', [SeedController::class, 'seed']);
        
        // Clear review data
        Route::post('/admin/clear-review-data', [SeedController::class, 'clearReviewData']);

        // Audit logs
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
    });
    
    // Admin and PM routes
    Route::middleware(['role:Admin,PM'])->group(function () {
        // Dashboard
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        
        // Internal reviews
        Route::get('/internal-reviews', [InternalReviewController::class, 'index']);
        Route::get('/internal-reviews/aggregated', [InternalReviewController::class, 'aggregated']);
        Route::get('/internal-reviews/{review_id}', [InternalReviewController::class, 'show']);
        Route::get('/internal-reviews/{review_id}/detail', [InternalReviewController::class, 'detail']);
        Route::post('/internal-reviews', [InternalReviewController::class, 'store']);
        Route::put('/internal-reviews/{review_id}', [InternalReviewController::class, 'update']);
        Route::delete('/internal-reviews/{review_id}', [InternalReviewController::class, 'destroy']);
        
        // Monthly finals (write)
        Route::post('/monthly-finals', [MonthlyFinalController::class, 'store']);
        Route::put('/monthly-finals/{final_id}', [MonthlyFinalController::class, 'update']);
        Route::post('/monthly-finals/{final_id}/publish', [MonthlyFinalController::class, 'publish']);
        Route::post('/monthly-finals/publish', [MonthlyFinalController::class, 'publishLegacy']);
        
        // Notes
        Route::post('/notes', [NoteController::class, 'store']);
        Route::get('/notes/{employee_id}', [NoteController::class, 'index']);
    });
    
    // PM-only routes (My Reviews)
    Route::middleware(['role:PM'])->group(function () {
        Route::get('/pm/my-reviews', [MonthlyFinalController::class, 'myReviews']);
    });
    
    // All authenticated users
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::get('/employees/active', [EmployeeController::class, 'active']);
    Route::get('/employees/{employee_id}', [EmployeeController::class, 'show']);
    Route::get('/employees/{employee_id}/performance', [EmployeeController::class, 'performance']);
    
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category_id}', [CategoryController::class, 'show']);
    
    Route::get('/monthly-finals', [MonthlyFinalController::class, 'index']);
    Route::get('/monthly-finals/{final_id}', [MonthlyFinalController::class, 'show']);
    
    Route::get('/bonus-brackets', [BonusBracketController::class, 'index']);
    
    Route::get('/warnings/{employee_id}', [WarningController::class, 'index']);
    
    Route::post('/upload', [UploadController::class, 'store']);
});
