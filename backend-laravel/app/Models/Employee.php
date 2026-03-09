<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'role_type',
        'department',
        'status',
        'joining_date',
        'profile_photo',
        'base_salary',
        'warning_count',
    ];

    protected $casts = [
        'joining_date' => 'date',
        'base_salary' => 'decimal:2',
        'warning_count' => 'integer',
    ];

    public function user()
    {
        return $this->hasOne(User::class, 'linked_employee_id');
    }

    public function internalReviews()
    {
        return $this->hasMany(InternalReview::class, 'employee_id');
    }

    public function monthlyFinalReviews()
    {
        return $this->hasMany(MonthlyFinalReview::class, 'employee_id');
    }

    public function warnings()
    {
        return $this->hasMany(Warning::class, 'employee_id');
    }

    public function salaryPayments()
    {
        return $this->hasMany(SalaryPayment::class, 'employee_id');
    }

    public function notes()
    {
        return $this->hasMany(EmployeeNote::class, 'employee_id');
    }

    public function isActive(): bool
    {
        return $this->status === 'Active';
    }
    protected static function boot()
    {
        parent::boot();

        // When an employee is deleted, delete the linked user account as well
        static::deleting(function ($employee) {
            if (!$employee->_deleting_from_user) {
                $user = User::where('linked_employee_id', $employee->id)->first();
                if ($user) {
                    $user->_deleting_from_employee = true;
                    $user->delete();
                }
            }
        });
    }
}
