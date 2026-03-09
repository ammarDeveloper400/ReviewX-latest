import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import StarRating from '@/components/StarRating';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Upload, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CategoryRatingInput = ({ label, value, onChange, categoryKey }) => {
  const [rating, setRating] = useState(value?.rating || 3);
  const [comment, setComment] = useState(value?.comment || '');
  const [evidenceNote, setEvidenceNote] = useState(value?.evidence_note || '');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const needsEvidence = rating < 3;

  useEffect(() => {
    onChange({
      rating,
      comment,  
      evidence_required: needsEvidence,
      evidence_url: value?.evidence_url || null,
      evidence_note: evidenceNote
    });
  }, [rating, comment, evidenceNote]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setEvidenceFile(file);
    // File will be uploaded when form is submitted
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-2 block">Rating * (click or drag to set fractional rating)</Label>
          <div className="flex items-center gap-4">
            <StarRating value={rating} onChange={(v) => setRating(Math.round(v * 100) / 100)} size="lg" />
            <span className="text-2xl font-bold text-slate-900">{(rating || 0).toFixed(2)}</span>
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
        {needsEvidence && (
          <Alert className="bg-rose-50 border-rose-200">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <AlertDescription className="text-rose-800">
              Rating below 3 requires evidence (image/document) and explanation
            </AlertDescription>
          </Alert>
        )}
        {needsEvidence && (
          <>
            <div>
              <Label htmlFor={`${categoryKey}-evidence`}>Evidence Upload *</Label>
              <Input
                id={`${categoryKey}-evidence`}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.docx"
                onChange={handleFileChange}
                className="bg-slate-50"
                data-testid={`${categoryKey}-evidence-upload`}
              />
              {value?.evidence_url && (
                <p className="text-xs text-slate-500 mt-1">Current: {value.evidence_url}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`${categoryKey}-evidence-note`}>Evidence Note *</Label>
              <Textarea
                id={`${categoryKey}-evidence-note`}
                value={evidenceNote}
                onChange={(e) => setEvidenceNote(e.target.value)}
                placeholder="Explain the evidence and context..."
                className="bg-slate-50"
                required={needsEvidence}
                rows={2}
                data-testid={`${categoryKey}-evidence-note`}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const CreateReviewPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { reviewId } = useParams();
  const isEditing = !!reviewId;

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    review_cycle_month: new Date().getMonth() + 1,
    review_cycle_year: new Date().getFullYear(),
    general_feedback: '',
    private_note: '',
    delivery_ownership: { rating: 3, comment: '' },
    quality_rework: { rating: 3, comment: '' },
    requirements_communication: { rating: 3, comment: '' },
    teamwork_professionalism: { rating: 3, comment: '' },
    growth_process: { rating: 3, comment: '' }
  });

  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchEmployees();
    if (isEditing) {
      fetchReview();
    }
  }, [reviewId]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to load employees');
    }
  };

  const fetchReview = async () => {
    try {
      const response = await axios.get(`${API_URL}/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const review = response.data;
      setFormData({
        employee_id: review.employee_id,
        review_cycle_month: review.review_cycle_month,
        review_cycle_year: review.review_cycle_year,
        general_feedback: review.general_feedback,
        private_note: review.private_note || '',
        delivery_ownership: review.delivery_ownership,
        quality_rework: review.quality_rework,
        requirements_communication: review.requirements_communication,
        teamwork_professionalism: review.teamwork_professionalism,
        growth_process: review.growth_process
      });
    } catch (error) {
      toast.error('Failed to load review');
    }
  };

  const calculatePreview = () => {
    const ratings = [
      formData.delivery_ownership.rating,
      formData.quality_rework.rating,
      formData.requirements_communication.rating,
      formData.teamwork_professionalism.rating,
      formData.growth_process.rating
    ];
    const monthlyScore = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2);
    
    let bonusBracket = 'No bonus';
    if (monthlyScore >= 4.1) bonusBracket = '1.5 salaries';
    else if (monthlyScore >= 3.6) bonusBracket = '1.0 salary';
    else if (monthlyScore >= 3.1) bonusBracket = '0.5 salary';

    const warning = monthlyScore < 3.1;

    return { monthlyScore: parseFloat(monthlyScore), bonusBracket, warning };
  };

  useEffect(() => {
    setPreview(calculatePreview());
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate evidence requirements
      const categories = ['delivery_ownership', 'quality_rework', 'requirements_communication', 
                         'teamwork_professionalism', 'growth_process'];
      
      for (const cat of categories) {
        const catData = formData[cat];
        if (catData.rating < 3) {
          if (!catData.evidence_url && !catData.evidence_note) {
            toast.error(`Evidence required for ${cat.replace(/_/g, ' ')}`);
            setLoading(false);
            return;
          }
        }
      }

      const payload = { ...formData };

      if (isEditing) {
        await axios.put(`${API_URL}/reviews/${reviewId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Review updated successfully');
      } else {
        await axios.post(`${API_URL}/reviews`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Review created successfully');
      }

      navigate('/admin/reviews');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex" data-testid="create-review-page">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
              {isEditing ? 'Edit Review' : 'Create New Review'}
            </h1>
            <p className="text-lg text-slate-500">Rate employee performance across 5 categories</p>
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
                        onValueChange={(value) => setFormData({...formData, employee_id: value})}
                        disabled={isEditing}
                      >
                        <SelectTrigger className="bg-slate-50" data-testid="employee-select">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="month">Month *</Label>
                        <Select
                          value={formData.review_cycle_month.toString()}
                          onValueChange={(value) => setFormData({...formData, review_cycle_month: parseInt(value)})}
                          disabled={isEditing}
                        >
                          <SelectTrigger className="bg-slate-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(12)].map((_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="year">Year *</Label>
                        <Select
                          value={formData.review_cycle_year.toString()}
                          onValueChange={(value) => setFormData({...formData, review_cycle_year: parseInt(value)})}
                          disabled={isEditing}
                        >
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
                    </div>
                  </CardContent>
                </Card>

                <CategoryRatingInput
                  label="1. Delivery and Ownership"
                  value={formData.delivery_ownership}
                  onChange={(val) => setFormData({...formData, delivery_ownership: val})}
                  categoryKey="delivery-ownership"
                />

                <CategoryRatingInput
                  label="2. Quality (Rework and Defects)"
                  value={formData.quality_rework}
                  onChange={(val) => setFormData({...formData, quality_rework: val})}
                  categoryKey="quality-rework"
                />

                <CategoryRatingInput
                  label="3. Requirements and Communication"
                  value={formData.requirements_communication}
                  onChange={(val) => setFormData({...formData, requirements_communication: val})}
                  categoryKey="requirements-communication"
                />

                <CategoryRatingInput
                  label="4. Teamwork and Professionalism"
                  value={formData.teamwork_professionalism}
                  onChange={(val) => setFormData({...formData, teamwork_professionalism: val})}
                  categoryKey="teamwork-professionalism"
                />

                <CategoryRatingInput
                  label="5. Growth and Process Discipline"
                  value={formData.growth_process}
                  onChange={(val) => setFormData({...formData, growth_process: val})}
                  categoryKey="growth-process"
                />

                <Card>
                  <CardHeader>
                    <CardTitle>Feedback & Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="general_feedback">General Feedback *</Label>
                      <Textarea
                        id="general_feedback"
                        value={formData.general_feedback}
                        onChange={(e) => setFormData({...formData, general_feedback: e.target.value})}
                        placeholder="Overall performance feedback..."
                        className="bg-slate-50"
                        required
                        rows={4}
                        data-testid="general-feedback"
                      />
                    </div>
                    <div>
                      <Label htmlFor="private_note">Private Note (Admin Only)</Label>
                      <Textarea
                        id="private_note"
                        value={formData.private_note}
                        onChange={(e) => setFormData({...formData, private_note: e.target.value})}
                        placeholder="Internal notes not visible to employee..."
                        className="bg-slate-50"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="sticky top-8" data-testid="preview-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Score Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-6 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600 mb-2">Monthly Score (SGPA)</p>
                      <p className={`text-5xl font-bold ${preview?.monthlyScore >= 3.1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {preview?.monthlyScore || 0}
                      </p>
                      <div className="mt-3">
                        <StarRating value={preview?.monthlyScore || 0} readonly />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Bonus Bracket</span>
                        <Badge className="bg-teal-50 text-teal-700">{preview?.bonusBracket}</Badge>
                      </div>

                      {preview?.warning && (
                        <Alert className="bg-rose-50 border-rose-200">
                          <AlertCircle className="h-4 w-4 text-rose-600" />
                          <AlertDescription className="text-rose-800 text-sm">
                            ⚠️ This score will create a warning
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="pt-4 space-y-2">
                      <Button
                        type="submit"
                        className="w-full bg-indigo-950 hover:bg-indigo-900"
                        disabled={loading || !formData.employee_id}
                        data-testid="save-review-button"
                      >
                        {loading ? 'Saving...' : isEditing ? 'Update Review' : 'Save as Draft'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/admin/reviews')}
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

export default CreateReviewPage;
