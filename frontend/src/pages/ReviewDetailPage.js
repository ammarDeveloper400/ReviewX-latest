import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import StarRating from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Calendar,
  Award,
  MessageSquare,
  FileText,
  Link as LinkIcon,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ReviewDetailPage = () => {
  const { token, user } = useAuth();
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if current user is an employee (should not see reviewer info)
  const isEmployee = user?.role === "Employee";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/monthly-finals/${reviewId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setReview(response.data);
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error("You do not have permission to view this review");
          navigate(-1);
        } else if (error.response?.status === 404) {
          toast.error("Review not found");
          navigate(-1);
        } else {
          toast.error("Failed to load review details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reviewId, token, navigate]);

  const getScoreColor = (score) => {
    if (score >= 4.5) return "text-emerald-600";
    if (score >= 3.5) return "text-teal-600";
    if (score >= 3.0) return "text-amber-600";
    return "text-rose-600";
  };

  const getScoreBgColor = (score) => {
    if (score >= 4.5) return "bg-emerald-50 border-emerald-200";
    if (score >= 3.5) return "bg-teal-50 border-teal-200";
    if (score >= 3.0) return "bg-amber-50 border-amber-200";
    return "bg-rose-50 border-rose-200";
  };

  // Only used for Admin/PM - employees won't have reviewer info
  const getReviewerEmail = (reviewerId) => {
    if (isEmployee || !reviewerId) return null;
    const reviewer = review?.reviewers?.find((r) => r.id === reviewerId);
    return reviewer?.email || null;
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-950"></div>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Review not found</p>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="mt-4"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex" data-testid="review-detail-page">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-5xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1
                  className="text-3xl font-bold text-slate-900 tracking-tight mb-2"
                  data-testid="review-title"
                >
                  {new Date(
                    review.review_cycle_year,
                    review.review_cycle_month - 1,
                  ).toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  Review
                </h1>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">
                      {review.employee?.full_name}
                    </span>
                  </div>
                  <span>•</span>
                  <Badge className="bg-indigo-50 text-indigo-700">
                    {review.employee?.role_type}
                  </Badge>
                  <Badge className="bg-emerald-50 text-emerald-700">
                    {review.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Score Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card
              className={`${getScoreBgColor(parseFloat(review.monthly_score))} border`}
              data-testid="monthly-score-card"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Monthly Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-4xl font-bold mb-2 ${getScoreColor(parseFloat(review.monthly_score))}`}
                >
                  {parseFloat(review.monthly_score || 0).toFixed(2)}
                </div>
                <StarRating
                  value={parseFloat(review.monthly_score)}
                  readonly
                  size="md"
                />
              </CardContent>
            </Card>

            <Card data-testid="cumulative-score-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Cumulative Score (at time)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-indigo-950 mb-2">
                  {parseFloat(review.cumulative_score_snapshot || 0).toFixed(2)}
                </div>
                <StarRating
                  value={parseFloat(review.cumulative_score_snapshot)}
                  readonly
                  size="md"
                />
              </CardContent>
            </Card>

            <Card data-testid="review-info-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Review Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Published:</span>
                    <span className="font-medium">
                      {review.published_at
                        ? new Date(review.published_at).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Based on:</span>
                    <span className="font-medium">{review.internal_reviews_count} internal review(s)</span>
                  </div> */}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reviewers Section - ONLY shown to Admin/PM */}
          {!isEmployee && review.reviewers && review.reviewers.length > 0 && (
            <Card className="mb-8" data-testid="reviewers-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Reviewers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {review.reviewers.map((reviewer) => (
                    <Badge
                      key={reviewer.id}
                      variant="outline"
                      className="py-2 px-3"
                    >
                      {reviewer.email} ({reviewer.role})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Ratings Section */}
          <Card className="mb-8" data-testid="category-ratings-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Category Ratings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(review.category_details || {}).map(
                  ([catId, category]) => (
                    <div
                      key={catId}
                      className="border border-slate-200 rounded-lg p-5"
                      data-testid={`category-${catId}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 mb-1">
                            {category.category_title}
                          </h3>
                          {category.criteria_text && (
                            <p className="text-sm text-slate-600 mb-2">
                              {category.criteria_text}
                            </p>
                          )}
                          {category.criteria_bullets && (
                            <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg mt-2">
                              <p className="font-medium mb-1">
                                Evaluation Criteria:
                              </p>
                              <div className="whitespace-pre-wrap">
                                {category.criteria_bullets}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div
                            className={`text-3xl font-bold ${getScoreColor(parseFloat(category.rating))}`}
                          >
                            {parseFloat(category.rating || 0).toFixed(2)}
                          </div>
                          <StarRating
                            value={parseFloat(category.rating)}
                            readonly
                            size="md"
                          />
                        </div>
                      </div>

                      {/* Comments for this category */}
                      {category.comments && category.comments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Comments
                          </h4>
                          <div className="space-y-3">
                            {category.comments.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-50 rounded-lg p-3"
                              >
                                <p className="text-slate-700">{item.comment}</p>
                                {/* Only show reviewer attribution for Admin/PM */}
                                {!isEmployee && item.reviewer_id && (
                                  <p className="text-xs text-slate-500 mt-2">
                                    —{" "}
                                    {getReviewerEmail(item.reviewer_id) ||
                                      "Reviewer"}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evidence for this category */}
                      {category.evidence && category.evidence.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4" />
                            Evidence
                          </h4>
                          <div className="space-y-3">
                            {category.evidence.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                              >
                                {item.evidence_note && (
                                  <p className="text-amber-900 mb-2">
                                    {item.evidence_note}
                                  </p>
                                )}
                                {item.evidence_url && (
                                  <div className="mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs flex items-center gap-2"
                                      onClick={() => {
                                        const baseUrl =
                                          process.env.REACT_APP_BACKEND_URL?.replace(
                                            /\/$/,
                                            "",
                                          ) || "";
                                        const path =
                                          item.evidence_url.startsWith("/")
                                            ? item.evidence_url
                                            : `/${item.evidence_url}`;
                                        const fullUrl =
                                          item.evidence_url.startsWith("http")
                                            ? item.evidence_url
                                            : `${baseUrl}${path}`;
                                        window.open(fullUrl, "_blank");
                                      }}
                                    >
                                      <LinkIcon className="w-3 h-3" />
                                      View
                                    </Button>
                                  </div>
                                )}
                                {/* Only show reviewer attribution for Admin/PM */}
                                {!isEmployee && item.reviewer_id && (
                                  <p className="text-xs text-amber-700 mt-2">
                                    —{" "}
                                    {getReviewerEmail(item.reviewer_id) ||
                                      "Reviewer"}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          {/* General Feedback Section */}
          {review.general_feedback && review.general_feedback.length > 0 && (
            <Card data-testid="general-feedback-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  General Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {review.general_feedback.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                    >
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {item.feedback}
                      </p>
                      {/* Only show reviewer attribution for Admin/PM */}
                      {!isEmployee && item.reviewer_id && (
                        <p className="text-sm text-slate-500 mt-3">
                          — {getReviewerEmail(item.reviewer_id) || "Reviewer"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailPage;
