<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Employee;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class UserController extends Controller
{
    public function index()
    {
        $users = User::all();
        
        $result = [];
        foreach ($users as $user) {
            $userData = [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'linked_employee_id' => $user->linked_employee_id,
                'last_login_at' => $user->last_login_at?->toISOString(),
                'created_at' => $user->created_at->toISOString(),
            ];

            if ($user->linked_employee_id) {
                $employee = Employee::find($user->linked_employee_id);
                if ($employee) {
                    $userData['employee_name'] = $employee->full_name;
                    $userData['employee_status'] = $employee->status;
                }
            }

            $result[] = $userData;
        }

        return response()->json($result);
    }

    /**
     * List admin users only (for Admin Management page)
     */
    public function admins()
    {
        $admins = User::where('role', 'Admin')->get();
        
        return response()->json($admins->map(fn($user) => [
            'id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => $user->is_active,
            'last_login_at' => $user->last_login_at?->toISOString(),
            'created_at' => $user->created_at->toISOString(),
        ]));
    }

    /**
     * Create a new admin user
     */
    public function createAdmin(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'name' => 'nullable|string|max:255',
        ]);

        $currentUser = JWTAuth::parseToken()->authenticate();

        $admin = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'Admin',
            'is_active' => true,
        ]);

        AuditLog::log($currentUser->id, 'CREATE_ADMIN', 'user', $admin->id, [
            'email' => $admin->email,
            'created_by' => $currentUser->email,
        ]);

        return response()->json([
            'message' => 'Admin user created successfully',
            'admin' => [
                'id' => $admin->id,
                'email' => $admin->email,
                'role' => $admin->role,
                'is_active' => $admin->is_active,
                'created_at' => $admin->created_at->toISOString(),
            ],
        ]);
    }

    public function toggleStatus(Request $request, string $user_id)
    {
        $currentUser = JWTAuth::parseToken()->authenticate();

        $user = User::find($user_id);
        if (!$user) {
            return response()->json(['detail' => 'User not found'], 404);
        }

        if ($user_id === $currentUser->id) {
            return response()->json(['detail' => 'Cannot deactivate your own account'], 400);
        }

        $currentIsActive = $user->is_active;
        $newIsActive = !$currentIsActive;

        $user->update(['is_active' => $newIsActive]);

        $action = $newIsActive ? 'ACTIVATE' : 'DEACTIVATE';
        if ($user->role === 'Admin') {
            $action = $newIsActive ? 'ACTIVATE_ADMIN' : 'DEACTIVATE_ADMIN';
        }

        AuditLog::log($currentUser->id, $action, 'user', $user_id, [
            'old_status' => $currentIsActive,
            'new_status' => $newIsActive,
            'target_role' => $user->role,
        ]);

        return response()->json([
            'message' => $newIsActive ? 'User account activated' : 'User account deactivated',
            'user_id' => $user_id,
            'is_active' => $newIsActive
        ]);
    }

    /**
     * Reset a user's password (Admin only)
     * Returns the new password once for admin to copy (Option A: secure approach)
     */
    public function resetPassword(Request $request, string $user_id)
    {
        $request->validate([
            'new_password' => 'required|string|min:8',
            'new_password_confirmation' => 'required|string|same:new_password',
        ]);

        $currentUser = JWTAuth::parseToken()->authenticate();

        $user = User::find($user_id);
        if (!$user) {
            return response()->json(['detail' => 'User not found'], 404);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        // Log audit entry
        AuditLog::log($currentUser->id, 'PASSWORD_RESET', 'user', $user_id, [
            'reset_by' => $currentUser->email,
            'target_email' => $user->email,
            'target_role' => $user->role,
        ]);

        return response()->json([
            'message' => 'Password reset successfully',
            'user_id' => $user_id,
            'email' => $user->email,
            'new_password' => $request->new_password, // Return password once for admin to copy
        ]);
    }
}
