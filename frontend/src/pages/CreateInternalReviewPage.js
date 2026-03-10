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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Upload, TrendingUp, InfoIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CategoryRatingInput = ({ category, value, onChange, categoryKey }) => {
  const [rating, setRating] = useState(value?.rating || 3);
  const [comment, setComment] = useState(value?.comment || "");
  const [evidenceNote, setEvidenceNote] = useState(value?.evidence_note || "");
  const [evidenceUrl, setEvidenceUrl] = useState(value?.evidence_url || "");
  const needsEvidence = rating < 3;

  useEffect(() => {
    onChange({
      rating,
      comment,
      evidence_url: evidenceUrl || null,
      evidence_note: evidenceNote || null,
    });
  }, [rating, comment, evidenceNote, evidenceUrl]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setEvidenceUrl(response.data.file_url);
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{category.title}</CardTitle>
        {category.criteria_short_text && (
          <p className="text-sm text-slate-600">
            {category.criteria_short_text}
          </p>
        )}
        {category.criteria_bullets && (
          <Accordion type="single" collapsible className="w-full mt-2">
            <AccordionItem value="criteria" className="border-none">
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
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-2 block">
            Rating * (click or drag to set fractional rating)
          </Label>
          <div className="flex items-center gap-4">
            <StarRating
              value={rating}
              onChange={(v) => setRating(Math.round(v * 100) / 100)}
              size="lg"
            />
            <span className="text-2xl font-bold text-slate-900">
              {(rating || 0).toFixed(2)}
            </span>
          </div>
        </div>
        <div>
          <Label htmlFor={`${categoryKey}-comment`}>Comment</Label>
          <Textarea
            id={`${categoryKey}-comment`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add your feedback..."
            className="bg-slate-50"
            rows={3}
          />
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <Label>
              Evidence{" "}
              {needsEvidence && <span className="text-rose-600">*</span>}
            </Label>
            {needsEvidence && (
              <Badge variant="destructive" className="text-xs">
                Required (Rating &lt; 3)
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.docx"
                onChange={handleFileUpload}
                className="bg-slate-50"
                data-testid={`${categoryKey}-evidence-upload`}
              />
              {evidenceUrl && (
                <p className="text-xs text-emerald-600 mt-1">✓ File uploaded</p>
              )}
            </div>
            <Textarea
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder={
                needsEvidence
                  ? "Evidence explanation (required)"
                  : "Evidence explanation (optional)"
              }
              className="bg-slate-50"
              rows={2}
              data-testid={`${categoryKey}-evidence-note`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CreateInternalReviewPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { reviewId } = useParams();
  const isEditing = !!reviewId;

  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    review_cycle_month: new Date().getMonth() + 1,
    review_cycle_year: new Date().getFullYear(),
    general_feedback: "",
    private_note: "",
    category_ratings: {},
  });

  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchCategories();
    if (isEditing) {
      fetchReview();
    }
  }, [reviewId]);

  const fetchEmployees = async () => {
    try {
      // Use active employees endpoint by default for new reviews
      const response = await axios.get(`${API_URL}/employees/active`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { include_inactive: isEditing }, // Only include inactive if editing existing review
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
      // Fallback to regular endpoint with client-side filtering
      try {
        const response = await axios.get(`${API_URL}/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Filter to active employees unless editing
        let filtered = isEditing
          ? response.data
          : response.data.filter((emp) => emp.status === "Active");

        // If user is PM, filter out PM employees
        if (user?.role === "PM") {
          filtered = filtered.filter(
            (emp) =>
              emp.role_type !== "PM" && emp.id !== user.linked_employee_id,
          );
        }

        setEmployees(filtered);
      } catch (fallbackError) {
        toast.error("Failed to load employees");
      }
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

  const fetchReview = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/internal-reviews/${reviewId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const review = response.data;
      setFormData({
        employee_id: review.employee_id,
        review_cycle_month: review.review_cycle_month,
        review_cycle_year: review.review_cycle_year,
        general_feedback: review.general_feedback,
        private_note: review.private_note || "",
        category_ratings: review.category_ratings,
      });
    } catch (error) {
      toast.error("Failed to load review");
    }
  };

  const calculatePreview = () => {
    const ratings = Object.values(formData.category_ratings).map(
      (r) => r.rating,
    );
    if (ratings.length === 0) return null;

    const monthlyScore = (
      ratings.reduce((a, b) => a + b, 0) / ratings.length
    ).toFixed(2);

    let bonusBracket = "No bonus";
    if (monthlyScore >= 4.7) bonusBracket = "2 salaries";
    else if (monthlyScore >= 4.1) bonusBracket = "1.5 salaries";
    else if (monthlyScore >= 3.6) bonusBracket = "1 salary";
    else if (monthlyScore >= 3.1) bonusBracket = "0.5 salary";

    const warning = monthlyScore < 3.1;

    return { monthlyScore: parseFloat(monthlyScore), bonusBracket, warning };
  };

  useEffect(() => {
    setPreview(calculatePreview());
  }, [formData.category_ratings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate evidence requirements
      for (const [catId, rating] of Object.entries(formData.category_ratings)) {
        if (rating.rating < 3) {
          if (!rating.evidence_url || !rating.evidence_note) {
            const category = categories.find((c) => c.id === catId);
            toast.error(`Evidence required for ${category?.title || catId}`);
            setLoading(false);
            return;
          }
        }
      }

      const payload = { ...formData };

      if (isEditing) {
        await axios.put(`${API_URL}/internal-reviews/${reviewId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Internal review updated successfully");
      } else {
        await axios.post(`${API_URL}/internal-reviews`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Internal review created successfully");
      }

      navigate("/admin/internal-reviews");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex" data-testid="create-internal-review-page">
      <Sidebar />
      <div className="flex-1">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
              {isEditing ? "Edit Internal Review" : "Create Internal Review"}
            </h1>
            <p className="text-lg text-slate-500">
              Internal reviews are NOT visible to employees. Multiple reviews
              can be created per month.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="employee_id">Employee *</Label>
                      <Select
                        value={formData.employee_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, employee_id: value })
                        }
                        disabled={isEditing}
                      >
                        <SelectTrigger
                          className="bg-slate-50"
                          data-testid="employee-select"
                        >
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="month">Month *</Label>
                        <Select
                          value={formData.review_cycle_month.toString()}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              review_cycle_month: parseInt(value),
                            })
                          }
                          disabled={isEditing}
                        >
                          <SelectTrigger className="bg-slate-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(12)].map((_, i) => {
                              const currentMonth = new Date().getMonth() + 1;
                              const monthValue = i + 1;
                              return (
                                <SelectItem
                                  key={monthValue}
                                  value={monthValue.toString()}
                                >
                                  {new Date(2024, i).toLocaleString("default", {
                                    month: "long",
                                  })}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="year">Year *</Label>
                        <Select
                          value={formData.review_cycle_year.toString()}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              review_cycle_year: parseInt(value),
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

                {categories.map((category, idx) => (
                  <CategoryRatingInput
                    key={category.id}
                    category={category}
                    value={formData.category_ratings[category.id]}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        category_ratings: {
                          ...formData.category_ratings,
                          [category.id]: val,
                        },
                      })
                    }
                    categoryKey={`category-${idx}`}
                  />
                ))}

                <Card>
                  <CardHeader>
                    <CardTitle>Feedback & Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="general_feedback">
                        General Feedback *
                      </Label>
                      <Textarea
                        id="general_feedback"
                        value={formData.general_feedback}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            general_feedback: e.target.value,
                          })
                        }
                        placeholder="Overall performance feedback..."
                        className="bg-slate-50"
                        required
                        rows={4}
                        data-testid="general-feedback"
                      />
                    </div>
                    <div>
                      <Label htmlFor="private_note">
                        Private Note (Internal Only)
                      </Label>
                      <Textarea
                        id="private_note"
                        value={formData.private_note}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            private_note: e.target.value,
                          })
                        }
                        placeholder="Internal notes not visible to employee..."
                        className="bg-slate-50"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                        className={`text-5xl font-bold ${preview?.monthlyScore >= 3.1 ? "text-emerald-600" : "text-rose-600"}`}
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
                          {preview?.bonusBracket}
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
                          This is an internal review. Employee will NOT see this
                          until monthly final is published.
                        </AlertDescription>
                      </Alert>
                    </div>

                    <div className="pt-4 space-y-2">
                      <Button
                        type="submit"
                        className="w-full bg-indigo-950 hover:bg-indigo-900"
                        disabled={loading || !formData.employee_id}
                        data-testid="save-review-button"
                      >
                        {loading
                          ? "Saving..."
                          : isEditing
                            ? "Update Review"
                            : "Save Internal Review"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate("/admin/internal-reviews")}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateInternalReviewPage;
