<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MonthlyFinalReview extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'employee_id',
        'review_cycle_month',
        'review_cycle_year',
        'created_by_user_id',
        'published_by_user_id',
        'status',
        'final_category_ratings',
        'final_category_averages',
        'monthly_score',
        'cumulative_score_snapshot',
        'general_feedback',
        'included_evidence',
        'internal_review_ids',
        'published_at',
    ];

    protected $casts = [
        'final_category_ratings' => 'array',
        'final_category_averages' => 'array',
        'included_evidence' => 'array',
        'internal_review_ids' => 'array',
        'monthly_score' => 'decimal:2',
        'cumulative_score_snapshot' => 'decimal:2',
        'review_cycle_month' => 'integer',
        'review_cycle_year' => 'integer',
        'published_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function publishedBy()
    {
        return $this->belongsTo(User::class, 'published_by_user_id');
    }

    public function warnings()
    {
        return $this->hasMany(Warning::class, 'monthly_final_review_id');
    }

    public function isPublished(): bool
    {
        return $this->status === 'Published';
    }

    public function isDraft(): bool
    {
        return $this->status === 'Draft';
    }
}
