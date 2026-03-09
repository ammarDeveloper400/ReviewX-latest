import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  FileText,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import StarRating from "@/components/StarRating";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const InternalReviewsPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [internalReviews, setInternalReviews] = useState([]);
  const [monthlyFinals, setMonthlyFinals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("internal");
  const [filters, setFilters] = useState({
    employee_id: null,
    month: null,
    year: "2026",
    status: null,
  });
  const [accumulativeRating, setAccumulativeRating] = useState(null);

  const yearOptions = [2026, 2025, 2024, 2023];

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchInternalReviews();
    fetchMonthlyFinals();
    calculateAccumulativeRating();
  }, [filters]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allEmployees = response.data;
      const visibleEmployees =
        user?.role === "PM" && user?.linked_employee_id
          ? allEmployees.filter(
              (emp) => emp.id !== user?.linked_employee_id,
            )
          : allEmployees;
      setEmployees(visibleEmployees);
      if (
        user?.role === "PM" &&
        user?.linked_employee_id &&
        filters.employee_id === user?.linked_employee_id
      ) {
        setFilters((prev) => ({ ...prev, employee_id: null }));
      }
    } catch (error) {
      console.error("Failed to load employees");
    }
  };

  const fetchInternalReviews = async () => {
    try {
      const params = {};
      if (filters.employee_id) params.employee_id = filters.employee_id;
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;

      const response = await axios.get(`${API_URL}/internal-reviews`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      const reviews = response.data;
      const visibleReviews =
        user?.role === "PM"
          ? reviews.filter((review) => review.reviewer_user_id !== user?.id)
          : reviews;
      setInternalReviews(visibleReviews);
    } catch (error) {
      toast.error("Failed to load internal reviews");
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyFinals = async () => {
    try {
      const params = {};
      if (filters.employee_id) params.employee_id = filters.employee_id;
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      if (filters.status) params.status = filters.status;

      const response = await axios.get(`${API_URL}/monthly-finals`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setMonthlyFinals(response.data);
    } catch (error) {
      toast.error("Failed to load monthly finals");
    }
  };

  const calculateAccumulativeRating = async () => {
    if (!filters.employee_id) {
      setAccumulativeRating(null);
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/employees/${filters.employee_id}/performance`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { year: filters.year },
        },
      );

      setAccumulativeRating({
        cumulative_score: response.data.cumulative_score,
        total_reviews: response.data.total_reviews,
        employee_name: response.data.employee?.full_name,
      });
    } catch (error) {
      setAccumulativeRating(null);
    }
  };

  const handleDeleteInternal = async (reviewId) => {
    if (!window.confirm("Delete this internal review?")) return;

    try {
      await axios.delete(`${API_URL}/internal-reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Internal review deleted");
      fetchInternalReviews();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete review");
    }
  };

  const handleDeleteFinal = async (finalId) => {
    if (!window.confirm("Delete this monthly final review?")) return;

    try {
      await axios.delete(`${API_URL}/monthly-finals/${finalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Monthly final deleted");
      fetchMonthlyFinals();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete");
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? employee.full_name : "Unknown";
  };

  const calculateAvgScore = (categoryRatings) => {
    if (!categoryRatings) return 0;
    const ratings = Object.values(categoryRatings).map((r) =>
      typeof r === "object" ? r.rating : r,
    );
    return ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
      : 0;
  };

  const getScoreColor = (score) => {
    if (score >= 4.5) return "text-emerald-600";
    if (score >= 3.5) return "text-teal-600";
    if (score >= 3.0) return "text-amber-600";
    return "text-rose-600";
  };

  const getStatusBadge = (status) => {
    if (status === "Published") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700">Published</Badge>
      );
    }
    return <Badge className="bg-amber-50 text-amber-700">Draft</Badge>;
  };

  const canEditFinal = (final) => {
    if (user?.role === "Admin") return true;
    if (user?.role === "PM" && final.status === "Draft") return true;
    return false;
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

  return (
    <div className="flex" data-testid="internal-reviews-page">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                Reviews Management
              </h1>
              <p className="text-lg text-slate-500">
                Manage internal reviews and monthly finals
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-slate-100">
                <TabsTrigger
                  value="internal"
                  className="data-[state=active]:bg-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Internal Reviews ({internalReviews.length})
                </TabsTrigger>
                <TabsTrigger
                  value="finals"
                  className="data-[state=active]:bg-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Monthly Finals ({monthlyFinals.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                {activeTab === "internal" && (
                  <Button
                    className="bg-indigo-950 hover:bg-indigo-900"
                    onClick={() => navigate("/admin/internal-reviews/create")}
                    data-testid="create-internal-review-button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Internal Review
                  </Button>
                )}
                {activeTab === "finals" && (
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => navigate("/admin/monthly-finals/create")}
                    data-testid="create-final-review-button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Monthly Final
                  </Button>
                )}
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Employee
                    </label>
                    <Select
                      value={filters.employee_id || "all"}
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          employee_id: value === "all" ? null : value,
                        })
                      }
                    >
                      <SelectTrigger className="bg-slate-50">
                        <SelectValue placeholder="All Employees" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name} ({emp.role_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Month
                    </label>
                    <Select
                      value={filters.month || "all"}
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          month: value === "all" ? null : value,
                        })
                      }
                    >
                      <SelectTrigger className="bg-slate-50">
                        <SelectValue placeholder="All Months" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
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
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Year
                    </label>
                    <Select
                      value={filters.year}
                      onValueChange={(value) =>
                        setFilters({ ...filters, year: value })
                      }
                    >
                      <SelectTrigger className="bg-slate-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {activeTab === "finals" && (
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Status
                      </label>
                      <Select
                        value={filters.status || "all"}
                        onValueChange={(value) =>
                          setFilters({
                            ...filters,
                            status: value === "all" ? null : value,
                          })
                        }
                      >
                        <SelectTrigger className="bg-slate-50">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Accumulative Rating Summary */}
            {accumulativeRating && (
              <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <TrendingUp className="w-8 h-8 text-indigo-600" />
                      <div>
                        <p className="text-sm text-slate-600">
                          Accumulative Rating for{" "}
                          {accumulativeRating.employee_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Year {filters.year} •{" "}
                          {accumulativeRating.total_reviews} published reviews
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-4xl font-bold ${getScoreColor(parseFloat(accumulativeRating.cumulative_score))}`}
                      >
                        {parseFloat(
                          accumulativeRating.cumulative_score || 0,
                        ).toFixed(2)}
                      </p>
                      <StarRating
                        value={parseFloat(
                          accumulativeRating.cumulative_score || 0,
                        )}
                        readonly
                        size="md"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Internal Reviews Tab */}
            <TabsContent value="internal">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {internalReviews.map((review) => {
                      const avgScore = calculateAvgScore(
                        review.category_ratings,
                      );
                      return (
                        <div
                          key={review.id}
                          className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          data-testid={`internal-review-${review.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-slate-900">
                                  {getEmployeeName(review.employee_id)}
                                </h3>
                                <Badge className="bg-blue-50 text-blue-700">
                                  Internal
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                                <span>
                                  📅{" "}
                                  {new Date(
                                    review.review_cycle_year,
                                    review.review_cycle_month - 1,
                                  ).toLocaleString("default", {
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-2">
                                  Avg Score:{" "}
                                  <span
                                    className={`text-xl font-bold ${getScoreColor(avgScore)}`}
                                  >
                                    {parseFloat(avgScore).toFixed(2)}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <StarRating
                                  value={parseFloat(avgScore)}
                                  readonly
                                  size="sm"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  navigate(`/internal-reviews/${review.id}`)
                                }
                                data-testid={`view-internal-detail-${review.id}`}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                              {user?.role === "Admin" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      navigate(
                                        `/admin/internal-reviews/${review.id}/edit`,
                                      )
                                    }
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleDeleteInternal(review.id)
                                    }
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-600" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {internalReviews.length === 0 && (
                      <div className="text-center py-12 text-slate-500">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p>No internal reviews found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Monthly Finals Tab */}
            <TabsContent value="finals">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {monthlyFinals.map((final) => {
                      const score = final.monthly_score;
                      return (
                        <div
                          key={final.id}
                          className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          data-testid={`monthly-final-${final.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-slate-900">
                                  {getEmployeeName(final.employee_id)}
                                </h3>
                                {getStatusBadge(final.status)}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                                <span>
                                  📅{" "}
                                  {new Date(
                                    final.review_cycle_year,
                                    final.review_cycle_month - 1,
                                  ).toLocaleString("default", {
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-2">
                                  Monthly Score:{" "}
                                  <span
                                    className={`text-xl font-bold ${getScoreColor(parseFloat(score))}`}
                                  >
                                    {parseFloat(score || 0).toFixed(2)}
                                  </span>
                                </span>
                                {final.cumulative_score_snapshot && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-500">
                                      Cumulative:{" "}
                                      {parseFloat(
                                        final.cumulative_score_snapshot || 0,
                                      ).toFixed(2)}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <StarRating
                                  value={parseFloat(score)}
                                  readonly
                                  size="sm"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/reviews/${final.id}`)}
                                data-testid={`view-final-detail-${final.id}`}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                              {canEditFinal(final) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate(
                                      `/admin/monthly-finals/${final.id}/edit`,
                                    )
                                  }
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              {user?.role === "Admin" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteFinal(final.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-rose-600" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {monthlyFinals.length === 0 && (
                      <div className="text-center py-12 text-slate-500">
                        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p>No monthly finals found</p>
                        <p className="text-sm mt-1">
                          Create a new monthly final review
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default InternalReviewsPage;
