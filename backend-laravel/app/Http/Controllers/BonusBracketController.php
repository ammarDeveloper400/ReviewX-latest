<?php

namespace App\Http\Controllers;

use App\Models\BonusBracket;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class BonusBracketController extends Controller
{
    public function index()
    {
        return response()->json(
            BonusBracket::orderBy('min_rating', 'desc')->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'min_rating' => 'required|numeric|min:0|max:5',
            'max_rating' => 'required|numeric|min:0|max:5',
            'bonus_multiplier' => 'required|numeric|min:0',
            'label' => 'required|string|max:255',
        ]);

        $user = JWTAuth::parseToken()->authenticate();

        $bracket = BonusBracket::create([
            'min_rating' => $request->min_rating,
            'max_rating' => $request->max_rating,
            'bonus_multiplier' => $request->bonus_multiplier,
            'label' => $request->label,
        ]);

        AuditLog::log($user->id, 'CREATE', 'bonus_bracket', $bracket->id);

        return response()->json($bracket);
    }

    public function update(Request $request, string $bracket_id)
    {
        $bracket = BonusBracket::find($bracket_id);
        if (!$bracket) {
            return response()->json(['detail' => 'Bonus bracket not found'], 404);
        }

        $request->validate([
            'min_rating' => 'required|numeric|min:0|max:5',
            'max_rating' => 'required|numeric|min:0|max:5',
            'bonus_multiplier' => 'required|numeric|min:0',
            'label' => 'required|string|max:255',
        ]);

        $user = JWTAuth::parseToken()->authenticate();

        $bracket->update([
            'min_rating' => $request->min_rating,
            'max_rating' => $request->max_rating,
            'bonus_multiplier' => $request->bonus_multiplier,
            'label' => $request->label,
        ]);

        AuditLog::log($user->id, 'UPDATE', 'bonus_bracket', $bracket_id);

        return response()->json($bracket->fresh());
    }

    public function destroy(string $bracket_id)
    {
        $bracket = BonusBracket::find($bracket_id);
        if (!$bracket) {
            return response()->json(['detail' => 'Bonus bracket not found'], 404);
        }

        $user = JWTAuth::parseToken()->authenticate();

        $bracket->delete();
        AuditLog::log($user->id, 'DELETE', 'bonus_bracket', $bracket_id);

        return response()->json(['message' => 'Bonus bracket deleted successfully']);
    }
}
