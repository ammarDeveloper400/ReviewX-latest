import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import StarRating from '@/components/StarRating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, TrendingUp, Award, Eye, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PMMyReviewsPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [cumulativeScore, setCumulativeScore] = useState(0);
  const [bonusBracket, setBonusBracket] = useState(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    fetchMyReviews();
  }, [selectedYear]);

  const fetchMyReviews = async () => {
    try {
      let url = `${API_URL}/pm/my-reviews`;
      if (selectedYear !== 'all') {
        url += `?year=${selectedYear}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReviews(response.data.reviews || []);
      setCumulativeScore(parseFloat(response.data.cumulative_score) || 0);
      setBonusBracket(response.data.bonus_bracket);
      setTotalReviews(response.data.total_reviews || 0);
      setAvailableYears(response.data.available_years || []);
    } catch (error) {
      toast.error('Failed to load your reviews');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 4.5) return 'text-emerald-600';
    if (score >= 3.5) return 'text-teal-600';
    if (score >= 3.0) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getBonusBracketColor = (multiplier) => {
    if (multiplier >= 1.5) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (multiplier >= 1.0) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (multiplier >= 0.5) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
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
    <div className="flex" data-testid="pm-my-reviews-page">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                My Reviews
              </h1>
              <p className="text-lg text-slate-500">View your performance reviews and ratings</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32" data-testid="year-filter">
                  <SelectValue placeholder="Filter year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card data-testid="cumulative-score-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Cumulative Score
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold mb-2 ${getScoreColor(cumulativeScore)}`}>
                  {cumulativeScore.toFixed(2)}
                </div>
                <StarRating value={cumulativeScore} readonly size="md" />
                <p className="text-xs text-slate-500 mt-2">
                  Average of published reviews
                </p>
              </CardContent>
            </Card>

            <Card data-testid="bonus-bracket-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Bonus Bracket
                </CardTitle>
                <Award className="w-5 h-5 text-teal-600" />
              </CardHeader>
              <CardContent>
                {bonusBracket ? (
                  <>
                    <Badge className={`text-lg py-2 px-3 ${getBonusBracketColor(parseFloat(bonusBracket.multiplier))}`}>
                      {bonusBracket.label}
                    </Badge>
                    <p className="text-sm text-slate-600 mt-3">
                      Score Range: {parseFloat(bonusBracket.min || 0).toFixed(2)} - {parseFloat(bonusBracket.max || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Multiplier: {bonusBracket.multiplier}x
                    </p>
                  </>
                ) : (
                  <Badge className="text-lg py-2 px-3 bg-slate-100 text-slate-600">
                    No reviews yet
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card data-testid="total-reviews-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Reviews
                </CardTitle>
                <FileText className="w-5 h-5 text-slate-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">
                  {totalReviews}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Published monthly final reviews
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Reviews List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Published Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
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

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                        {Object.entries(review.final_category_averages || {}).map(([catId, value], idx) => {
                          const rating = typeof value === 'object' ? value.rating : value;
                          return (
                            <div key={idx} className="text-center p-3 bg-white rounded-lg border border-slate-200">
                              <p className="text-xs text-slate-500 mb-1 font-medium">Category {idx + 1}</p>
                              <div className="flex justify-center mb-1">
                                <StarRating value={parseFloat(rating)} readonly size="sm" />
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
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg">No reviews available yet</p>
                    <p className="text-sm">Your reviews will appear here once published by Admin</p>
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

export default PMMyReviewsPage;
