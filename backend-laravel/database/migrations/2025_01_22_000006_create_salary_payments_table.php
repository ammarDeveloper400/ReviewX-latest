<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salary_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->integer('month');
            $table->integer('year');
            $table->decimal('monthly_score', 3, 2);
            $table->decimal('bonus_multiplier', 4, 2);
            $table->decimal('base_salary', 15, 2)->nullable();
            $table->decimal('bonus_amount', 15, 2)->nullable();
            $table->enum('payment_status', ['Unpaid', 'Paid'])->default('Unpaid');
            $table->timestamp('paid_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->unique(['employee_id', 'month', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_payments');
    }
};
