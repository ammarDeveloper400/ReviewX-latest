<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasUuids, Notifiable;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'email',
        'password',
        'role',
        'linked_employee_id',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_login_at' => 'datetime',
    ];

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'role' => $this->role,
        ];
    }

    public function linkedEmployee()
    {
        return $this->belongsTo(Employee::class, 'linked_employee_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'Admin';
    }

    public function isPM(): bool
    {
        return $this->role === 'PM';
    }

    public function isEmployee(): bool
    {
        return $this->role === 'Employee';
    }
     protected static function boot()
    {
        parent::boot();

        // When a user is deleted, delete the linked employee as well
        static::deleting(function ($user) {
            if ($user->linked_employee_id && !$user->_deleting_from_employee) {
                $employee = Employee::find($user->linked_employee_id);
                if ($employee) {
                    $employee->_deleting_from_user = true;
                    $employee->delete();
                }
            }
        });
    }
}
