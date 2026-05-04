<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\User;
use App\Models\MonthlyFinalReview;
use App\Models\InternalReview;
use App\Models\Warning;
use App\Models\BonusBracket;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = Employee::all();
        
        // Add account status for each employee
        $result = [];
        foreach ($employees as $employee) {
            $empData = $employee->toArray();
            
            // Check if employee has a linked user account
            $linkedUser = User::where('linked_employee_id', $employee->id)->first();
            
            if ($linkedUser) {
                $empData['has_account'] = true;
                $empData['account_status'] = $linkedUser->is_active ? 'Active' : 'Inactive';
                $empData['user_id'] = $linkedUser->id;
            } else {
                $empData['has_account'] = false;
                $empData['account_status'] = 'Not Created';
                $empData['user_id'] = null;
            }
            
            $result[] = $empData;
        }
        
        return response()->json($result);
    }

    public function active(Request $request)
    {
        $includeInactive = $request->boolean('include_inactive', false);
        
        $query = Employee::query();
        if (!$includeInactive) {
            $query->where('status', 'Active');
        }
        
        return response()->json($query->get());
    }

    public function show(Request $request, string $employee_id)
    {
        $user = JWTAuth::parseToken()->authenticate();
        
        if ($user->isEmployee() && $user->linked_employee_id !== $employee_id) {
            return response()->json(['detail' => 'Access denied'], 403);
        }

        $employee = Employee::find($employee_id);
        if (!$employee) {
            return response()->json(['detail' => 'Employee not found'], 404);
        }

        return response()->json($employee);
    }

    public function store(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email',
            'phone' => 'nullable|string|max:50',
            'role_type' => 'required|in:Dev,QA,UI/UX,PM',
            'department' => 'nullable|string|max:255',
            'joining_date' => 'required|date',
            'base_salary' => 'nullable|numeric|min:0',
            'password' => 'required|string|min:8',
            'password_confirmation' => 'required|string|same:password',
            'create_user_account' => 'nullable|boolean',
        ]);

        $currentUser = JWTAuth::parseToken()->authenticate();

        $employee = Employee::create($request->only([
            'full_name', 'email', 'phone', 'role_type', 'department', 'joining_date', 'base_salary'
        ]));

        AuditLog::log($currentUser->id, 'CREATE', 'employee', $employee->id);

        // Create linked user account if password provided
        $linkedUser = null;
        if ($request->filled('password')) {
            // Determine user role based on employee role_type
            $userRole = $employee->role_type === 'PM' ? 'PM' : 'Employee';
            
            $linkedUser = User::create([
                'email' => $employee->email,
                'password' => Hash::make($request->password),
                'role' => $userRole,
                'linked_employee_id' => $employee->id,
                'is_active' => true,
            ]);

            AuditLog::log($currentUser->id, 'CREATE', 'user', $linkedUser->id, [
                'linked_employee_id' => $employee->id,
                'role' => $userRole,
            ]);
        }

        return response()->json([
            'employee' => $employee,
            'user_created' => $linkedUser !== null,
            'user_id' => $linkedUser?->id,
        ]);
    }

    public function update(Request $request, string $employee_id)
    {
        $employee = Employee::find($employee_id);
        if (!$employee) {
            return response()->json(['detail' => 'Employee not found'], 404);
        }

        $request->validate([
            'full_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:employees,email,' . $employee_id,
            'phone' => 'nullable|string|max:50',
            'role_type' => 'nullable|in:Dev,QA,UI/UX,PM',
            'department' => 'nullable|string|max:255',
            'status' => 'nullable|in:Active,Inactive,Termination Recommended,Terminated',
            'base_salary' => 'nullable|numeric|min:0',
        ]);

        $user = JWTAuth::parseToken()->authenticate();

        $employee->update($request->only([
            'full_name', 'email', 'phone', 'role_type', 'department', 'status', 'base_salary'
        ]));

        AuditLog::log($user->id, 'UPDATE', 'employee', $employee_id, $request->all());

        return response()->json($employee->fresh());
    }

    public function destroy(string $employee_id)
    {
        $employee = Employee::find($employee_id);
        if (!$employee) {
            return response()->json(['detail' => 'Employee not found'], 404);
        }

        $user = JWTAuth::parseToken()->authenticate();

        $employee->delete();
        AuditLog::log($user->id, 'DELETE', 'employee', $employee_id);

        return response()->json(['message' => 'Employee deleted successfully']);
    }

    public function toggleStatus(Request $request, string $employee_id)
    {
        $employee = Employee::find($employee_id);
        if (!$employee) {
            return response()->json(['detail' => 'Employee not found'], 404);
        }

        $user = JWTAuth::parseToken()->authenticate();
        $deactivateLinkedUser = $request->boolean('deactivate_linked_user', true);

        $currentStatus = $employee->status;
        
        if ($currentStatus === 'Active') {
            $newStatus = 'Inactive';
        } elseif ($currentStatus === 'Inactive') {
            $newStatus = 'Active';
        } else {
            return response()->json([
                'detail' => "Cannot toggle status. Current status is '{$currentStatus}'. Manual update required."
            ], 400);
        }

        $employee->update(['status' => $newStatus]);

        AuditLog::log($user->id, $newStatus === 'Inactive' ? 'DEACTIVATE' : 'ACTIVATE', 'employee', $employee_id, [
            'old_status' => $currentStatus,
            'new_status' => $newStatus
        ]);

        $deactivatedUser = null;
        $activatedUser = null;

        // Handle linked user
        $linkedUser = User::where('linked_employee_id', $employee_id)->first();
        
        if ($newStatus === 'Inactive' && $deactivateLinkedUser && $linkedUser && $linkedUser->is_active) {
            $linkedUser->update(['is_active' => false]);
            $deactivatedUser = $linkedUser->email;
            AuditLog::log($user->id, 'DEACTIVATE', 'user', $linkedUser->id, [
                'reason' => 'Employee deactivated',
                'employee_id' => $employee_id
            ]);
        }

        if ($newStatus === 'Active' && $linkedUser && !$linkedUser->is_active) {
            $linkedUser->update(['is_active' => true]);
            $activatedUser = $linkedUser->email;
            AuditLog::log($user->id, 'ACTIVATE', 'user', $linkedUser->id, [
                'reason' => 'Employee activated',
                'employee_id' => $employee_id
            ]);
        }

        return response()->json([
            'message' => "Employee status changed to {$newStatus}",
            'employee' => $employee->fresh(),
            'linked_user_deactivated' => $deactivatedUser,
            'linked_user_activated' => $activatedUser
        ]);
    }

    public function performance(Request $request, string $employee_id)
    {
        $user = JWTAuth::parseToken()->authenticate();
        
        if ($user->isEmployee() && $user->linked_employee_id !== $employee_id) {
            return response()->json(['detail' => 'Access denied'], 403);
        }

        $employee = Employee::find($employee_id);
        if (!$employee) {
            return response()->json(['detail' => 'Employee not found'], 404);
        }

        $isEmployee = $user->isEmployee();
        
        $year = $request->input('year');
        $startMonth = $request->input('start_month');
        $startYear = $request->input('start_year');
        $endMonth = $request->input('end_month');
        $endYear = $request->input('end_year');

        // Clamp month values
        if ($startMonth !== null) $startMonth = max(1, min(12, (int)$startMonth));
        if ($endMonth !== null) $endMonth = max(1, min(12, (int)$endMonth));

        $useCustomRange = $startMonth !== null && $startYear !== null && 
                          $endMonth !== null && $endYear !== null;

        if ($useCustomRange) {
            $startValue = (int)$startYear * 12 + (int)$startMonth;
            $endValue = (int)$endYear * 12 + (int)$endMonth;
            if ($startValue > $endValue) {
                return response()->json(['detail' => 'Start date must be before or equal to end date'], 400);
            }
        }

        // Query monthly finals
        $query = MonthlyFinalReview::where('employee_id', $employee_id);
        if ($isEmployee) {
            $query->where('status', 'Published');
        }
        if (!$useCustomRange && $year) {
            $query->where('review_cycle_year', $year);
        }
        
        $monthlyFinals = $query->orderBy('review_cycle_year', 'desc')
                               ->orderBy('review_cycle_month', 'desc')
                               ->get();

        // Filter by custom range
        if ($useCustomRange) {
            $monthlyFinals = $monthlyFinals->filter(function ($f) use ($startValue, $endValue) {
                $fValue = $f->review_cycle_year * 12 + $f->review_cycle_month;
                return $fValue >= $startValue && $fValue <= $endValue;
            })->values();
        }

        // Calculate cumulative score
        if ($useCustomRange) {
            $publishedFinals = $monthlyFinals->where('status', 'Published');
            $cumulativeScore = $publishedFinals->count() > 0 
                ? round($publishedFinals->avg('monthly_score'), 2) 
                : 0.0;
        } else {
            $cumulativeScore = $this->calculateCumulativeScore($employee_id, $year);
        }

        $bonusBracket = $cumulativeScore > 0 ? BonusBracket::getBracketForScore($cumulativeScore) : null;

        // Get published count
        if ($useCustomRange) {
            $totalReviews = $monthlyFinals->where('status', 'Published')->count();
        } else {
            $countQuery = MonthlyFinalReview::where('employee_id', $employee_id)
                                            ->where('status', 'Published');
            if ($year) {
                $countQuery->where('review_cycle_year', $year);
            }
            $totalReviews = $countQuery->count();
        }

        $warnings = Warning::where('employee_id', $employee_id)->get();

        // Internal reviews (Admin/PM only)
        $internalReviews = [];
        if (!$isEmployee) {
            $irQuery = InternalReview::where('employee_id', $employee_id);
            if ($useCustomRange) {
                $allInternal = $irQuery->get();
                $internalReviews = $allInternal->filter(function ($ir) use ($startValue, $endValue) {
                    $irValue = $ir->review_cycle_year * 12 + $ir->review_cycle_month;
                    return $irValue >= $startValue && $irValue <= $endValue;
                })->values();
            } elseif ($year) {
                $internalReviews = $irQuery->where('review_cycle_year', $year)->get();
            } else {
                $internalReviews = $irQuery->get();
            }
        }

        // Available years
        $availableYears = MonthlyFinalReview::where('employee_id', $employee_id)
                                             ->where('status', 'Published')
                                             ->pluck('review_cycle_year')
                                             ->unique()
                                             ->sortDesc()
                                             ->values();

        return response()->json([
            'employee' => $employee,
            'cumulative_score' => $cumulativeScore,
            'bonus_bracket' => $bonusBracket,
            'total_reviews' => $totalReviews,
            'monthly_finals' => $monthlyFinals,
            'internal_reviews' => $internalReviews,
            'warnings' => $warnings,
            'warning_count' => $warnings->count(),
            'available_years' => $availableYears,
            'selected_year' => $year,
            'custom_range' => $useCustomRange ? [
                'start_month' => $startMonth,
                'start_year' => $startYear,
                'end_month' => $endMonth,
                'end_year' => $endYear,
            ] : null,
        ]);
    }

    private function calculateCumulativeScore(string $employeeId, ?int $year = null): float
    {
        $query = MonthlyFinalReview::where('employee_id', $employeeId)
                                   ->where('status', 'Published');
        if ($year) {
            $query->where('review_cycle_year', $year);
        }

        $finals = $query->get();
        if ($finals->isEmpty()) {
            return 0.0;
        }

        return round($finals->avg('monthly_score'), 2);
    }

    /**
     * Create a user account for an existing employee who doesn't have one
     */
    public function createAccount(Request $request, string $employee_id)
    {
        $request->validate([
            'password' => 'required|string|min:8',
            'password_confirmation' => 'required|string|same:password',
        ]);

        $employee = Employee::find($employee_id);
        if (!$employee) {
            return response()->json(['detail' => 'Employee not found'], 404);
        }

        // Check if employee already has an account
        $existingUser = User::where('linked_employee_id', $employee_id)->first();
        if ($existingUser) {
            return response()->json(['detail' => 'Employee already has a user account'], 400);
        }

        // Check if email is already taken by another user
        $emailTaken = User::where('email', $employee->email)->exists();
        if ($emailTaken) {
            return response()->json(['detail' => 'Email is already registered to another account'], 400);
        }

        $currentUser = JWTAuth::parseToken()->authenticate();

        // Determine user role based on employee role_type
        $userRole = $employee->role_type === 'PM' ? 'PM' : 'Employee';

        $newUser = User::create([
            'email' => $employee->email,
            'password' => Hash::make($request->password),
            'role' => $userRole,
            'linked_employee_id' => $employee->id,
            'is_active' => $employee->status === 'Active',
        ]);

        AuditLog::log($currentUser->id, 'CREATE_ACCOUNT', 'user', $newUser->id, [
            'linked_employee_id' => $employee->id,
            'employee_name' => $employee->full_name,
            'role' => $userRole,
            'created_by' => $currentUser->email,
        ]);

        return response()->json([
            'message' => 'User account created successfully',
            'user_id' => $newUser->id,
            'email' => $newUser->email,
            'role' => $newUser->role,
            'password' => $request->password, // Return password once for admin to copy
        ]);
    }
}
