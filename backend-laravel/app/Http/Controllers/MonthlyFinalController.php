<?php

namespace App\Http\Controllers;

use App\Models\MonthlyFinalReview;
use App\Models\InternalReview;
use App\Models\Employee;
use App\Models\User;
use App\Models\Category;
use App\Models\Warning;
use App\Models\SalaryPayment;
use App\Models\BonusBracket;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Carbon\Carbon;

class MonthlyFinalController extends Controller
{
    /**
     * Get PM's own reviews (My Reviews page)
     */
    public function myReviews(Request $request)
    {
        $user = JWTAuth::parseToken()->authenticate();

        if (!$user->linked_employee_id) {
            return response()->json(['detail' => 'No linked employee profile'], 400);
        }

        $query = MonthlyFinalReview::where('employee_id', $user->linked_employee_id)
            ->where('status', 'Published');

        if ($request->has('year')) {
            $query->where('review_cycle_year', $request->year);
        }

        $reviews = $query->orderBy('review_cycle_year', 'desc')
                        ->orderBy('review_cycle_month', 'desc')
                        ->get();

        // Get available years
        $availableYears = MonthlyFinalReview::where('employee_id', $user->linked_employee_id)
            ->where('status', 'Published')
            ->pluck('review_cycle_year')
            ->unique()
            ->sortDesc()
            ->values();

        // Calculate cumulative score
        $cumulativeScore = $reviews->count() > 0 
            ? round($reviews->avg('monthly_score'), 2) 
            : 0.0;

        // Get bonus bracket for cumulative score
        $bonusBracket = $cumulativeScore > 0 ? BonusBracket::getBracketForScore($cumulativeScore) : null;

        return response()->json([
            'reviews' => $reviews,
            'cumulative_score' => $cumulativeScore,
            'bonus_bracket' => $bonusBracket,
            'total_reviews' => $reviews->count(),
            'available_years' => $availableYears,
        ]);
    }

    public function index(Request $request)
    {
        $user = JWTAuth::parseToken()->authenticate();
        
        $query = MonthlyFinalReview::query();

        // Employees can only see their own published finals
        if ($user->isEmployee()) {
            $query->where('employee_id', $user->linked_employee_id)
                  ->where('status', 'Published');
        } else {
            if ($request->has('employee_id')) {
                $query->where('employee_id', $request->employee_id);
            }
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }
        }

        if ($request->has('month')) {
            $query->where('review_cycle_month', $request->month);
        }
        if ($request->has('year')) {
            $query->where('review_cycle_year', $request->year);
        }

        return response()->json(
            $query->orderBy('review_cycle_year', 'desc')
                  ->orderBy('review_cycle_month', 'desc')
                  ->get()
        );
    }

   

public function show(string $final_id)
{
    $user = JWTAuth::parseToken()->authenticate();

    $monthlyFinal = MonthlyFinalReview::find($final_id);
    if (!$monthlyFinal) {
        return response()->json(['detail' => 'Monthly final not found'], 404);
    }

    // Determine if user is viewing their own review (Employee or PM viewing own)
    $isViewingOwnReview = $user->linked_employee_id === $monthlyFinal->employee_id;
    $isEmployee = $user->isEmployee();
    
    // For Employee role, can only see own published reviews
    if ($isEmployee) {
        if (!$isViewingOwnReview) {
            return response()->json(['detail' => 'Access denied'], 403);
        }
        if ($monthlyFinal->status !== 'Published') {
            return response()->json(['detail' => 'Access denied'], 403);
        }
    }
    
    // For PM viewing their own reviews, apply employee-like privacy (can only see published)
    if ($user->isPM() && $isViewingOwnReview && $monthlyFinal->status !== 'Published') {
        return response()->json(['detail' => 'Access denied'], 403);
    }

    $employee = Employee::find($monthlyFinal->employee_id);
    $categories = Category::all()->keyBy('id');

    // Build category details from final_category_ratings only (the ratings given during final monthly review creation)
    $categoryDetails = [];
    foreach ($monthlyFinal->final_category_ratings ?? [] as $catId => $finalRating) {
        $category = $categories->get($catId);
        
        $categoryDetails[$catId] = [
            'category_id' => $catId,
            'category_title' => $category?->title ?? "Category {$catId}",
            'criteria_text' => $category?->criteria_short_text ?? '',
            'criteria_bullets' => $category?->criteria_bullets ?? '',
            'rating' => $finalRating['rating'] ?? 0,
            'comments' => [],
            'evidence' => [],
        ];

        // Include comment and evidence from final_category_ratings
        if (!empty($finalRating['comment'])) {
            $categoryDetails[$catId]['comments'][] = ['comment' => $finalRating['comment']];
        }
        if (!empty($finalRating['evidence_url']) || !empty($finalRating['evidence_note'])) {
            $categoryDetails[$catId]['evidence'][] = [
                'evidence_url' => $finalRating['evidence_url'] ?? null,
                'evidence_note' => $finalRating['evidence_note'] ?? null,
            ];
        }
        
          // Also include evidence from included_evidence array for this category
        // if (!empty($monthlyFinal->included_evidence)) {
        //     foreach ($monthlyFinal->included_evidence as $includedEvidence) {
        //         if (isset($includedEvidence['category_id']) && $includedEvidence['category_id'] == $catId) {
        //             $categoryDetails[$catId]['evidence'][] = [
        //                 'evidence_url' => $includedEvidence['evidence_url'] ?? null,
        //                 // 'evidence_note' => $includedEvidence['evidence_note'] ?? null,
        //             ];
        //         }
        //     }
        // }
    }

    // Use general_feedback from monthly_final directly
    $generalFeedbackList = [];
    if (!empty($monthlyFinal->general_feedback)) {
        $generalFeedbackList[] = ['feedback' => $monthlyFinal->general_feedback];
    }

    $response = [
        'id' => $monthlyFinal->id,
        'employee' => [
            'id' => $employee->id,
            'full_name' => $employee->full_name,
            'email' => $employee->email,
            'role_type' => $employee->role_type,
        ],
        'review_cycle_month' => $monthlyFinal->review_cycle_month,
        'review_cycle_year' => $monthlyFinal->review_cycle_year,
        'monthly_score' => (float) $monthlyFinal->monthly_score,
        'cumulative_score_snapshot' => (float) $monthlyFinal->cumulative_score_snapshot,
        'published_at' => $monthlyFinal->published_at?->toISOString(),
        'status' => $monthlyFinal->status,
        'category_details' => $categoryDetails,
        'general_feedback' => $generalFeedbackList,
    ];

    return response()->json($response);
}


    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'review_cycle_month' => 'required|integer|min:1|max:12',
            'review_cycle_year' => 'required|integer',
            'final_category_ratings' => 'required|array',
            'general_feedback' => 'required|string',
            'included_evidence' => 'nullable|array',
            'internal_review_ids' => 'nullable|array',
        ]);

        $user = JWTAuth::parseToken()->authenticate();

        // Check self-review restriction (applies to all users)
        if ($user->linked_employee_id === $request->employee_id) {
            return response()->json(['detail' => 'Cannot create/edit/delete reviews for your own employee profile'], 403);
        }

        // Check if target employee is a PM - only Admin can create monthly finals for PM profiles
        $targetEmployee = Employee::find($request->employee_id);
        if ($targetEmployee && $targetEmployee->role_type === 'PM' && !$user->isAdmin()) {
            return response()->json(['detail' => 'Only Admin can create monthly final reviews for PM profiles'], 403);
        }

        // Check if already exists
        $existing = MonthlyFinalReview::where('employee_id', $request->employee_id)
            ->where('review_cycle_month', $request->review_cycle_month)
            ->where('review_cycle_year', $request->review_cycle_year)
            ->first();

        if ($existing) {
            return response()->json(['detail' => 'A monthly final review already exists for this period'], 400);
        }

        // Validate evidence for ratings < 3
        foreach ($request->final_category_ratings as $categoryId => $rating) {
            if (($rating['rating'] ?? 5) < 3.0) {
                if (empty($rating['evidence_url']) && empty($rating['evidence_note'])) {
                    return response()->json([
                        'detail' => "Evidence required for category {$categoryId} (rating < 3)"
                    ], 400);
                }
            }
        }

        // Calculate monthly score
        $ratings = array_column($request->final_category_ratings, 'rating');
        $monthlyScore = count($ratings) > 0 ? round(array_sum($ratings) / count($ratings), 2) : 0;

        // Get internal reviews for this period
        $internalReviews = InternalReview::where('employee_id', $request->employee_id)
            ->where('review_cycle_month', $request->review_cycle_month)
            ->where('review_cycle_year', $request->review_cycle_year)
            ->get();

        $internalIds = $request->internal_review_ids ?? $internalReviews->pluck('id')->toArray();

        // Calculate final_category_averages from internals
        $finalCategoryAverages = [];
        if ($internalReviews->isNotEmpty()) {
            $categorySums = [];
            foreach ($internalReviews as $review) {
                foreach ($review->category_ratings ?? [] as $catId => $ratingObj) {
                    if (!isset($categorySums[$catId])) {
                        $categorySums[$catId] = [];
                    }
                    $categorySums[$catId][] = $ratingObj['rating'] ?? 0;
                }
            }
            foreach ($categorySums as $catId => $ratingsList) {
                $finalCategoryAverages[$catId] = round(array_sum($ratingsList) / count($ratingsList), 2);
            }
        }

        $monthlyFinal = MonthlyFinalReview::create([
            'employee_id' => $request->employee_id,
            'review_cycle_month' => $request->review_cycle_month,
            'review_cycle_year' => $request->review_cycle_year,
            'created_by_user_id' => $user->id,
            'status' => 'Draft',
            'final_category_ratings' => $request->final_category_ratings,
            'final_category_averages' => $finalCategoryAverages,
            'monthly_score' => $monthlyScore,
            'general_feedback' => $request->general_feedback,
            'included_evidence' => $request->included_evidence ?? [],
            'internal_review_ids' => $internalIds,
        ]);

        AuditLog::log($user->id, 'CREATE', 'monthly_final', $monthlyFinal->id, ['status' => 'Draft']);

        return response()->json([
            'message' => 'Monthly final review draft created',
            'id' => $monthlyFinal->id,
            'status' => 'Draft',
            'monthly_score' => $monthlyScore,
        ]);
    }

    public function update(Request $request, string $final_id)
    {
        $final = MonthlyFinalReview::find($final_id);
        if (!$final) {
            return response()->json(['detail' => 'Monthly final not found'], 404);
        }

        $user = JWTAuth::parseToken()->authenticate();

        // Check self-review restriction (applies to all users)
        if ($user->linked_employee_id === $final->employee_id) {
            return response()->json(['detail' => 'Cannot create/edit/delete reviews for your own employee profile'], 403);
        }

        // Check if target employee is a PM - only Admin can edit PM profile reviews
        $targetEmployee = Employee::find($final->employee_id);
        if ($targetEmployee && $targetEmployee->role_type === 'PM' && !$user->isAdmin()) {
            return response()->json(['detail' => 'Only Admin can edit monthly final reviews for PM profiles'], 403);
        }

        // PM cannot edit published reviews
        if ($user->isPM() && $final->status === 'Published') {
            return response()->json(['detail' => 'PM cannot edit published monthly final reviews'], 403);
        }

        $updateData = [];

        if ($request->has('final_category_ratings')) {
            // Validate evidence
            foreach ($request->final_category_ratings as $categoryId => $rating) {
                if (($rating['rating'] ?? 5) < 3.0) {
                    if (empty($rating['evidence_url']) && empty($rating['evidence_note'])) {
                        return response()->json([
                            'detail' => "Evidence required for category {$categoryId} (rating < 3)"
                        ], 400);
                    }
                }
            }

            $updateData['final_category_ratings'] = $request->final_category_ratings;
            
            // Recalculate monthly score
            $ratings = array_column($request->final_category_ratings, 'rating');
            $updateData['monthly_score'] = count($ratings) > 0 
                ? round(array_sum($ratings) / count($ratings), 2) 
                : $final->monthly_score;
        }

        if ($request->has('general_feedback')) {
            $updateData['general_feedback'] = $request->general_feedback;
        }

        if ($request->has('included_evidence')) {
            $updateData['included_evidence'] = $request->included_evidence;
        }

        $final->update($updateData);
        AuditLog::log($user->id, 'UPDATE', 'monthly_final', $final_id);

        return response()->json($final->fresh());
    }

    public function publish(string $final_id)
    {
        $final = MonthlyFinalReview::find($final_id);
        if (!$final) {
            return response()->json(['detail' => 'Monthly final not found'], 404);
        }

        $user = JWTAuth::parseToken()->authenticate();

        // Check self-review restriction (applies to all users)
        if ($user->linked_employee_id === $final->employee_id) {
            return response()->json(['detail' => 'Cannot publish reviews for your own employee profile'], 403);
        }

        // Check if target employee is a PM - only Admin can publish PM profile reviews
        $targetEmployee = Employee::find($final->employee_id);
        if ($targetEmployee && $targetEmployee->role_type === 'PM' && !$user->isAdmin()) {
            return response()->json(['detail' => 'Only Admin can publish monthly final reviews for PM profiles'], 403);
        }

        if ($final->status === 'Published') {
            return response()->json(['detail' => 'This review is already published'], 400);
        }

        // Calculate cumulative score
        $cumulativeScore = $this->calculateCumulativeScore($final->employee_id);

        $final->update([
            'status' => 'Published',
            'published_by_user_id' => $user->id,
            'published_at' => now(),
            'cumulative_score_snapshot' => $cumulativeScore,
        ]);

        // Create warning if score < 3.1
        $this->checkAndCreateWarning($final->fresh(), $user->id);

        // Create salary payment record
        $this->createSalaryPayment($final->fresh());

        AuditLog::log($user->id, 'PUBLISH', 'monthly_final', $final_id);

        return response()->json([
            'message' => 'Monthly final review published successfully',
            'id' => $final_id,
            'monthly_score' => (float) $final->monthly_score,
            'cumulative_score' => $cumulativeScore,
        ]);
    }

    public function publishLegacy(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer',
        ]);

        $user = JWTAuth::parseToken()->authenticate();

        // Check self-review restriction (applies to all users)
        if ($user->linked_employee_id === $request->employee_id) {
            return response()->json(['detail' => 'Cannot publish reviews for your own employee profile'], 403);
        }

        // Check if target employee is a PM - only Admin can publish PM profile reviews
        $targetEmployee = Employee::find($request->employee_id);
        if ($targetEmployee && $targetEmployee->role_type === 'PM' && !$user->isAdmin()) {
            return response()->json(['detail' => 'Only Admin can publish monthly final reviews for PM profiles'], 403);
        }

        // Check if already published
        $existing = MonthlyFinalReview::where('employee_id', $request->employee_id)
            ->where('review_cycle_month', $request->month)
            ->where('review_cycle_year', $request->year)
            ->where('status', 'Published')
            ->first();

        if ($existing) {
            return response()->json(['detail' => 'Monthly final already published for this period'], 400);
        }

        // Get internal reviews
        $internalReviews = InternalReview::where('employee_id', $request->employee_id)
            ->where('review_cycle_month', $request->month)
            ->where('review_cycle_year', $request->year)
            ->get();

        if ($internalReviews->isEmpty()) {
            return response()->json(['detail' => 'No internal reviews found for this period'], 400);
        }

        // Aggregate category ratings
        $categorySums = [];
        foreach ($internalReviews as $review) {
            foreach ($review->category_ratings ?? [] as $catId => $ratingObj) {
                if (!isset($categorySums[$catId])) {
                    $categorySums[$catId] = [];
                }
                $categorySums[$catId][] = $ratingObj['rating'] ?? 0;
            }
        }

        // Calculate averages
        $finalCategoryAverages = [];
        foreach ($categorySums as $catId => $ratings) {
            $finalCategoryAverages[$catId] = round(array_sum($ratings) / count($ratings), 2);
        }

        // Calculate monthly score
        $monthlyScore = count($finalCategoryAverages) > 0
            ? round(array_sum($finalCategoryAverages) / count($finalCategoryAverages), 2)
            : 0;

        // Calculate cumulative score
        $cumulativeScore = $this->calculateCumulativeScore($request->employee_id);

        $monthlyFinal = MonthlyFinalReview::create([
            'employee_id' => $request->employee_id,
            'review_cycle_month' => $request->month,
            'review_cycle_year' => $request->year,
            'created_by_user_id' => $user->id,
            'published_by_user_id' => $user->id,
            'status' => 'Published',
            'final_category_averages' => $finalCategoryAverages,
            'monthly_score' => $monthlyScore,
            'cumulative_score_snapshot' => $cumulativeScore,
            'internal_review_ids' => $internalReviews->pluck('id')->toArray(),
            'published_at' => now(),
        ]);

        AuditLog::log($user->id, 'PUBLISH', 'monthly_final', $monthlyFinal->id, [
            'employee_id' => $request->employee_id,
            'month' => $request->month,
            'year' => $request->year,
        ]);

        // Check for warnings
        $this->checkAndCreateWarning($monthlyFinal, $user->id);

        // Create salary payment
        $this->createSalaryPayment($monthlyFinal);

        return response()->json([
            'message' => 'Monthly final published successfully',
            'monthly_final_id' => $monthlyFinal->id,
            'monthly_score' => $monthlyScore,
            'internal_reviews_count' => $internalReviews->count(),
        ]);
    }

    public function destroy(string $final_id)
    {
        $final = MonthlyFinalReview::find($final_id);
        if (!$final) {
            return response()->json(['detail' => 'Monthly final not found'], 404);
        }

        $user = JWTAuth::parseToken()->authenticate();

        $final->delete();
        AuditLog::log($user->id, 'DELETE', 'monthly_final', $final_id, ['status' => $final->status]);

        return response()->json(['message' => 'Monthly final deleted successfully']);
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

    private function checkAndCreateWarning(MonthlyFinalReview $final, string $userId): void
    {
        if ((float) $final->monthly_score < 3.10) {
            $existing = Warning::where('monthly_final_review_id', $final->id)->first();
            if (!$existing) {
                Warning::create([
                    'employee_id' => $final->employee_id,
                    'monthly_final_review_id' => $final->id,
                    'warning_date' => now(),
                    'reason' => 'Monthly score below 3.1',
                    'monthly_score' => $final->monthly_score,
                    'created_by' => $userId,
                ]);

                $warningCount = Warning::where('employee_id', $final->employee_id)->count();
                
                $updateData = ['warning_count' => $warningCount];
                if ($warningCount >= 3) {
                    $updateData['status'] = 'Termination Recommended';
                }

                Employee::where('id', $final->employee_id)->update($updateData);
            }
        }
    }

    private function createSalaryPayment(MonthlyFinalReview $final): void
    {
        $existing = SalaryPayment::where('employee_id', $final->employee_id)
            ->where('month', $final->review_cycle_month)
            ->where('year', $final->review_cycle_year)
            ->first();

        if (!$existing) {
            $bonusBracket = BonusBracket::getBracketForScore((float) $final->monthly_score);
            $employee = Employee::find($final->employee_id);

            SalaryPayment::create([
                'employee_id' => $final->employee_id,
                'month' => $final->review_cycle_month,
                'year' => $final->review_cycle_year,
                'monthly_score' => $final->monthly_score,
                'bonus_multiplier' => $bonusBracket['multiplier'],
                'base_salary' => $employee?->base_salary,
                'bonus_amount' => ($employee?->base_salary ?? 0) * $bonusBracket['multiplier'],
                'payment_status' => 'Unpaid',
            ]);
        }
    }
}
