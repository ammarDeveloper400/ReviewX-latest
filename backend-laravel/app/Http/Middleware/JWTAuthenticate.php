<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException;
use Symfony\Component\HttpFoundation\Response;

class JWTAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            
            if (!$user) {
                return response()->json(['detail' => 'User not found'], 401);
            }
            
            if (!$user->is_active) {
                return response()->json(['detail' => 'Account is inactive'], 403);
            }
            
        } catch (TokenExpiredException $e) {
            return response()->json(['detail' => 'Token expired'], 401);
        } catch (TokenInvalidException $e) {
            return response()->json(['detail' => 'Invalid token'], 401);
        } catch (JWTException $e) {
            return response()->json(['detail' => 'Token not provided'], 401);
        }

        return $next($request);
    }
}
