import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import StarRating from '@/components/StarRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, TrendingUp, AlertTriangle, Award, Eye, Filter } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EmployeePortal = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Date range filter state
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear().toString();
  const currentMonth = (currentDate.getMonth() + 1).toString();
  const [filterType, setFilterType] = useState('year'); // 'year' or 'custom'
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  // Custom range state - supports spanning multiple years
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [startYear, setStartYear] = useState(currentYear);
  const [endMonth, setEndMonth] = useState(currentMonth);
  const [endYear, setEndYear] = useState(currentYear);
  
  // Generate year options (current year + last 5 years)
  const yearOptions = [2026, 2025, 2024, 2023, 2022, 2021];
  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  useEffect(() => {
    if (user?.linked_employee_id) {
      fetchPerformance();
    }
  }, [user, selectedYear, startMonth, startYear, endMonth, endYear, filterType]);

  const fetchPerformance = async () => {
    try {
      let params = {};
      
      if (filterType === 'year') {
        params = { year: selectedYear };
      } else {
        // Custom range - can span multiple years (e.g., July 2025 to March 2026)
        params = {
          start_month: parseInt(startMonth),
          start_year: parseInt(startYear),
          end_month: parseInt(endMonth),
          end_year: parseInt(endYear)
        };
      }
      
      const response = await axios.get(
        `${API_URL}/employees/${user.linked_employee_id}/performance`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          params
        }
      );
      
      setPerformance(response.data);
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data.detail || 'Invalid date range');
      } else {
        toast.error('Failed to load performance data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getBonusBracketColor = (multiplier) => {
    if (multiplier >= 1.5) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (multiplier >= 1.0) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (multiplier >= 0.5) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getScoreColor = (score) => {
    if (score >= 4.5) return 'text-emerald-600';
    if (score >= 3.5) return 'text-teal-600';
    if (score >= 3.0) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getFilterLabel = () => {
    if (filterType === 'year') {
      return selectedYear;
    } else {
      const startLabel = monthOptions.find(m => m.value === startMonth)?.label || startMonth;
      const endLabel = monthOptions.find(m => m.value === endMonth)?.label || endMonth;
      if (startYear === endYear) {
        return `${startLabel} - ${endLabel} ${startYear}`;
      }
      return `${startLabel} ${startYear} - ${endLabel} ${endYear}`;
    }
  };

  // Validate custom date range
  const isValidCustomRange = () => {
    const start = parseInt(startYear) * 12 + parseInt(startMonth);
    const end = parseInt(endYear) * 12 + parseInt(endMonth);
    return start <= end;
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
    <div className="flex" data-testid="employee-portal">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                My Performance
              </h1>
              <p className="text-lg text-slate-500">View your reviews and performance metrics</p>
            </div>
          </div>

          {/* Filters Card */}
          <Card className="mb-6 bg-slate-50 border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Filter:</span>
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40 bg-white" data-testid="filter-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year">Full Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>

                {filterType === 'year' && (
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-28 bg-white" data-testid="year-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {filterType === 'custom' && (
                  <>
                    <span className="text-sm text-slate-500">From</span>
                    <Select value={startMonth} onValueChange={setStartMonth}>
                      <SelectTrigger className="w-32 bg-white" data-testid="start-month">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map(month => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={startYear} onValueChange={setStartYear}>
                      <SelectTrigger className="w-24 bg-white" data-testid="start-year">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <span className="text-sm text-slate-500">To</span>
                    <Select value={endMonth} onValueChange={setEndMonth}>
                      <SelectTrigger className="w-32 bg-white" data-testid="end-month">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map(month => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={endYear} onValueChange={setEndYear}>
                      <SelectTrigger className="w-24 bg-white" data-testid="end-year">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {!isValidCustomRange() && (
                      <Badge className="bg-rose-50 text-rose-700 border-rose-200">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Invalid range
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Cumulative Score Card */}
            <Card data-testid="cumulative-score-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Cumulative Score
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold mb-2 ${getScoreColor(parseFloat(performance?.cumulative_score) || 0)}`}>
                  {parseFloat(performance?.cumulative_score || 0).toFixed(2)}
                </div>
                <StarRating value={parseFloat(performance?.cumulative_score || 0)} readonly size="md" />
                <p className="text-xs text-slate-500 mt-2">
                  Average of published reviews • {getFilterLabel()}
                </p>
              </CardContent>
            </Card>

            {/* Bonus Bracket Card */}
            <Card data-testid="bonus-bracket-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Bonus Bracket
                </CardTitle>
                <Award className="w-5 h-5 text-teal-600" />
              </CardHeader>
              <CardContent>
                {performance?.bonus_bracket ? (
                  <>
                    <Badge className={`text-lg py-2 px-3 ${getBonusBracketColor(parseFloat(performance.bonus_bracket.multiplier))}`}>
                      {performance.bonus_bracket.label}
                    </Badge>
                    <p className="text-sm text-slate-600 mt-3">
                      Score Range: {parseFloat(performance.bonus_bracket.min || 0).toFixed(2)} - {parseFloat(performance.bonus_bracket.max || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Multiplier: {performance.bonus_bracket.multiplier}x base salary
                    </p>
                  </>
                ) : (
                  <>
                    <Badge className="text-lg py-2 px-3 bg-slate-100 text-slate-600">
                      No Bonus Bracket
                    </Badge>
                    <p className="text-sm text-slate-500 mt-3">
                      Score Range: 0.00 - 3.09
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      No reviews published yet for selected period
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Total Reviews Card */}
            <Card data-testid="total-reviews-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Reviews
                </CardTitle>
                <FileText className="w-5 h-5 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">
                  {performance?.total_reviews || 0}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Published monthly final reviews • {getFilterLabel()}
                </p>
                {performance?.warning_count > 0 && (
                  <Badge className="bg-rose-50 text-rose-700 mt-2">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {performance.warning_count} {performance.warning_count === 1 ? 'Warning' : 'Warnings'}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {performance?.warning_count >= 3 && (
            <Alert className="bg-rose-50 border-rose-200 mb-6">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              <AlertDescription className="text-rose-800">
                <strong>Important:</strong> You have received {performance.warning_count} warnings. Please discuss with your manager to improve performance.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>My Reviews</span>
                <Badge variant="outline">{getFilterLabel()}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performance?.monthly_finals?.filter(r => r.status === 'Published').map((review) => (
                  <div
                    key={review.id}
                    className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
                    data-testid={`review-card-${review.id}`}
                    onClick={() => navigate(`/reviews/${review.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-1">
                          {new Date(review.review_cycle_year, review.review_cycle_month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <Badge className="bg-emerald-50 text-emerald-700">
                          Published
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className={`text-4xl font-bold mb-1 ${getScoreColor(parseFloat(review.monthly_score))}`}>
                          {parseFloat(review.monthly_score || 0).toFixed(2)}
                        </div>
                        <StarRating value={parseFloat(review.monthly_score)} readonly size="md" />
                      </div>
                    </div>

                    {review.general_feedback && (
                      <div className="bg-slate-50 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-slate-700 mb-1">General Feedback:</p>
                        <p className="text-slate-700">{review.general_feedback}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                      {Object.entries(review.final_category_averages || review.final_category_ratings || {}).map(([catId, value], idx) => {
                        const rating = typeof value === 'object' ? value.rating : value;
                        return (
                          <div key={idx} className="text-center p-3 bg-white rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-500 mb-1 font-medium">Category {idx + 1}</p>
                            <div className="flex justify-center mb-1">
                              <StarRating value={rating} readonly size="sm" />
                            </div>
                            <p className="text-lg font-bold text-slate-900">{parseFloat(rating || 0).toFixed(2)}</p>
                          </div>
                        );
                      })}
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      data-testid={`view-detail-${review.id}`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Full Details
                    </Button>
                  </div>
                ))}
                {(!performance?.monthly_finals || performance.monthly_finals.filter(r => r.status === 'Published').length === 0) && (
                  <div className="text-center py-12 text-slate-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg">No reviews available for {getFilterLabel()}</p>
                    <p className="text-sm">Your manager will publish your reviews soon</p>
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

export default EmployeePortal;
