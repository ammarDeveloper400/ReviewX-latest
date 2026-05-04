<?php

namespace App\Http\Controllers;

use App\Models\AnnualBonusPayable;
use App\Models\Employee;
use App\Models\MonthlyFinalReview;
use App\Models\BonusBracket;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Carbon\Carbon;

class AnnualBonusController extends Controller
{
    /**
     * List all annual bonus payables
     */
    public function index(Request $request)
    {
        $query = AnnualBonusPayable::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('year')) {
            $year = (int) $request->year;
            $query->whereYear('period_end', $year);
        }

        if ($request->has('eligible_only') && $request->boolean('eligible_only')) {
            $query->where('months_counted', '>=', 1);
        }

        $payables = $query->orderBy('period_end', 'desc')->get();

        $result = [];
        foreach ($payables as $payable) {
            $employee = Employee::find($payable->employee_id);
            
            $result[] = array_merge($payable->toArray(), [
                'employee_name' => $employee?->full_name,
                'employee_email' => $employee?->email,
                'employee_role' => $employee?->role_type,
                'joining_date' => $employee?->joining_date,
            ]);
        }

        return response()->json($result);
    }

    /**
     * Calculate and generate annual bonus payables for eligible employees
     */
    public function calculate(Request $request)
    {
        $user = JWTAuth::parseToken()->authenticate();
        $now = Carbon::now();
        
        $employees = Employee::where('status', 'Active')->get();
        $created = 0;
        $updated = 0;

        foreach ($employees as $employee) {
            if (!$employee->joining_date) {
                continue;
            }

            $joiningDate = Carbon::parse($employee->joining_date);
            $monthsSinceJoining = $joiningDate->diffInMonths($now);

            // Skip if not yet eligible (less than 12 months)
            if ($monthsSinceJoining < 12) {
                continue;
            }

            // Calculate how many complete years
            $completeYears = floor($monthsSinceJoining / 12);

            for ($year = 1; $year <= $completeYears; $year++) {
                $periodStart = $joiningDate->copy()->addYears($year - 1);
                $periodEnd = $joiningDate->copy()->addYears($year)->subDay();

                // Check if already exists
                $existing = AnnualBonusPayable::where('employee_id', $employee->id)
                    ->where('period_start', $periodStart->format('Y-m-d'))
                    ->where('period_end', $periodEnd->format('Y-m-d'))
                    ->first();

                // Get published monthly finals in the period
                $monthlyFinals = MonthlyFinalReview::where('employee_id', $employee->id)
                    ->where('status', 'Published')
                    ->where(function ($q) use ($periodStart, $periodEnd) {
                        // Match reviews within the period
                        $q->whereRaw("(review_cycle_year * 100 + review_cycle_month) >= ?", 
                            [$periodStart->year * 100 + $periodStart->month])
                          ->whereRaw("(review_cycle_year * 100 + review_cycle_month) <= ?", 
                            [$periodEnd->year * 100 + $periodEnd->month]);
                    })
                    ->get();

                $monthsCounted = $monthlyFinals->count();
                $annualAverageScore = $monthsCounted > 0 
                    ? round($monthlyFinals->avg('monthly_score'), 2) 
                    : null;

                // Get bonus bracket
                $bracket = $annualAverageScore ? BonusBracket::getBracketForScore($annualAverageScore) : null;
                $multiplier = $bracket ? $bracket['multiplier'] : 0;
                $label = $bracket ? $bracket['label'] : 'No bonus';

                $bonusAmount = $employee->base_salary ? $employee->base_salary * $multiplier : null;

                $data = [
                    'employee_id' => $employee->id,
                    'period_start' => $periodStart->format('Y-m-d'),
                    'period_end' => $periodEnd->format('Y-m-d'),
                    'months_counted' => $monthsCounted,
                    'annual_average_score' => $annualAverageScore,
                    'multiplier' => $multiplier,
                    'bonus_bracket_label' => $label,
                    'base_salary' => $employee->base_salary,
                    'bonus_amount' => $bonusAmount,
                ];

                if ($existing) {
                    // Only update if not paid
                    if ($existing->status !== 'Paid') {
                        $existing->update($data);
                        $updated++;
                    }
                } else {
                    AnnualBonusPayable::create(array_merge($data, [
                        'status' => 'Pending',
                        'created_by' => $user->id,
                    ]));
                    $created++;
                }
            }
        }

        AuditLog::log($user->id, 'CALCULATE', 'annual_bonus', 'batch', [
            'created' => $created,
            'updated' => $updated,
        ]);

        return response()->json([
            'message' => 'Annual bonus calculation completed',
            'created' => $created,
            'updated' => $updated,
        ]);
    }

    /**
     * Get details of a specific annual bonus payable
     */
    public function show(string $id)
    {
        $payable = AnnualBonusPayable::find($id);
        if (!$payable) {
            return response()->json(['detail' => 'Annual bonus payable not found'], 404);
        }

        $employee = Employee::find($payable->employee_id);

        // Get monthly scores for the period
        $monthlyFinals = MonthlyFinalReview::where('employee_id', $payable->employee_id)
            ->where('status', 'Published')
            ->where(function ($q) use ($payable) {
                $periodStart = Carbon::parse($payable->period_start);
                $periodEnd = Carbon::parse($payable->period_end);
                $q->whereRaw("(review_cycle_year * 100 + review_cycle_month) >= ?", 
                    [$periodStart->year * 100 + $periodStart->month])
                  ->whereRaw("(review_cycle_year * 100 + review_cycle_month) <= ?", 
                    [$periodEnd->year * 100 + $periodEnd->month]);
            })
            ->orderBy('review_cycle_year')
            ->orderBy('review_cycle_month')
            ->get();

        $monthlyScores = $monthlyFinals->map(fn($f) => [
            'month' => $f->review_cycle_month,
            'year' => $f->review_cycle_year,
            'score' => (float) $f->monthly_score,
            'review_id' => $f->id,
        ]);

        return response()->json([
            'payable' => $payable,
            'employee' => [
                'id' => $employee?->id,
                'full_name' => $employee?->full_name,
                'email' => $employee?->email,
                'role_type' => $employee?->role_type,
                'joining_date' => $employee?->joining_date,
                'base_salary' => $employee?->base_salary,
            ],
            'monthly_scores' => $monthlyScores,
            'period_months' => 12,
            'months_missing' => 12 - $payable->months_counted,
        ]);
    }

    /**
     * Mark annual bonus as paid
     */
    public function markPaid(Request $request, string $id)
    {
        $payable = AnnualBonusPayable::find($id);
        if (!$payable) {
            return response()->json(['detail' => 'Annual bonus payable not found'], 404);
        }

        if ($payable->status === 'Paid') {
            return response()->json(['detail' => 'Already marked as paid'], 400);
        }

        $user = JWTAuth::parseToken()->authenticate();

        $payable->update([
            'status' => 'Paid',
            'paid_at' => now(),
            'notes' => $request->input('notes'),
        ]);

        AuditLog::log($user->id, 'MARK_PAID', 'annual_bonus', $id);

        return response()->json([
            'message' => 'Annual bonus marked as paid',
            'payable' => $payable->fresh(),
        ]);
    }

    /**
     * Get summary stats for annual bonuses
     */
    public function summary(Request $request)
    {
        $year = $request->input('year', Carbon::now()->year);

        $payables = AnnualBonusPayable::whereYear('period_end', $year)->get();

        $totalPending = $payables->where('status', 'Pending')->sum('bonus_amount');
        $totalPaid = $payables->where('status', 'Paid')->sum('bonus_amount');
        $pendingCount = $payables->where('status', 'Pending')->count();
        $paidCount = $payables->where('status', 'Paid')->count();
        $incompleteCount = $payables->where('months_counted', '<', 12)->count();

        return response()->json([
            'year' => $year,
            'total_pending_amount' => (float) $totalPending,
            'total_paid_amount' => (float) $totalPaid,
            'pending_count' => $pendingCount,
            'paid_count' => $paidCount,
            'incomplete_year_count' => $incompleteCount,
            'total_count' => $payables->count(),
        ]);
    }
}
