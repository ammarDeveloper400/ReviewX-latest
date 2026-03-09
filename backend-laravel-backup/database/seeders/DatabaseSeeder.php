<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create admin user
        User::create([
            'email' => 'admin@reviewsystem.com',
            'password' => Hash::make('admin123'),
            'role' => 'Admin',
            'is_active' => true,
        ]);
    }
}
