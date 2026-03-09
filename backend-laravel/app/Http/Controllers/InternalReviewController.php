<?php

namespace App\Http\Controllers;

use App\Models\InternalReview;
use App\Models\MonthlyFinalReview;
use App\Models\Employee;
use App\Models\User;
use App\Models\Category;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Carbon\Carbon;

class InternalReviewController extends Controller
{
    public function index(Request $request)
    {
        $query = InternalReview::query();

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }
        if ($request->has('month')) {
            $query->where('review_cycle_month', $request->month);
        }
        if ($request->has('year')) {
            $query->where('review_cycle_year', $request->year);
        }
        if ($request->has('reviewer_id')) {
            $query->where('reviewer_user_id', $request->reviewer_id);
        }

        return response()->json($query->get());
    }

    public function aggregated(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|uuid',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer',
        ]);

        $user = JWTAuth::parseToken()->authenticate();
        $employeeId = $request->employee_id;

        // Check self-review restriction
        if ($user->isPM() && $user->linked_employee_id === $employeeId) {
            return response()->json(['detail' => 'Cannot create/edit/delete reviews for your own employee profile'], 403);
        }

        $internalReviews = InternalReview::where('employee_id', $employeeId)
            ->where('review_cycle_month', $request->month)
            ->where('review_cycle_year', $request->year)
            ->get();

        if ($internalReviews->isEmpty()) {
            return response()->json([
                'internal_reviews' => [],
                'aggregated_scores' => (object)[],
                'all_comments' => (object)[],
                'all_evidence' => (object)[],
                'all_general_feedback' => [],
                'overall_avg_score' => 0
            ]);
        }

        // Get categories
        $categories = Category::all()->keyBy('id');

        // Get reviewer info
        $reviewerIds = $internalReviews->pluck('reviewer_user_id')->unique();
        $reviewersMap = User::whereIn('id', $reviewerIds)->get()->keyBy('id');

        // Aggregate data
        $categoryRatingsSum = [];
        $allComments = [];
        $allEvidence = [];
        $allGeneralFeedback = [];

        foreach ($internalReviews as $review) {
            $reviewer = $reviewersMap->get($review->reviewer_user_id);
            $reviewerInfo = $reviewer ? [
                'email' => $reviewer->email,
                'role' => $reviewer->role
            ] : ['email' => 'Unknown', 'role' => 'Unknown'];

            // Add general feedback
            if ($review->general_feedback) {
                $allGeneralFeedback[] = [
                    'feedback' => $review->general_feedback,
                    'reviewer_id' => $review->reviewer_user_id,
                    'reviewer_email' => $reviewerInfo['email'],
                    'internal_review_id' => $review->id,
                    'created_at' => $review->created_at->toISOString(),
                ];
            }

            foreach ($review->category_ratings ?? [] as $catId => $ratingObj) {
                // Aggregate scores
                if (!isset($categoryRatingsSum[$catId])) {
                    $categoryRatingsSum[$catId] = [];
                }
                $categoryRatingsSum[$catId][] = $ratingObj['rating'] ?? 0;

                // Collect comments
                if (!isset($allComments[$catId])) {
                    $allComments[$catId] = [];
                }
                if (!empty($ratingObj['comment'])) {
                    $allComments[$catId][] = [
                        'comment' => $ratingObj['comment'],
                        'reviewer_id' => $review->reviewer_user_id,
                        'reviewer_email' => $reviewerInfo['email'],
                        'internal_review_id' => $review->id,
                    ];
                }

                // Collect evidence
                if (!isset($allEvidence[$catId])) {
                    $allEvidence[$catId] = [];
                }
                if (!empty($ratingObj['evidence_url']) || !empty($ratingObj['evidence_note'])) {
                    $allEvidence[$catId][] = [
                        'evidence_url' => $ratingObj['evidence_url'] ?? null,
                        'evidence_note' => $ratingObj['evidence_note'] ?? null,
                        'reviewer_id' => $review->reviewer_user_id,
                        'reviewer_email' => $reviewerInfo['email'],
                        'internal_review_id' => $review->id,
                    ];
                }
            }
        }

        // Calculate aggregated scores
        $aggregatedScores = [];
        foreach ($categoryRatingsSum as $catId => $ratings) {
            $category = $categories->get($catId);
            $aggregatedScores[$catId] = [
                'avg_rating' => round(array_sum($ratings) / count($ratings), 2),
                'ratings_count' => count($ratings),
                'individual_ratings' => $ratings,
                'category_title' => $category?->title ?? "Category {$catId}",
                'criteria_text' => $category?->criteria_short_text ?? '',
                'criteria_bullets' => $category?->criteria_bullets ?? '',
            ];
        }

        // Format internal reviews
        $formattedReviews = [];
        foreach ($internalReviews as $review) {
            $reviewer = $reviewersMap->get($review->reviewer_user_id);
            $ratings = $review->category_ratings ?? [];
            $avgScore = count($ratings) > 0 
                ? round(array_sum(array_column($ratings, 'rating')) / count($ratings), 2)
                : 0;

            $formattedReviews[] = array_merge($review->toArray(), [
                'reviewer_email' => $reviewer?->email ?? 'Unknown',
                'reviewer_role' => $reviewer?->role ?? 'Unknown',
                'avg_score' => $avgScore,
            ]);
        }

        $overallAvgScore = count($aggregatedScores) > 0
            ? round(array_sum(array_column($aggregatedScores, 'avg_rating')) / count($aggregatedScores), 2)
            : 0;

        return response()->json([
            'internal_reviews' => $formattedReviews,
            'aggregated_scores' => empty($aggregatedScores) ? (object)[] : $aggregatedScores,
            'all_comments' => empty($allComments) ? (object)[] : $allComments,
            'all_evidence' => empty($allEvidence) ? (object)[] : $allEvidence,
            'all_general_feedback' => $allGeneralFeedback,
            'overall_avg_score' => $overallAvgScore,
        ]);
    }

    public function show(string $review_id)
    {
        $review = InternalReview::find($review_id);
        if (!$review) {
            return response()->json(['detail' => 'Internal review not found'], 404);
        }

        return response()->json($review);
    }

    public function detail(string $review_id)
    {
        $user = JWTAuth::parseToken()->authenticate();

        if ($user->isEmployee()) {
            return response()->json(['detail' => 'Access denied'], 403);
        }

        $review = InternalReview::find($review_id);
        if (!$review) {
            return response()->json(['detail' => 'Internal review not found'], 404);
        }

        $employee = Employee::find($review->employee_id);
        if (!$employee) {
            return response()->json(['detail' => 'Employee not found'], 404);
        }

        $reviewer = User::find($review->reviewer_user_id);
        $reviewerInfo = $reviewer ? [
            'id' => $reviewer->id,
            'email' => $reviewer->email,
            'role' => $reviewer->role,
        ] : null;

        $categories = Category::all()->keyBy('id');

        // Calculate average score
        $ratings = array_column($review->category_ratings ?? [], 'rating');
        $avgScore = count($ratings) > 0 ? round(array_sum($ratings) / count($ratings), 2) : 0;

        // Build category details
        $categoryDetails = [];
        foreach ($review->category_ratings ?? [] as $catId => $ratingObj) {
            $category = $categories->get($catId);
            $categoryDetails[$catId] = [
                'category_id' => $catId,
                'category_title' => $category?->title ?? "Category {$catId}",
                'criteria_text' => $category?->criteria_short_text ?? '',
                'criteria_bullets' => $category?->criteria_bullets ?? '',
                'rating' => $ratingObj['rating'],
                'comment' => $ratingObj['comment'] ?? null,
                'evidence_url' => $ratingObj['evidence_url'] ?? null,
                'evidence_note' => $ratingObj['evidence_note'] ?? null,
            ];
        }

        // Check if part of published monthly final
        $monthlyFinal = MonthlyFinalReview::where('employee_id', $review->employee_id)
            ->where('review_cycle_month', $review->review_cycle_month)
            ->where('review_cycle_year', $review->review_cycle_year)
            ->first();

        return response()->json([
            'id' => $review->id,
            'review_type' => 'Internal',
            'employee' => [
                'id' => $employee->id,
                'full_name' => $employee->full_name,
                'email' => $employee->email,
                'role_type' => $employee->role_type,
            ],
            'review_cycle_month' => $review->review_cycle_month,
            'review_cycle_year' => $review->review_cycle_year,
            'reviewer' => $reviewerInfo,
            'avg_score' => $avgScore,
            'category_details' => $categoryDetails,
            'general_feedback' => $review->general_feedback,
            'private_note' => $review->private_note,
            'created_at' => $review->created_at->toISOString(),
            'updated_at' => $review->updated_at?->toISOString(),
            'is_part_of_published_final' => $monthlyFinal !== null,
            'monthly_final_id' => $monthlyFinal?->id,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'review_cycle_month' => 'required|integer|min:1|max:12',
            'review_cycle_year' => 'required|integer',
            'category_ratings' => 'required|array',
            'general_feedback' => 'required|string',
            'private_note' => 'nullable|string',
        ]);

        $user = JWTAuth::parseToken()->authenticate();

        // Check self-review restriction
        if ($user->linked_employee_id === $request->employee_id) {
            return response()->json(['detail' => 'Cannot create/edit/delete reviews for your own employee profile'], 403);
        }

        // Check if target employee is a PM - only Admin can review PM profiles
        $targetEmployee = Employee::find($request->employee_id);
        if ($targetEmployee && $targetEmployee->role_type === 'PM' && !$user->isAdmin()) {
            return response()->json(['detail' => 'Only Admin can create reviews for PM profiles'], 403);
        }

        // Validate current month/year (only restrict non-Admin users)
        if (!$user->isAdmin()) {
            $now = Carbon::now();
            if ($request->review_cycle_year < $now->year || 
                ($request->review_cycle_year == $now->year && $request->review_cycle_month < $now->month)) {
                return response()->json(['detail' => 'Cannot create reviews for previous months/years'], 400);
            }
        }

        // Validate evidence requirements
        foreach ($request->category_ratings as $categoryId => $rating) {
            if (($rating['rating'] ?? 5) < 3.0) {
                if (empty($rating['evidence_url']) || empty($rating['evidence_note'])) {
                    return response()->json([
                        'detail' => "Evidence and note required for category {$categoryId} (rating < 3)"
                    ], 400);
                }
            }
        }

        $review = InternalReview::create([
            'employee_id' => $request->employee_id,
            'review_cycle_month' => $request->review_cycle_month,
            'review_cycle_year' => $request->review_cycle_year,
            'reviewer_user_id' => $user->id,
            'category_ratings' => $request->category_ratings,
            'general_feedback' => $request->general_feedback,
            'private_note' => $request->private_note,
        ]);

        AuditLog::log($user->id, 'CREATE', 'internal_review', $review->id);

        return response()->json($review);
    }

    public function update(Request $request, string $review_id)
    {
        $review = InternalReview::find($review_id);
        if (!$review) {
            return response()->json(['detail' => 'Internal review not found'], 404);
        }

        $user = JWTAuth::parseToken()->authenticate();

        // Check self-review restriction (applies to all users)
        if ($user->linked_employee_id === $review->employee_id) {
            return response()->json(['detail' => 'Cannot create/edit/delete reviews for your own employee profile'], 403);
        }

        // Check if target employee is a PM - only Admin can edit PM profile reviews
        $targetEmployee = Employee::find($review->employee_id);
        if ($targetEmployee && $targetEmployee->role_type === 'PM' && !$user->isAdmin()) {
            return response()->json(['detail' => 'Only Admin can edit reviews for PM profiles'], 403);
        }

        // PM can only edit their own reviews
        if ($user->isPM() && $review->reviewer_user_id !== $user->id) {
            return response()->json(['detail' => 'Cannot edit this review'], 403);
        }

        // Check if monthly final is published
        $existingFinal = MonthlyFinalReview::where('employee_id', $review->employee_id)
            ->where('review_cycle_month', $review->review_cycle_month)
            ->where('review_cycle_year', $review->review_cycle_year)
            ->where('status', 'Published')
            ->first();

        if ($existingFinal && $user->isPM()) {
            return response()->json(['detail' => 'Cannot edit internal review after monthly final is published'], 403);
        }

        $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'review_cycle_month' => 'required|integer|min:1|max:12',
            'review_cycle_year' => 'required|integer',
            'category_ratings' => 'required|array',
            'general_feedback' => 'required|string',
            'private_note' => 'nullable|string',
        ]);

        $review->update([
            'employee_id' => $request->employee_id,
            'review_cycle_month' => $request->review_cycle_month,
            'review_cycle_year' => $request->review_cycle_year,
            'category_ratings' => $request->category_ratings,
            'general_feedback' => $request->general_feedback,
            'private_note' => $request->private_note,
        ]);

        AuditLog::log($user->id, 'UPDATE', 'internal_review', $review_id);

        return response()->json($review->fresh());
    }

    public function destroy(string $review_id)
    {
        $review = InternalReview::find($review_id);
        if (!$review) {
            return response()->json(['detail' => 'Internal review not found'], 404);
        }

        $user = JWTAuth::parseToken()->authenticate();

        // Check self-review restriction (applies to all users)
        if ($user->linked_employee_id === $review->employee_id) {
            return response()->json(['detail' => 'Cannot create/edit/delete reviews for your own employee profile'], 403);
        }

        // Check if target employee is a PM - only Admin can delete PM profile reviews
        $targetEmployee = Employee::find($review->employee_id);
        if ($targetEmployee && $targetEmployee->role_type === 'PM' && !$user->isAdmin()) {
            return response()->json(['detail' => 'Only Admin can delete reviews for PM profiles'], 403);
        }

        // PM can only delete their own reviews
        if ($user->isPM() && $review->reviewer_user_id !== $user->id) {
            return response()->json(['detail' => 'Cannot delete this review'], 403);
        }

        $review->delete();
        AuditLog::log($user->id, 'DELETE', 'internal_review', $review_id);

        return response()->json(['message' => 'Internal review deleted successfully']);
    }
}
