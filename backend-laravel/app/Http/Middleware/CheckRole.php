<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = JWTAuth::parseToken()->authenticate();
        
        if (!$user) {
            return response()->json(['detail' => 'User not found'], 401);
        }
        
        if (!in_array($user->role, $roles)) {
            return response()->json(['detail' => 'Insufficient permissions'], 403);
        }

        return $next($request);
    }
}
