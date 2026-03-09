<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\InternalReview;
use App\Models\MonthlyFinalReview;
use App\Models\SalaryPayment;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $now = Carbon::now();
        $period = $request->input('period', 'current_month');
        $month = $request->input('month');
        $year = $request->input('year');

        if ($period === 'current_month' && !$month && !$year) {
            $month = $now->month;
            $year = $now->year;
        } elseif ($period === 'previous_month' && !$month && !$year) {
            $month = $now->month === 1 ? 12 : $now->month - 1;
            $year = $now->month === 1 ? $now->year - 1 : $now->year;
        } elseif ($period === 'this_year' && !$year) {
            $year = $now->year;
            $month = null;
        }

        // Total employees
        $totalEmployees = Employee::count();
        $activeEmployees = Employee::where('status', 'Active')->count();
        $inactiveEmployees = $totalEmployees - $activeEmployees;

        // Internal reviews count
        $internalQuery = InternalReview::query();
        if ($year) $internalQuery->where('review_cycle_year', $year);
        if ($month) $internalQuery->where('review_cycle_month', $month);
        $internalReviewsCount = $internalQuery->count();

        // Monthly finals count (published)
        $finalsQuery = MonthlyFinalReview::where('status', 'Published');
        if ($year) $finalsQuery->where('review_cycle_year', $year);
        if ($month) $finalsQuery->where('review_cycle_month', $month);
        $monthlyFinalsCount = $finalsQuery->count();

        // Draft finals count
        $draftQuery = MonthlyFinalReview::where('status', 'Draft');
        if ($year) $draftQuery->where('review_cycle_year', $year);
        if ($month) $draftQuery->where('review_cycle_month', $month);
        $draftFinalsCount = $draftQuery->count();

        // Pending finals
        $internalsQuery = InternalReview::query();
        if ($year) $internalsQuery->where('review_cycle_year', $year);
        if ($month) $internalsQuery->where('review_cycle_month', $month);
        $employeesWithInternals = $internalsQuery->pluck('employee_id')->unique();

        $publishedFinalsQuery = MonthlyFinalReview::where('status', 'Published');
        if ($year) $publishedFinalsQuery->where('review_cycle_year', $year);
        if ($month) $publishedFinalsQuery->where('review_cycle_month', $month);
        $employeesWithPublishedFinals = $publishedFinalsQuery->pluck('employee_id')->unique();

        $pendingFinals = $employeesWithInternals->diff($employeesWithPublishedFinals)->count();

        // Employees with warnings
        $employeesWithWarnings = Employee::where('warning_count', '>=', 1)->count();

        // Top performers
        $topFinalsQuery = MonthlyFinalReview::where('status', 'Published');
        if ($year) $topFinalsQuery->where('review_cycle_year', $year);
        if ($month) $topFinalsQuery->where('review_cycle_month', $month);
        $topFinals = $topFinalsQuery->orderBy('monthly_score', 'desc')->limit(5)->get();

        $topPerformers = [];
        foreach ($topFinals as $final) {
            $employee = Employee::find($final->employee_id);
            if ($employee) {
                $topPerformers[] = [
                    'employee_name' => $employee->full_name,
                    'employee_id' => $employee->id,
                    'role_type' => $employee->role_type,
                    'monthly_score' => (float) $final->monthly_score,
                ];
            }
        }

        // Average score by role
        $activeEmployeesList = Employee::where('status', 'Active')->get();
        $avgScoreByRole = [];

        foreach (['Dev', 'QA', 'UI/UX', 'PM'] as $role) {
            $roleEmployees = $activeEmployeesList->where('role_type', $role);
            if ($roleEmployees->isNotEmpty()) {
                $roleScores = [];
                foreach ($roleEmployees as $emp) {
                    $cumulativeScore = $this->calculateCumulativeScore($emp->id, $year);
                    if ($cumulativeScore > 0) {
                        $roleScores[] = $cumulativeScore;
                    }
                }
                if (!empty($roleScores)) {
                    $avgScoreByRole[$role] = round(array_sum($roleScores) / count($roleScores), 2);
                }
            }
        }

        // Salary payable stats
        $salaryQuery = SalaryPayment::query();
        if ($year) $salaryQuery->where('year', $year);
        if ($month) $salaryQuery->where('month', $month);
        $salaryPayments = $salaryQuery->get();

        $totalBonusPayable = $salaryPayments->sum('bonus_amount');
        $unpaidCount = $salaryPayments->where('payment_status', 'Unpaid')->count();
        $paidCount = $salaryPayments->where('payment_status', 'Paid')->count();

        return response()->json([
            'total_employees' => $totalEmployees,
            'active_employees' => $activeEmployees,
            'inactive_employees' => $inactiveEmployees,
            'internal_reviews_count' => $internalReviewsCount,
            'monthly_finals_count' => $monthlyFinalsCount,
            'draft_finals_count' => $draftFinalsCount,
            'pending_finals' => $pendingFinals,
            'employees_with_warnings' => $employeesWithWarnings,
            'top_performers' => $topPerformers,
            'avg_score_by_role' => $avgScoreByRole,
            'total_bonus_payable' => (float) $totalBonusPayable,
            'unpaid_bonuses_count' => $unpaidCount,
            'paid_bonuses_count' => $paidCount,
            'period_month' => $month,
            'period_year' => $year,
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
}
