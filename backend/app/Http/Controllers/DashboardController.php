<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\InternalReview;
use App\Models\MonthlyFinalReview;
use App\Models\SalaryPayment;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $now = Carbon::now();
        $period = $request->input('period', 'current_month');
        $month = $request->filled('month') ? (int) $request->input('month') : null;
        $year = $request->filled('year') ? (int) $request->input('year') : null;

        if ($period === 'current_month' && $month === null && $year === null) {
            $month = $now->month;
            $year = $now->year;
        } elseif ($period === 'previous_month' && $month === null && $year === null) {
            $month = $now->month === 1 ? 12 : $now->month - 1;
            $year = $now->month === 1 ? $now->year - 1 : $now->year;
        } elseif ($period === 'this_year') {
            if ($year === null) {
                $year = $now->year;
            }
            $month = null;
        }

        $totalEmployees = Employee::count();
        $activeEmployees = Employee::where('status', 'Active')->count();
        $inactiveEmployees = $totalEmployees - $activeEmployees;
        $activeEmployeesList = Employee::where('status', 'Active')->get();

        $internalQuery = InternalReview::query();
        if ($year !== null) {
            $internalQuery->where('review_cycle_year', $year);
        }
        if ($month !== null) {
            $internalQuery->where('review_cycle_month', $month);
        }
        $internalReviewsCount = $internalQuery->count();

        $finalsQuery = MonthlyFinalReview::where('status', 'Published');
        if ($year !== null) {
            $finalsQuery->where('review_cycle_year', $year);
        }
        if ($month !== null) {
            $finalsQuery->where('review_cycle_month', $month);
        }
        $monthlyFinalsCount = $finalsQuery->count();

        $draftQuery = MonthlyFinalReview::where('status', 'Draft');
        if ($year !== null) {
            $draftQuery->where('review_cycle_year', $year);
        }
        if ($month !== null) {
            $draftQuery->where('review_cycle_month', $month);
        }
        $draftFinalsCount = $draftQuery->count();

        $internalsQuery = InternalReview::query();
        if ($year !== null) {
            $internalsQuery->where('review_cycle_year', $year);
        }
        if ($month !== null) {
            $internalsQuery->where('review_cycle_month', $month);
        }
        $employeesWithInternals = $internalsQuery->pluck('employee_id')->unique();

        $publishedFinalsQuery = MonthlyFinalReview::where('status', 'Published');
        if ($year !== null) {
            $publishedFinalsQuery->where('review_cycle_year', $year);
        }
        if ($month !== null) {
            $publishedFinalsQuery->where('review_cycle_month', $month);
        }
        $employeesWithPublishedFinals = $publishedFinalsQuery->pluck('employee_id')->unique();

        $pendingFinals = $employeesWithInternals->diff($employeesWithPublishedFinals)->count();

        $employeesWithWarnings = Employee::where('warning_count', '>=', 1)->count();

        $periodScores = $this->getEmployeePeriodScores($year, $month);

        $employeeScores = [];
        foreach ($activeEmployeesList as $employee) {
            $employeePeriodScore = $periodScores->get($employee->id);

            if ($employeePeriodScore && (float) $employeePeriodScore->average_score > 0) {
                $employeeScores[] = [
                    'employee_name' => $employee->full_name,
                    'employee_id' => $employee->id,
                    'role_type' => $employee->role_type,
                    'monthly_score' => round((float) $employeePeriodScore->average_score, 2),
                    'review_count' => (int) $employeePeriodScore->review_count,
                ];
            }
        }

        usort($employeeScores, function ($a, $b) {
            return $b['monthly_score'] <=> $a['monthly_score'];
        });

        $topPerformers = array_slice($employeeScores, 0, 5);

        $avgScoreByRole = [];
        foreach (['Dev', 'QA', 'UI/UX', 'PM'] as $role) {
            $roleEmployees = $activeEmployeesList->where('role_type', $role);

            if ($roleEmployees->isNotEmpty()) {
                $roleScores = [];

                foreach ($roleEmployees as $emp) {
                    $employeePeriodScore = $periodScores->get($emp->id);

                    if ($employeePeriodScore && (float) $employeePeriodScore->average_score > 0) {
                        $roleScores[] = (float) $employeePeriodScore->average_score;
                    }
                }

                if (!empty($roleScores)) {
                    $avgScoreByRole[$role] = round(array_sum($roleScores) / count($roleScores), 2);
                }
            }
        }

        $salaryQuery = SalaryPayment::query();
        if ($year !== null) {
            $salaryQuery->where('year', $year);
        }
        if ($month !== null) {
            $salaryQuery->where('month', $month);
        }
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

    private function getEmployeePeriodScores(?int $year = null, ?int $month = null)
    {
        $query = MonthlyFinalReview::query()
            ->select('employee_id')
            ->selectRaw('AVG(monthly_score) as average_score')
            ->selectRaw('COUNT(*) as review_count')
            ->where('status', 'Published');

        if ($year !== null) {
            $query->where('review_cycle_year', $year);
        }

        if ($month !== null) {
            $query->where('review_cycle_month', $month);
        }

        return $query
            ->groupBy('employee_id')
            ->get()
            ->keyBy('employee_id');
    }
}
