<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Warning extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'employee_id',
        'monthly_final_review_id',
        'warning_date',
        'reason',
        'monthly_score',
        'created_by',
    ];

    protected $casts = [
        'warning_date' => 'datetime',
        'monthly_score' => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function monthlyFinalReview()
    {
        return $this->belongsTo(MonthlyFinalReview::class, 'monthly_final_review_id');
    }

    public function createdByUser()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
