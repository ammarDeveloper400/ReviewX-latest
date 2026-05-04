<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SalaryPayment extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'employee_id',
        'month',
        'year',
        'monthly_score',
        'bonus_multiplier',
        'base_salary',
        'bonus_amount',
        'payment_status',
        'paid_date',
        'notes',
    ];

    protected $casts = [
        'month' => 'integer',
        'year' => 'integer',
        'monthly_score' => 'decimal:2',
        'bonus_multiplier' => 'decimal:2',
        'base_salary' => 'decimal:2',
        'bonus_amount' => 'decimal:2',
        'paid_date' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function isPaid(): bool
    {
        return $this->payment_status === 'Paid';
    }
}
