<?php

namespace App\Http\Controllers;

use App\Models\EmployeeNote;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class NoteController extends Controller
{
    public function index(string $employee_id)
    {
        return response()->json(
            EmployeeNote::where('employee_id', $employee_id)
                ->orderBy('note_date', 'desc')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'note_text' => 'required|string',
        ]);

        $user = JWTAuth::parseToken()->authenticate();

        $note = EmployeeNote::create([
            'employee_id' => $request->employee_id,
            'author_user_id' => $user->id,
            'note_text' => $request->note_text,
            'note_date' => now(),
        ]);

        AuditLog::log($user->id, 'CREATE', 'employee_note', $note->id);

        return response()->json($note);
    }
}
