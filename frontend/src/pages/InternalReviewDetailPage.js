import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import StarRating from '@/components/StarRating';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Calendar, Award, MessageSquare, FileText, Link as LinkIcon, AlertCircle, Image, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const InternalReviewDetailPage = () => {
  const { token } = useAuth();
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/internal-reviews/${reviewId}/detail`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReview(response.data);
      } catch (error) {
        if (error.response?.status === 403) {
          toast.error('You do not have permission to view this review');
          navigate(-1);
        } else if (error.response?.status === 404) {
          toast.error('Review not found');
          navigate(-1);
        } else {
          toast.error('Failed to load review details');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [reviewId, token, navigate]);

  const getScoreColor = (score) => {
    if (score >= 4.5) return 'text-emerald-600';
    if (score >= 3.5) return 'text-teal-600';
    if (score >= 3.0) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 4.5) return 'bg-emerald-50 border-emerald-200';
    if (score >= 3.5) return 'bg-teal-50 border-teal-200';
    if (score >= 3.0) return 'bg-amber-50 border-amber-200';
    return 'bg-rose-50 border-rose-200';
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
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
            <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex" data-testid="internal-review-detail-page">
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
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight" data-testid="review-title">
                    {new Date(review.review_cycle_year, review.review_cycle_month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })} Internal Review
                  </h1>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                    Internal
                  </Badge>
                  {review.is_part_of_published_final && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Included in Final
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{review.employee?.full_name}</span>
                  </div>
                  <span>•</span>
                  <Badge className="bg-indigo-50 text-indigo-700">
                    {review.employee?.role_type}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Score Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className={`${getScoreBgColor(review.avg_score)} border`} data-testid="avg-score-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold mb-2 ${getScoreColor(review.avg_score)}`}>
                  {(review.avg_score || 0).toFixed(2)}
                </div>
                <StarRating value={review.avg_score} readonly size="md" />
              </CardContent>
            </Card>

            <Card data-testid="reviewer-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Reviewer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900">{review.reviewer?.email}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {review.reviewer?.role}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="review-info-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Review Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Created:</span>
                    <span className="font-medium">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.updated_at && review.updated_at !== review.created_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Updated:</span>
                      <span className="font-medium">{new Date(review.updated_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Categories:</span>
                    <span className="font-medium">{Object.keys(review.category_details || {}).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Final Link */}
          {review.is_part_of_published_final && review.monthly_final_id && (
            <Card className="mb-8 bg-emerald-50 border-emerald-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-800">
                      This review was included in the published Monthly Final
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/reviews/${review.monthly_final_id}`)}
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  >
                    View Monthly Final
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
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
                {Object.entries(review.category_details || {}).map(([catId, category]) => (
                  <div key={catId} className="border border-slate-200 rounded-lg p-5" data-testid={`category-${catId}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                          {category.category_title}
                        </h3>
                        {category.criteria_text && (
                          <p className="text-sm text-slate-600 mb-2">{category.criteria_text}</p>
                        )}
                        {category.criteria_bullets && (
                          <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg mt-2">
                            <p className="font-medium mb-1">Evaluation Criteria:</p>
                            <div className="whitespace-pre-wrap">{category.criteria_bullets}</div>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-3xl font-bold ${getScoreColor(category.rating)}`}>
                          {(category.rating || 0).toFixed(2)}
                        </div>
                        <StarRating value={category.rating} readonly size="md" />
                      </div>
                    </div>

                    {/* Comment for this category */}
                    {category.comment && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Comment
                        </h4>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-slate-700">{category.comment}</p>
                        </div>
                      </div>
                    )}

                    {/* Evidence for this category */}
                    {(category.evidence_url || category.evidence_note) && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                          <LinkIcon className="w-4 h-4" />
                          Evidence
                        </h4>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          {category.evidence_note && (
                            <p className="text-amber-900 mb-2">{category.evidence_note}</p>
                          )}
                          {category.evidence_url && (
                            <div className="mt-2">
                              {isImageUrl(category.evidence_url) ? (
                                <div className="space-y-2">
                                  <a 
                                    href={category.evidence_url.startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${category.evidence_url}` : category.evidence_url}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img 
                                      src={category.evidence_url.startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${category.evidence_url}` : category.evidence_url}
                                      alt="Evidence"
                                      className="max-w-sm rounded-lg border border-amber-300 hover:opacity-90 transition-opacity"
                                    />
                                  </a>
                                  <div className="flex items-center gap-1 text-sm text-indigo-600">
                                    <Image className="w-3 h-3" />
                                    <span>Click image to view full size</span>
                                  </div>
                                </div>
                              ) : (
                                <a 
                                  href={category.evidence_url.startsWith('/') ? `${process.env.REACT_APP_BACKEND_URL}${category.evidence_url}` : category.evidence_url}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline text-sm flex items-center gap-1"
                                >
                                  <LinkIcon className="w-3 h-3" />
                                  {category.evidence_url}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* General Feedback Section */}
          {review.general_feedback && (
            <Card className="mb-8" data-testid="general-feedback-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  General Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-slate-700 whitespace-pre-wrap">{review.general_feedback}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Private Note Section (Admin/PM only can see this) */}
          {review.private_note && (
            <Card data-testid="private-note-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Private Note
                  <Badge variant="outline" className="ml-2 text-xs">Internal Only</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-100 rounded-lg p-4 border border-slate-300">
                  <p className="text-slate-700 whitespace-pre-wrap">{review.private_note}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternalReviewDetailPage;
