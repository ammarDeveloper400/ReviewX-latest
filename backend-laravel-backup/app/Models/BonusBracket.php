<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BonusBracket extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'min_rating',
        'max_rating',
        'bonus_multiplier',
        'label',
    ];

    protected $casts = [
        'min_rating' => 'decimal:2',
        'max_rating' => 'decimal:2',
        'bonus_multiplier' => 'decimal:2',
    ];

    public static function getBracketForScore(float $score): ?array
    {
        $bracket = self::where('min_rating', '<=', $score)
            ->where('max_rating', '>=', $score)
            ->first();

        if ($bracket) {
            return [
                'multiplier' => (float) $bracket->bonus_multiplier,
                'label' => $bracket->label,
                'min' => (float) $bracket->min_rating,
                'max' => (float) $bracket->max_rating,
            ];
        }

        return ['multiplier' => 0.0, 'label' => 'No bonus', 'min' => 0.0, 'max' => 3.09];
    }
}
