import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import StarRating from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Save,
  CheckCircle,
  FileText,
  MessageSquare,
  Link as LinkIcon,
  Users,
  AlertCircle,
  InfoIcon,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CreateMonthlyFinalPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { finalId } = useParams();
  const isEditing = !!finalId;

  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAggregated, setLoadingAggregated] = useState(false);
  const [aggregatedData, setAggregatedData] = useState(null);

  const [formData, setFormData] = useState({
    employee_id: "",
    review_cycle_month: new Date().getMonth() + 1,
    review_cycle_year: new Date().getFullYear(),
    general_feedback: "",
    category_ratings: {},
    included_evidence: [],
  });

  const [existingFinal, setExistingFinal] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchCategories();
    if (isEditing) {
      fetchExistingFinal();
    }
  }, [finalId]);

  useEffect(() => {
    if (
      formData.employee_id &&
      formData.review_cycle_month &&
      formData.review_cycle_year
    ) {
      fetchAggregatedData();
    }
  }, [
    formData.employee_id,
    formData.review_cycle_month,
    formData.review_cycle_year,
  ]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let employeeList = response.data;

      // If user is PM, filter out PM employees (PM cannot review PMs or themselves)
      if (user?.role === "PM") {
        employeeList = employeeList.filter(
          (emp) => emp.role_type !== "PM" && emp.id !== user.linked_employee_id,
        );
      }

      setEmployees(employeeList);
    } catch (error) {
      toast.error("Failed to load employees");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/categories?enabled_only=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setCategories(response.data);

      // Initialize category ratings
      const initialRatings = {};
      response.data.forEach((cat) => {
        initialRatings[cat.id] = {
          rating: 3,
          comment: "",
          evidence_url: null,
          evidence_note: null,
        };
      });
      setFormData((prev) => ({ ...prev, category_ratings: initialRatings }));
    } catch (error) {
      toast.error("Failed to load categories");
    }
  };

  const fetchExistingFinal = async () => {
    try {
      const response = await axios.get(`${API_URL}/monthly-finals/${finalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      setExistingFinal(data);

      setFormData({
        employee_id: data.employee_id || data.employee?.id,
        review_cycle_month: data.review_cycle_month,
        review_cycle_year: data.review_cycle_year,
        general_feedback: data.general_feedback || "",
        category_ratings: data.final_category_ratings || {},
        included_evidence: data.included_evidence || [],
      });
    } catch (error) {
      toast.error("Failed to load review");
    }
  };

  const fetchAggregatedData = async () => {
    setLoadingAggregated(true);
    try {
      const response = await axios.get(
        `${API_URL}/internal-reviews/aggregated`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            employee_id: formData.employee_id,
            month: formData.review_cycle_month,
            year: formData.review_cycle_year,
          },
        },
      );
      setAggregatedData(response.data);

      // Pre-fill ratings from aggregated scores if creating new
      if (!isEditing && response.data.aggregated_scores) {
        const newRatings = { ...formData.category_ratings };
        Object.entries(response.data.aggregated_scores).forEach(
          ([catId, data]) => {
            if (newRatings[catId]) {
              newRatings[catId] = {
                ...newRatings[catId],
                rating: data.avg_rating,
              };
            }
          },
        );
        setFormData((prev) => ({ ...prev, category_ratings: newRatings }));
      }
    } catch (error) {
      console.error("Failed to load aggregated data:", error);
    } finally {
      setLoadingAggregated(false);
    }
  };

  const handleCategoryRatingChange = (catId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      category_ratings: {
        ...prev.category_ratings,
        [catId]: {
          ...prev.category_ratings[catId],
          [field]: value,
        },
      },
    }));
  };

  const toggleEvidenceSelection = (catId, evidenceItem) => {
    setFormData((prev) => {
      const existingIndex = prev.included_evidence.findIndex(
        (e) =>
          e.category_id === catId &&
          e.evidence_url === evidenceItem.evidence_url,
      );

      if (existingIndex >= 0) {
        return {
          ...prev,
          included_evidence: prev.included_evidence.filter(
            (_, i) => i !== existingIndex,
          ),
        };
      } else {
        return {
          ...prev,
          included_evidence: [
            ...prev.included_evidence,
            { ...evidenceItem, category_id: catId },
          ],
        };
      }
    });
  };

  const isEvidenceSelected = (catId, evidenceUrl) => {
    return formData.included_evidence.some(
      (e) => e.category_id === catId && e.evidence_url === evidenceUrl,
    );
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (isEditing) {
        await axios.put(
          `${API_URL}/monthly-finals/${finalId}`,
          {
            final_category_ratings: formData.category_ratings,
            general_feedback: formData.general_feedback,
            included_evidence: formData.included_evidence,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        toast.success("Draft updated successfully");
      } else {
        await axios.post(
          `${API_URL}/monthly-finals`,
          {
            employee_id: formData.employee_id,
            review_cycle_month: formData.review_cycle_month,
            review_cycle_year: formData.review_cycle_year,
            final_category_ratings: formData.category_ratings,
            general_feedback: formData.general_feedback,
            included_evidence: formData.included_evidence,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        toast.success("Draft saved successfully");
      }
      navigate("/admin/internal-reviews");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    if (
      !window.confirm(
        "Are you sure you want to publish this review? Once published, employees will be able to see it.",
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      let reviewId = finalId;

      // If new, create draft first
      if (!isEditing) {
        const createResponse = await axios.post(
          `${API_URL}/monthly-finals`,
          {
            employee_id: formData.employee_id,
            review_cycle_month: formData.review_cycle_month,
            review_cycle_year: formData.review_cycle_year,
            final_category_ratings: formData.category_ratings,
            general_feedback: formData.general_feedback,
            included_evidence: formData.included_evidence,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        reviewId = createResponse.data.id;
      } else {
        // Update first
        await axios.put(
          `${API_URL}/monthly-finals/${finalId}`,
          {
            final_category_ratings: formData.category_ratings,
            general_feedback: formData.general_feedback,
            included_evidence: formData.included_evidence,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }

      // Publish
      await axios.post(
        `${API_URL}/monthly-finals/${reviewId}/publish`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast.success("Review published successfully!");
      navigate("/admin/internal-reviews");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to publish review");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.employee_id) {
      toast.error("Please select an employee");
      return false;
    }
    if (!formData.general_feedback.trim()) {
      toast.error("Please provide general feedback");
      return false;
    }

    // Check evidence requirements
    for (const [catId, rating] of Object.entries(formData.category_ratings)) {
      if (rating.rating < 3 && !rating.evidence_note) {
        const cat = categories.find((c) => c.id === catId);
        toast.error(
          `Evidence note required for ${cat?.title || "category"} (rating < 3)`,
        );
        return false;
      }
    }

    return true;
  };

  const getEmployeeName = (id) => {
    const emp = employees.find((e) => e.id === id);
    return emp?.full_name || "Unknown Employee";
  };

  const getScoreColor = (score) => {
    if (score >= 4.5) return "text-emerald-600";
    if (score >= 3.5) return "text-teal-600";
    if (score >= 3.0) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="flex" data-testid="create-monthly-final-page">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/internal-reviews")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reviews
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              {isEditing
                ? "Edit Monthly Final Review"
                : "Create Monthly Final Review"}
            </h1>
            <p className="text-slate-500">
              {isEditing
                ? `Editing ${existingFinal?.status || "Draft"} review`
                : "Create a finalized review based on internal reviews"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Form */}
            <div className="lg:col-span-2 space-y-6 flex flex-col">
              {/* Employee/Period Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Review Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Employee *</Label>
                      <Select
                        value={formData.employee_id}
                        onValueChange={(v) =>
                          setFormData({ ...formData, employee_id: v })
                        }
                        disabled={isEditing}
                      >
                        <SelectTrigger className="bg-slate-50">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.full_name} ({emp.role_type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Month *</Label>
                      <Select
                        value={formData.review_cycle_month.toString()}
                        onValueChange={(v) =>
                          setFormData({
                            ...formData,
                            review_cycle_month: parseInt(v),
                          })
                        }
                        disabled={isEditing}
                      >
                        <SelectTrigger className="bg-slate-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(12)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {new Date(2024, i).toLocaleString("default", {
                                month: "long",
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Year *</Label>
                      <Select
                        value={formData.review_cycle_year.toString()}
                        onValueChange={(v) =>
                          setFormData({
                            ...formData,
                            review_cycle_year: parseInt(v),
                          })
                        }
                        disabled={isEditing}
                      >
                        <SelectTrigger className="bg-slate-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2024, 2025, 2026].map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Ratings */}
              {categories.map((category) => {
                const rating = formData.category_ratings[category.id] || {
                  rating: 3,
                };
                const aggregatedCat =
                  aggregatedData?.aggregated_scores?.[category.id];
                const needsEvidence = rating.rating < 3;

                return (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {category.title}
                          </CardTitle>
                          <p className="text-sm text-slate-500 mt-1">
                            {category.criteria_short_text}
                          </p>
                          {category.criteria_bullets && (
                            <Accordion
                              type="single"
                              collapsible
                              className="w-full mt-2"
                            >
                              <AccordionItem
                                value="criteria"
                                className="border-none"
                              >
                                <AccordionTrigger className="text-sm font-normal text-indigo-600 hover:text-indigo-800 py-2">
                                  <span className="flex items-center gap-1">
                                    <InfoIcon size={16} />
                                    View Rating Criteria
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="bg-slate-50 p-4 rounded-lg mt-2 text-sm text-slate-700 whitespace-pre-wrap">
                                    {category.criteria_bullets}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}
                        </div>
                        {aggregatedCat && (
                          <Badge className="bg-blue-50 text-blue-700">
                            Internal Avg: {aggregatedCat.avg_rating}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>
                          Rating * (click or drag to set fractional rating)
                        </Label>
                        <div className="flex items-center gap-4 mt-2">
                          <StarRating
                            value={rating.rating}
                            onChange={(v) =>
                              handleCategoryRatingChange(
                                category.id,
                                "rating",
                                Math.round(v * 100) / 100,
                              )
                            }
                            size="lg"
                          />
                          <span
                            className={`text-2xl font-bold ${getScoreColor(rating.rating)}`}
                          >
                            {(rating.rating || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label>Comment</Label>
                        <Textarea
                          value={rating.comment || ""}
                          onChange={(e) =>
                            handleCategoryRatingChange(
                              category.id,
                              "comment",
                              e.target.value,
                            )
                          }
                          placeholder="Add your assessment..."
                          className="bg-slate-50 mt-1"
                          rows={2}
                        />
                      </div>

                      <div
                        className={
                          needsEvidence
                            ? "p-3 bg-amber-50 rounded-lg border border-amber-200"
                            : ""
                        }
                      >
                        <Label
                          className={needsEvidence ? "text-amber-800" : ""}
                        >
                          Evidence Note{" "}
                          {needsEvidence && (
                            <span className="text-rose-600">
                              * (Required for rating &lt; 3)
                            </span>
                          )}
                        </Label>
                        <Textarea
                          value={rating.evidence_note || ""}
                          onChange={(e) =>
                            handleCategoryRatingChange(
                              category.id,
                              "evidence_note",
                              e.target.value,
                            )
                          }
                          placeholder="Provide supporting evidence..."
                          className={`mt-1 ${needsEvidence ? "border-amber-300" : "bg-slate-50"}`}
                          rows={2}
                        />

                        <div className="mt-2">
                          <Label>Evidence URL (optional)</Label>
                          <Input
                            value={rating.evidence_url || ""}
                            onChange={(e) =>
                              handleCategoryRatingChange(
                                category.id,
                                "evidence_url",
                                e.target.value,
                              )
                            }
                            placeholder="https://..."
                            className="mt-1 bg-slate-50"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* General Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>General Feedback *</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.general_feedback}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        general_feedback: e.target.value,
                      })
                    }
                    placeholder="Overall assessment and feedback for the employee..."
                    className="bg-slate-50"
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={
                    loading ||
                    (existingFinal?.status === "Published" &&
                      user?.role === "PM")
                  }
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {existingFinal?.status === "Published"
                    ? "Already Published"
                    : "Publish"}
                </Button>
              </div>
            </div>

            {/* Right Side - Internal Reviews Reference Panel */}
            <div className="lg:col-span-1 flex flex-col">
              <Card className="sticky top-4">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Internal Reviews Reference
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!formData.employee_id ? (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>
                        Select an employee and period to see internal reviews
                      </p>
                    </div>
                  ) : loadingAggregated ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-950"></div>
                    </div>
                  ) : !aggregatedData?.internal_reviews?.length ? (
                    <div className="text-center py-8 text-slate-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-400" />
                      <p>No internal reviews found for this period</p>
                      <p className="text-sm mt-1">
                        You can still create a final review
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-indigo-900">
                          {aggregatedData.internal_reviews.length} Internal
                          Review(s)
                        </p>
                        <p className="text-2xl font-bold text-indigo-600 mt-1">
                          Avg: {aggregatedData.overall_avg_score}
                        </p>
                      </div>

                      <Separator />

                      {/* Internal Reviews List */}
                      {aggregatedData.internal_reviews.map((ir, idx) => (
                        <div
                          key={ir.id}
                          className="border border-slate-200 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">Review #{idx + 1}</Badge>
                            <span className="text-lg font-bold">
                              {ir.avg_score}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            By: {ir.reviewer_email}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(ir.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}

                      <Separator />

                      {/* Category Aggregated Data */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-700">
                          Category Breakdown
                        </p>
                        {Object.entries(
                          aggregatedData.aggregated_scores || {},
                        ).map(([catId, data]) => (
                          <div
                            key={catId}
                            className="bg-slate-50 p-3 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">
                                {data.category_title}
                              </span>
                              <span
                                className={`font-bold ${getScoreColor(data.avg_rating)}`}
                              >
                                {data.avg_rating}
                              </span>
                            </div>

                            {/* Comments for this category */}
                            {aggregatedData.all_comments?.[catId]?.length >
                              0 && (
                              <div className="mt-2">
                                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" /> Comments
                                </p>
                                {aggregatedData.all_comments[catId].map(
                                  (c, i) => (
                                    <div
                                      key={i}
                                      className="text-xs bg-white p-2 rounded mb-1"
                                    >
                                      <p className="text-slate-700">
                                        {c.comment}
                                      </p>
                                      <p className="text-slate-400 mt-1">
                                        - {c.reviewer_email}
                                      </p>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}

                            {/* Evidence for this category */}
                            {aggregatedData.all_evidence?.[catId]?.length >
                              0 && (
                              <div className="mt-2">
                                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                  <LinkIcon className="w-3 h-3" /> Evidence
                                  (click to include)
                                </p>
                                {aggregatedData.all_evidence[catId].map(
                                  (e, i) => (
                                    <div
                                      key={i}
                                      className={`text-xs p-2 rounded mb-1 cursor-pointer transition-colors ${
                                        isEvidenceSelected(
                                          catId,
                                          e.evidence_url,
                                        )
                                          ? "bg-emerald-100 border border-emerald-300"
                                          : "bg-amber-50 hover:bg-amber-100"
                                      }`}
                                      onClick={() =>
                                        toggleEvidenceSelection(catId, e)
                                      }
                                    >
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          checked={isEvidenceSelected(
                                            catId,
                                            e.evidence_url,
                                          )}
                                          className="h-3 w-3"
                                        />
                                        <p className="text-slate-700 flex-1">
                                          {e.evidence_note}
                                        </p>
                                      </div>
                                      {e.evidence_url && (
                                        <p className="text-blue-600 truncate mt-1">
                                          {e.evidence_url}
                                        </p>
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* General Feedback from Internals */}
                      {aggregatedData.all_general_feedback?.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">
                              General Feedback from Internal Reviews
                            </p>
                            {aggregatedData.all_general_feedback.map((f, i) => (
                              <div
                                key={i}
                                className="bg-slate-50 p-3 rounded-lg mb-2"
                              >
                                <p className="text-sm text-slate-700">
                                  {f.feedback}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  - {f.reviewer_email}
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMonthlyFinalPage;
