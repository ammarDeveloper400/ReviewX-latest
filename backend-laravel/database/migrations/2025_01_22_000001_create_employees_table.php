<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->enum('role_type', ['Dev', 'QA', 'UI/UX', 'PM']);
            $table->string('department')->nullable();
            $table->enum('status', ['Active', 'Inactive', 'Termination Recommended', 'Terminated'])->default('Active');
            $table->date('joining_date');
            $table->string('profile_photo')->nullable();
            $table->decimal('base_salary', 15, 2)->nullable();
            $table->integer('warning_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
