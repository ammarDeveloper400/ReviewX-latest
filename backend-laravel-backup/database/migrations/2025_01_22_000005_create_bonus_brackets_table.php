<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bonus_brackets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->decimal('min_rating', 3, 2);
            $table->decimal('max_rating', 3, 2);
            $table->decimal('bonus_multiplier', 4, 2);
            $table->string('label');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bonus_brackets');
    }
};
