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
  X,
  TrendingUp,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [preview, setPreview] = useState(null);

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

  // Calculate preview score
  useEffect(() => {
    calculatePreview();
  }, [formData.category_ratings]);

  const calculatePreview = () => {
    const ratings = Object.values(formData.category_ratings).map(
      (r) => r.rating || 0
    );
    if (ratings.length === 0) {
      setPreview(null);
      return;
    }

    const monthlyScore =
      Math.round(
        (ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 100
      ) / 100;

    // Determine bonus bracket based on score
    let bonusBracket = "Below Expectations";
    if (monthlyScore >= 4.5) bonusBracket = "Exceptional";
    else if (monthlyScore >= 4.0) bonusBracket = "Exceeds Expectations";
    else if (monthlyScore >= 3.5) bonusBracket = "Meets Expectations";
    else if (monthlyScore >= 3.0) bonusBracket = "Satisfactory";

    const warning = monthlyScore < 3.0;

    setPreview({ monthlyScore, bonusBracket, warning });
  };

  const handleEvidenceUpload = async (e, categoryId) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const response = await axios.post(`${API_URL}/upload`, uploadFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      handleCategoryRatingChange(categoryId, "evidence_url", response.data.file_url);
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to upload file");
    }
  };

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
      console.log('Fetched review data:', data);
      setExistingFinal(data);

      // Convert category_details to category_ratings
      let categoryRatings = {};
      if (data.category_details) {
        Object.values(data.category_details).forEach((cat) => {
          categoryRatings[cat.category_id] = {
            rating: cat.rating ?? 3,
            comment: cat.comments && cat.comments.length > 0 ? cat.comments[0].comment : "",
            evidence_url: cat.evidence && cat.evidence.length > 0 ? cat.evidence[0].evidence_url : null,
            evidence_note: cat.evidence && cat.evidence.length > 0 ? cat.evidence[0].evidence_note : null,
          };
        });
      }

      // Parse general_feedback if array and stringified JSON
      let generalFeedback = "";
      if (Array.isArray(data.general_feedback) && data.general_feedback.length > 0) {
        try {
          const parsed = JSON.parse(data.general_feedback[0].feedback);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].feedback) {
            generalFeedback = parsed[0].feedback;
          } else if (typeof parsed === "string") {
            generalFeedback = parsed;
          }
        } catch (e) {
          generalFeedback = data.general_feedback[0].feedback || "";
        }
      } else if (typeof data.general_feedback === "string") {
        generalFeedback = data.general_feedback;
      }

      setFormData({
        employee_id: data.employee_id || (data.employee && data.employee.id),
        review_cycle_month: data.review_cycle_month,
        review_cycle_year: data.review_cycle_year,
        general_feedback: generalFeedback,
        category_ratings: categoryRatings,
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
          category_ratings: {
            ...prev.category_ratings,
            [catId]: {
              ...prev.category_ratings[catId],
              evidence_url: "",
            },
          },
        };
      } else {
        return {
          ...prev,
          included_evidence: [
            ...prev.included_evidence,
            { ...evidenceItem, category_id: catId },
          ],
          category_ratings: {
            ...prev.category_ratings,
            [catId]: {
              ...prev.category_ratings[catId],
              evidence_url: evidenceItem.evidence_url || prev.category_ratings[catId]?.evidence_url || "",
            },
          },
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
    const generalFeedback = typeof formData.general_feedback === "string" ? formData.general_feedback : String(formData.general_feedback ?? "");
    if (!generalFeedback.trim()) {
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
    <div
      className="flex h-screen overflow-hidden"
      data-testid="create-monthly-final-page"
    >
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
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
                          {[
                            new Date().getFullYear() - 1,
                            new Date().getFullYear(),
                            new Date().getFullYear() + 1,
                          ].map((year) => (
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
                            step={0.1}
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
                        <div className="flex items-center justify-between mb-2">
                          <Label
                            className={needsEvidence ? "text-amber-800" : ""}
                          >
                            Evidence{" "}
                            {needsEvidence && (
                              <span className="text-rose-600">
                                * (Required for rating &lt; 3)
                              </span>
                            )}
                          </Label>
                          {needsEvidence && (
                            <Badge variant="destructive" className="text-xs">
                              Required (Rating &lt; 3)
                            </Badge>
                          )}
                        </div>

                        <div className="mt-2 space-y-3">
                          <div>
                            <Label className="text-sm mb-1 flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              Upload File
                            </Label>
                            <Input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp,.pdf,.docx"
                              onChange={(e) =>
                                handleEvidenceUpload(e, category.id)
                              }
                              className="bg-slate-50 mt-1"
                            />
                            {rating.evidence_url && (
                              <p className="text-xs text-emerald-600 mt-1">
                                ✓ File uploaded
                              </p>
                            )}
                          </div>

                          <div>
                            <Label className="text-sm">Evidence Note</Label>
                            <Textarea
                              value={rating.evidence_note || ""}
                              onChange={(e) =>
                                handleCategoryRatingChange(
                                  category.id,
                                  "evidence_note",
                                  e.target.value,
                                )
                              }
                              placeholder="Add your own evidence note..."
                              className={`mt-1 ${needsEvidence ? "border-amber-300" : "bg-slate-50"}`}
                              rows={2}
                            />
                          </div>

                          {rating.evidence_url && (
                            <div className="bg-white border border-slate-200 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <LinkIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <a
                                    href={rating.evidence_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline truncate block"
                                  >
                                    {rating.evidence_url}
                                  </a>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCategoryRatingChange(
                                      category.id,
                                      "evidence_url",
                                      null,
                                    )
                                  }
                                  className="text-slate-400 hover:text-rose-500 flex-shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
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

            {/* Right Side - Score Preview Panel */}
            <div className="lg:col-span-1 flex flex-col space-y-6">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Score Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-2">
                      Monthly Score (Estimated)
                    </p>
                    <p
                      className={`text-5xl font-bold ${
                        preview?.monthlyScore >= 3.1
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {preview?.monthlyScore || 0}
                    </p>
                    <div className="mt-3">
                      <StarRating
                        value={preview?.monthlyScore || 0}
                        readonly
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">
                        Bonus Bracket
                      </span>
                      <Badge className="bg-teal-50 text-teal-700">
                        {preview?.bonusBracket || "N/A"}
                      </Badge>
                    </div>

                    {preview?.warning && (
                      <Alert className="bg-rose-50 border-rose-200">
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                        <AlertDescription className="text-rose-800 text-sm">
                          ⚠️ This score will create a warning
                        </AlertDescription>
                      </Alert>
                    )}

                    <Alert className="bg-blue-50 border-blue-200">
                      <InfoIcon className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 text-sm">
                        This is a monthly final review. Employee will see this
                        based on publish status.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Right Side - Score Preview Panel End */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMonthlyFinalPage;
