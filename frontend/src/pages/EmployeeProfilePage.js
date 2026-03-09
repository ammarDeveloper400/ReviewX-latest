import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import StarRating from '@/components/StarRating';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, TrendingUp, FileText, MessageSquare, ArrowLeft, Eye } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EmployeeProfilePage = () => {
  const { token, user } = useAuth();
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchEmployeeData();
    if (user?.role !== 'Employee') {
      fetchNotes();
    }
  }, [employeeId]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const fetchEmployeeData = async () => {
    try {
      const [empResponse, perfResponse] = await Promise.all([
        axios.get(`${API_URL}/employees/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/employees/${employeeId}/performance`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setEmployee(empResponse.data);
      setPerformance(perfResponse.data);
    } catch (error) {
      toast.error('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_URL}/notes/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(response.data);
    } catch (error) {
      console.error('Failed to load notes');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await axios.post(
        `${API_URL}/notes`,
        { employee_id: employeeId, note_text: newNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Note added successfully');
      setNewNote('');
      fetchNotes();
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700';
      case 'Inactive': return 'bg-slate-200 text-slate-700';
      case 'Termination Recommended': return 'bg-rose-50 text-rose-700';
      case 'Terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-700';
    }
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
    <div className="flex" data-testid="employee-profile-page">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                  {employee?.full_name}
                </h1>
                <div className="flex items-center gap-3 text-lg text-slate-600">
                  <span>{employee?.email}</span>
                  <span>•</span>
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {employee?.role_type}
                  </Badge>
                  <Badge className={getStatusColor(employee?.status)}>
                    {employee?.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card data-testid="cumulative-score-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Cumulative Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-indigo-950 mb-2">
                  {(performance?.cumulative_score || 0).toFixed(2)}
                </div>
                <StarRating value={performance?.cumulative_score || 0} readonly size="md" />
              </CardContent>
            </Card>

            {performance?.bonus_bracket && (
              <Card data-testid="bonus-bracket-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Bonus Bracket</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={`text-lg py-2 px-3 ${getBonusBracketColor(performance.bonus_bracket.multiplier)}`}>
                    {performance.bonus_bracket.label}
                  </Badge>
                  {employee?.base_salary && (
                    <p className="text-sm text-slate-600 mt-2">
                      ≈ PKR {(employee.base_salary * performance.bonus_bracket.multiplier).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card data-testid="warnings-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${performance?.warning_count > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {performance?.warning_count || 0}
                </div>
                {performance?.warning_count >= 3 && (
                  <Badge className="bg-rose-100 text-rose-800 mt-2">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Termination Risk
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Total Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">
                  {performance?.monthly_finals?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="reviews" className="space-y-6">
            <TabsList>
              <TabsTrigger value="reviews" data-testid="reviews-tab">
                <FileText className="w-4 h-4 mr-2" />
                Reviews
              </TabsTrigger>
              {user?.role !== 'Employee' && (
                <TabsTrigger value="notes" data-testid="notes-tab">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Internal Notes
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle>Review History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performance?.monthly_finals?.map((review) => (
                      <div
                        key={review.id}
                        className="border border-slate-200 rounded-lg p-4"
                        data-testid={`review-item-${review.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {new Date(review.review_cycle_year, review.review_cycle_month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h4>
                            <Badge className={review.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                              {review.status}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-indigo-950">
                              {(review.monthly_score || 0).toFixed(2)}
                            </div>
                            <StarRating value={review.monthly_score} readonly size="md" />
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-slate-600 font-medium mb-1">Monthly Final Score</p>
                          <p className="text-sm text-slate-700">
                            This is an aggregated score from {Object.keys(review.final_category_averages || {}).length} internal reviews.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 mb-4">
                          {Object.entries(review.final_category_averages || {}).map(([catId, rating], idx) => {
                            const category = categories.find(c => c.id === catId);
                            return (
                              <div key={catId} className="text-center p-2 bg-white rounded border border-slate-200">
                                <p className="text-xs text-slate-500 mb-1">{category?.title || `Category ${idx + 1}`}</p>
                                <p className="text-lg font-bold text-slate-900">{(rating || 0).toFixed(2)}</p>
                              </div>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => navigate(`/reviews/${review.id}`)}
                          data-testid={`view-review-detail-${review.id}`}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Full Details
                        </Button>
                      </div>
                    ))}
                    {(!performance?.monthly_finals || performance.monthly_finals.length === 0) && (
                      <div className="text-center py-12 text-slate-500">
                        No reviews yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {user?.role !== 'Employee' && (
              <TabsContent value="notes">
                <Card>
                  <CardHeader>
                    <CardTitle>Internal Notes (Admin/PM Only)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-note">Add New Note</Label>
                      <Textarea
                        id="new-note"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add internal note..."
                        className="bg-slate-50"
                        rows={3}
                        data-testid="new-note-input"
                      />
                      <Button
                        onClick={handleAddNote}
                        className="bg-indigo-950 hover:bg-indigo-900"
                        disabled={!newNote.trim()}
                        data-testid="add-note-button"
                      >
                        Add Note
                      </Button>
                    </div>

                    <div className="space-y-3 mt-6">
                      {notes.map((note) => (
                        <div key={note.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-medium text-slate-900">Note</p>
                            <p className="text-xs text-slate-500">
                              {new Date(note.note_date).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-slate-700">{note.note_text}</p>
                        </div>
                      ))}
                      {notes.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                          No internal notes yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfilePage;
