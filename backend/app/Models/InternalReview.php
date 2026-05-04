<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class InternalReview extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'employee_id',
        'review_cycle_month',
        'review_cycle_year',
        'reviewer_user_id',
        'category_ratings',
        'general_feedback',
        'private_note',
    ];

    protected $casts = [
        'category_ratings' => 'array',
        'review_cycle_month' => 'integer',
        'review_cycle_year' => 'integer',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_user_id');
    }

    public function getAverageScoreAttribute(): float
    {
        $ratings = $this->category_ratings ?? [];
        if (empty($ratings)) {
            return 0.0;
        }

        $scores = array_map(fn($r) => $r['rating'] ?? 0, $ratings);
        return round(array_sum($scores) / count($scores), 2);
    }
}
