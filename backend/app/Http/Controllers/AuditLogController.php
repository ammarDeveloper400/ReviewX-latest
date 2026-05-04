<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user');

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }
        if ($request->has('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $logs = $query->orderBy('timestamp', 'desc')->get()->map(function ($log) {
            return [
                'id' => $log->id,
                'user_id' => $log->user_id,
                'user_email' => $log->user?->email,
                'user_role' => $log->user?->role,
                'action' => $log->action,
                'entity_type' => $log->entity_type,
                'entity_id' => $log->entity_id,
                'details' => $log->details,
                'timestamp' => $log->timestamp?->toISOString(),
                'created_at' => $log->created_at?->toISOString(),
            ];
        });

        return response()->json($logs);
    }
}
