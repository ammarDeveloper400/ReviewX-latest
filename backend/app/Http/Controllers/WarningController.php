<?php

namespace App\Http\Controllers;

use App\Models\Warning;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class WarningController extends Controller
{
    public function index(string $employee_id)
    {
        $user = JWTAuth::parseToken()->authenticate();

        if ($user->isEmployee() && $user->linked_employee_id !== $employee_id) {
            return response()->json(['detail' => 'Access denied'], 403);
        }

        return response()->json(
            Warning::where('employee_id', $employee_id)->get()
        );
    }
}
