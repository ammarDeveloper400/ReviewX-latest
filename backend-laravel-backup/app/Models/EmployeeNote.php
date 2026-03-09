<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EmployeeNote extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'employee_id',
        'author_user_id',
        'note_text',
        'attachments',
        'note_date',
    ];

    protected $casts = [
        'attachments' => 'array',
        'note_date' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_user_id');
    }
}
