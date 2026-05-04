<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_final_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->integer('review_cycle_month');
            $table->integer('review_cycle_year');
            $table->uuid('created_by_user_id');
            $table->uuid('published_by_user_id')->nullable();
            $table->enum('status', ['Draft', 'Published'])->default('Draft');
            $table->json('final_category_ratings')->nullable(); // Direct ratings for the final
            $table->json('final_category_averages')->nullable(); // Aggregated from internals
            $table->decimal('monthly_score', 3, 2)->default(0.00);
            $table->decimal('cumulative_score_snapshot', 3, 2)->default(0.00);
            $table->text('general_feedback')->nullable();
            $table->json('included_evidence')->nullable();
            $table->json('internal_review_ids')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('created_by_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('published_by_user_id')->references('id')->on('users')->onDelete('set null');
            
            $table->unique(['employee_id', 'review_cycle_month', 'review_cycle_year'], 'unique_employee_month_year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_final_reviews');
    }
};
