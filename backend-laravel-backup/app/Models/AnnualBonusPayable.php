<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AnnualBonusPayable extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'employee_id',
        'period_start',
        'period_end',
        'months_counted',
        'annual_average_score',
        'multiplier',
        'bonus_bracket_label',
        'base_salary',
        'bonus_amount',
        'status',
        'paid_at',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'months_counted' => 'integer',
        'annual_average_score' => 'decimal:2',
        'multiplier' => 'decimal:2',
        'base_salary' => 'decimal:2',
        'bonus_amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function isPaid(): bool
    {
        return $this->status === 'Paid';
    }

    public function isPending(): bool
    {
        return $this->status === 'Pending';
    }
}
