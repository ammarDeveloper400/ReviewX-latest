<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('internal_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->integer('review_cycle_month');
            $table->integer('review_cycle_year');
            $table->uuid('reviewer_user_id');
            $table->json('category_ratings'); // JSON for category ratings
            $table->text('general_feedback');
            $table->text('private_note')->nullable();
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('reviewer_user_id')->references('id')->on('users')->onDelete('cascade');
            
            $table->index(['employee_id', 'review_cycle_month', 'review_cycle_year'], 'ir_emp_month_year_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('internal_reviews');
    }
};
