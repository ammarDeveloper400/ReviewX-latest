<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\InternalReview;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $enabledOnly = $request->boolean('enabled_only', false);
        
        $query = Category::query();
        if ($enabledOnly) {
            $query->where('is_enabled', true);
        }
        
        return response()->json($query->orderBy('display_order')->get());
    }

    public function show(string $category_id)
    {
        $category = Category::find($category_id);
        if (!$category) {
            return response()->json(['detail' => 'Category not found'], 404);
        }

        return response()->json($category);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'criteria_short_text' => 'required|string',
            'criteria_bullets' => 'nullable|string',
            'display_order' => 'nullable|integer',
        ]);

        $user = JWTAuth::parseToken()->authenticate();

        $category = Category::create([
            'title' => $request->title,
            'criteria_short_text' => $request->criteria_short_text,
            'criteria_bullets' => $request->criteria_bullets,
            'display_order' => $request->display_order ?? 0,
            'is_enabled' => true,
        ]);

        AuditLog::log($user->id, 'CREATE', 'category', $category->id);

        return response()->json($category);
    }

    public function update(Request $request, string $category_id)
    {
        $category = Category::find($category_id);
        if (!$category) {
            return response()->json(['detail' => 'Category not found'], 404);
        }

        $request->validate([
            'title' => 'nullable|string|max:255',
            'criteria_short_text' => 'nullable|string',
            'criteria_bullets' => 'nullable|string',
            'is_enabled' => 'nullable|boolean',
            'display_order' => 'nullable|integer',
        ]);

        $user = JWTAuth::parseToken()->authenticate();

        $category->update($request->only([
            'title', 'criteria_short_text', 'criteria_bullets', 'is_enabled', 'display_order'
        ]));

        AuditLog::log($user->id, 'UPDATE', 'category', $category_id, $request->all());

        return response()->json($category->fresh());
    }

    public function destroy(string $category_id)
    {
        $category = Category::find($category_id);
        if (!$category) {
            return response()->json(['detail' => 'Category not found'], 404);
        }

        // Check if category is used in any reviews
        $usedCount = InternalReview::whereJsonContainsKey('category_ratings', $category_id)->count();
        
        if ($usedCount > 0) {
            return response()->json([
                'detail' => 'Cannot delete category that is used in existing reviews. Consider disabling instead.'
            ], 400);
        }

        $user = JWTAuth::parseToken()->authenticate();

        $category->delete();
        AuditLog::log($user->id, 'DELETE', 'category', $category_id);

        return response()->json(['message' => 'Category deleted successfully']);
    }
}
