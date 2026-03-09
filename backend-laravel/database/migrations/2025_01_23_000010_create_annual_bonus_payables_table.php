<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('annual_bonus_payables', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('employee_id');
            $table->date('period_start');
            $table->date('period_end');
            $table->integer('months_counted')->default(0);
            $table->decimal('annual_average_score', 3, 2)->nullable();
            $table->decimal('multiplier', 4, 2)->nullable();
            $table->string('bonus_bracket_label')->nullable();
            $table->decimal('base_salary', 15, 2)->nullable();
            $table->decimal('bonus_amount', 15, 2)->nullable();
            $table->enum('status', ['Pending', 'Paid'])->default('Pending');
            $table->timestamp('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->unique(['employee_id', 'period_start', 'period_end'], 'unique_emp_period');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('annual_bonus_payables');
    }
};
