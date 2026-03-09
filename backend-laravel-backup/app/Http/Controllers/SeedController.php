<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Employee;
use App\Models\Category;
use App\Models\BonusBracket;
use App\Models\InternalReview;
use App\Models\MonthlyFinalReview;
use App\Models\SalaryPayment;
use App\Models\Warning;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class SeedController extends Controller
{
    public function seed()
    {
        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        // Clear existing data
        Warning::truncate();
        SalaryPayment::truncate();
        MonthlyFinalReview::truncate();
        InternalReview::truncate();
        BonusBracket::truncate();
        Category::truncate();
        User::where('role', '!=', 'Admin')->delete();
        Employee::truncate();
        
        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
        
        // Ensure admin exists
        $admin = User::where('email', 'admin@reviewsystem.com')->first();
        if (!$admin) {
            $admin = User::create([
                'email' => 'admin@reviewsystem.com',
                'password' => Hash::make('admin123'),
                'role' => 'Admin',
                'is_active' => true,
            ]);
        }

        // Create categories
        $categories = [
            ['title' => 'Communication Skills', 'criteria_short_text' => 'Ability to communicate effectively', 'criteria_bullets' => "• Clear verbal communication\n• Effective written communication\n• Active listening skills\n• Presenting ideas clearly"],
            ['title' => 'Technical Proficiency', 'criteria_short_text' => 'Technical skills and knowledge', 'criteria_bullets' => "• Expertise in relevant technologies\n• Problem-solving abilities\n• Code quality (if applicable)\n• Continuous learning"],
            ['title' => 'Team Collaboration', 'criteria_short_text' => 'Working with team members', 'criteria_bullets' => "• Contributing to team goals\n• Helping colleagues\n• Sharing knowledge\n• Conflict resolution"],
            ['title' => 'Work Quality', 'criteria_short_text' => 'Quality of deliverables', 'criteria_bullets' => "• Attention to detail\n• Meeting requirements\n• Error-free work\n• Documentation"],
            ['title' => 'Initiative & Innovation', 'criteria_short_text' => 'Proactive approach and new ideas', 'criteria_bullets' => "• Taking initiative\n• Suggesting improvements\n• Creative problem-solving\n• Adapting to change"],
        ];

        $categoryIds = [];
        foreach ($categories as $index => $cat) {
            $category = Category::create([
                'title' => $cat['title'],
                'criteria_short_text' => $cat['criteria_short_text'],
                'criteria_bullets' => $cat['criteria_bullets'],
                'is_enabled' => true,
                'display_order' => $index,
            ]);
            $categoryIds[] = $category->id;
        }

        // Create bonus brackets
        $brackets = [
            ['min_rating' => 4.60, 'max_rating' => 5.00, 'bonus_multiplier' => 2.0, 'label' => '2 salaries'],
            ['min_rating' => 4.10, 'max_rating' => 4.59, 'bonus_multiplier' => 1.5, 'label' => '1.5 salaries'],
            ['min_rating' => 3.60, 'max_rating' => 4.09, 'bonus_multiplier' => 1.0, 'label' => '1 salary'],
            ['min_rating' => 3.10, 'max_rating' => 3.59, 'bonus_multiplier' => 0.5, 'label' => 'Half salary'],
        ];

        foreach ($brackets as $bracket) {
            BonusBracket::create($bracket);
        }

        // Create employees
        $employeesData = [
            ['full_name' => 'Ali Hassan', 'email' => 'ali.hassan@company.com', 'role_type' => 'Dev', 'base_salary' => 50000],
            ['full_name' => 'Fatima Ahmed', 'email' => 'fatima.ahmed@company.com', 'role_type' => 'Dev', 'base_salary' => 55000],
            ['full_name' => 'Ahmed Khan', 'email' => 'ahmed.khan@company.com', 'role_type' => 'QA', 'base_salary' => 45000],
            ['full_name' => 'Sara Malik', 'email' => 'sara.malik@company.com', 'role_type' => 'UI/UX', 'base_salary' => 52000],
            ['full_name' => 'Usman Tariq', 'email' => 'usman.tariq@company.com', 'role_type' => 'Dev', 'base_salary' => 48000],
            ['full_name' => 'Ayesha Siddiqui', 'email' => 'ayesha.siddiqui@company.com', 'role_type' => 'QA', 'base_salary' => 46000],
            ['full_name' => 'Bilal Hussain', 'email' => 'bilal.hussain@company.com', 'role_type' => 'PM', 'base_salary' => 70000],
            ['full_name' => 'Zainab Khan', 'email' => 'zainab.khan@company.com', 'role_type' => 'Dev', 'base_salary' => 53000],
            ['full_name' => 'Hassan Ali', 'email' => 'hassan.ali@company.com', 'role_type' => 'UI/UX', 'base_salary' => 50000],
            ['full_name' => 'Mariam Fatima', 'email' => 'mariam.fatima@company.com', 'role_type' => 'Dev', 'base_salary' => 54000],
        ];

        $employees = [];
        foreach ($employeesData as $index => $empData) {
            $emp = Employee::create([
                'full_name' => $empData['full_name'],
                'email' => $empData['email'],
                'phone' => '+92' . rand(3000000000, 3499999999),
                'role_type' => $empData['role_type'],
                'department' => 'Engineering',
                'status' => 'Active',
                'joining_date' => now()->subMonths(rand(6, 24)),
                'base_salary' => $empData['base_salary'],
            ]);
            $employees[] = $emp;
        }

        // Create PM user (linked to Bilal)
        $pmEmployee = $employees[6]; // Bilal Hussain
        $pmUser = User::create([
            'email' => 'pm@reviewsystem.com',
            'password' => Hash::make('pm123'),
            'role' => 'PM',
            'linked_employee_id' => $pmEmployee->id,
            'is_active' => true,
        ]);

        // Create Employee users
        User::create([
            'email' => $employees[0]->email,
            'password' => Hash::make('employee123'),
            'role' => 'Employee',
            'linked_employee_id' => $employees[0]->id,
            'is_active' => true,
        ]);

        User::create([
            'email' => $employees[1]->email,
            'password' => Hash::make('employee123'),
            'role' => 'Employee',
            'linked_employee_id' => $employees[1]->id,
            'is_active' => true,
        ]);

        // Generate internal reviews and monthly finals for 2025 (Aug-Dec)
        $internalCount = 0;
        $finalsCount = 0;
        $salaryCount = 0;

        foreach ([8, 9, 10, 11, 12] as $month) {
            foreach ($employees as $index => $employee) {
                if ($index == 6) continue; // Skip PM for now

                // Create internal reviews (1-2 per employee per month)
                $numReviews = rand(1, 2);
                for ($r = 0; $r < $numReviews; $r++) {
                    $categoryRatings = [];
                    foreach ($categoryIds as $catId) {
                        $rating = round(rand(28, 50) / 10, 2);
                        $categoryRatings[$catId] = [
                            'rating' => $rating,
                            'comment' => $this->generateComment($rating),
                            'evidence_url' => $rating < 3 ? '/uploads/evidence.pdf' : null,
                            'evidence_note' => $rating < 3 ? 'Needs improvement documentation' : null,
                        ];
                    }

                    InternalReview::create([
                        'employee_id' => $employee->id,
                        'review_cycle_month' => $month,
                        'review_cycle_year' => 2025,
                        'reviewer_user_id' => $r == 0 ? $admin->id : $pmUser->id,
                        'category_ratings' => $categoryRatings,
                        'general_feedback' => "Overall performance feedback for {$employee->full_name} in month {$month}.",
                    ]);
                    $internalCount++;
                }

                // Create monthly final
                $categoryAverages = [];
                $allScores = [];
                foreach ($categoryIds as $catId) {
                    $avg = round(rand(30, 48) / 10, 2);
                    $categoryAverages[$catId] = $avg;
                    $allScores[] = $avg;
                }

                $monthlyScore = round(array_sum($allScores) / count($allScores), 2);

                $final = MonthlyFinalReview::create([
                    'employee_id' => $employee->id,
                    'review_cycle_month' => $month,
                    'review_cycle_year' => 2025,
                    'created_by_user_id' => $admin->id,
                    'published_by_user_id' => $admin->id,
                    'status' => 'Published',
                    'final_category_averages' => $categoryAverages,
                    'monthly_score' => $monthlyScore,
                    'cumulative_score_snapshot' => $monthlyScore,
                    'published_at' => now()->subMonths(12 - $month),
                ]);
                $finalsCount++;

                // Create salary payment
                $bracket = BonusBracket::getBracketForScore($monthlyScore);
                SalaryPayment::create([
                    'employee_id' => $employee->id,
                    'month' => $month,
                    'year' => 2025,
                    'monthly_score' => $monthlyScore,
                    'bonus_multiplier' => $bracket['multiplier'],
                    'base_salary' => $employee->base_salary,
                    'bonus_amount' => $employee->base_salary * $bracket['multiplier'],
                    'payment_status' => $month < 11 ? 'Paid' : 'Unpaid',
                    'paid_date' => $month < 11 ? now()->subMonths(12 - $month) : null,
                ]);
                $salaryCount++;

                // Create warning if score < 3.1
                if ($monthlyScore < 3.10) {
                    Warning::create([
                        'employee_id' => $employee->id,
                        'monthly_final_review_id' => $final->id,
                        'warning_date' => now()->subMonths(12 - $month),
                        'reason' => 'Monthly score below 3.1',
                        'monthly_score' => $monthlyScore,
                        'created_by' => $admin->id,
                    ]);

                    $warningCount = Warning::where('employee_id', $employee->id)->count();
                    Employee::where('id', $employee->id)->update([
                        'warning_count' => $warningCount,
                        'status' => $warningCount >= 3 ? 'Termination Recommended' : 'Active',
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Test data seeded successfully',
            'created' => [
                'internal_reviews' => $internalCount,
                'monthly_finals' => $finalsCount,
                'salary_payments' => $salaryCount,
            ],
        ]);
    }

    private function generateComment(float $rating): string
    {
        if ($rating >= 4.5) {
            return 'Excellent performance! Exceeds expectations consistently.';
        } elseif ($rating >= 3.5) {
            return 'Good performance. Meets expectations with some areas of strength.';
        } elseif ($rating >= 3.0) {
            return 'Satisfactory performance. Meets basic expectations.';
        } else {
            return 'Needs improvement. Below expectations in some areas.';
        }
    }

    /**
     * Clear all review data but keep categories and bonus brackets
     */
    public function clearReviewData()
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        // Clear review-related data
        Warning::truncate();
        SalaryPayment::truncate();
        MonthlyFinalReview::truncate();
        InternalReview::truncate();
        
        // Also clear annual bonus payables
        DB::table('annual_bonus_payables')->truncate();
        
        // Reset employee warning counts
        Employee::query()->update(['warning_count' => 0, 'status' => 'Active']);
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        return response()->json([
            'message' => 'Review data cleared successfully',
            'preserved' => [
                'categories' => Category::count(),
                'bonus_brackets' => BonusBracket::count(),
                'employees' => Employee::count(),
                'users' => User::count(),
            ],
        ]);
    }
}
