import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Edit, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import StarRating from '@/components/StarRating';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ReviewsPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    employee_id: null,
    month: null,
    year: new Date().getFullYear().toString(),
    status: null
  });

  useEffect(() => {
    fetchEmployees();
    fetchReviews();
  }, [filters]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to load employees');
    }
  };

  const fetchReviews = async () => {
    try {
      const params = {};
      if (filters.employee_id) params.employee_id = filters.employee_id;
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = filters.year;
      if (filters.status) params.status = filters.status;

      const response = await axios.get(`${API_URL}/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setReviews(response.data);
    } catch (error) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (reviewId) => {
    if (!window.confirm('Are you sure you want to publish this review? It will be visible to the employee.')) return;
    
    try {
      await axios.post(`${API_URL}/reviews/${reviewId}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Review published successfully');
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to publish review');
    }
  };

  const handleUnpublish = async (reviewId) => {
    if (!window.confirm('Unpublish this review? It will be hidden from the employee.')) return;
    
    try {
      await axios.post(`${API_URL}/reviews/${reviewId}/unpublish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Review unpublished');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to unpublish review');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await axios.delete(`${API_URL}/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.full_name : 'Unknown';
  };

  const getScoreColor = (score) => {
    if (score >= 4.1) return 'text-emerald-600';
    if (score >= 3.6) return 'text-teal-600';
    if (score >= 3.1) return 'text-amber-600';
    return 'text-rose-600';
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
    <div className="flex" data-testid="reviews-page">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Reviews</h1>
              <p className="text-lg text-slate-500">Manage monthly employee reviews</p>
            </div>
            {(user?.role === 'Admin' || user?.role === 'PM') && (
              <Button
                className="bg-indigo-950 hover:bg-indigo-900"
                onClick={() => navigate('/admin/reviews/create')}
                data-testid="create-review-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Review
              </Button>
            )}
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Employee</label>
                  <Select value={filters.employee_id || "all"} onValueChange={(value) => setFilters({...filters, employee_id: value === "all" ? null : value})}>
                    <SelectTrigger className="bg-slate-50">
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Month</label>
                  <Select value={filters.month || "all"} onValueChange={(value) => setFilters({...filters, month: value === "all" ? null : value})}>
                    <SelectTrigger className="bg-slate-50">
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {[...Array(12)].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Year</label>
                  <Select value={filters.year} onValueChange={(value) => setFilters({...filters, year: value})}>
                    <SelectTrigger className="bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
                  <Select value={filters.status || "all"} onValueChange={(value) => setFilters({...filters, status: value === "all" ? null : value})}>
                    <SelectTrigger className="bg-slate-50">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    data-testid={`review-card-${review.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {getEmployeeName(review.employee_id)}
                          </h3>
                          <Badge className={review.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                            {review.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                          <span>📅 {new Date(2024, review.review_cycle_month - 1).toLocaleString('default', { month: 'long' })} {review.review_cycle_year}</span>
                          <span>•</span>
                          <span className="flex items-center gap-2">
                            Score: <span className={`text-xl font-bold ${getScoreColor(review.monthly_score)}`}>{review.monthly_score}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StarRating value={review.monthly_score} readonly />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {user?.role === 'Admin' && review.status === 'Draft' && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handlePublish(review.id)}
                            data-testid={`publish-review-${review.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Publish
                          </Button>
                        )}
                        {user?.role === 'Admin' && review.status === 'Published' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnpublish(review.id)}
                          >
                            Unpublish
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/employees/${review.employee_id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(user?.role === 'Admin' || (user?.role === 'PM' && review.status === 'Draft')) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/admin/reviews/${review.id}/edit`)}
                            data-testid={`edit-review-${review.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {user?.role === 'Admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(review.id)}
                            data-testid={`delete-review-${review.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    No reviews found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage;
