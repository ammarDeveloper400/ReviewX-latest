import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BonusBracketManagementPage = () => {
  const { token } = useAuth();
  const [brackets, setBrackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBracket, setEditingBracket] = useState(null);
  const [formData, setFormData] = useState({
    min_rating: 0,
    max_rating: 5,
    bonus_multiplier: 0,
    label: ''
  });

  useEffect(() => {
    fetchBrackets();
  }, []);

  const fetchBrackets = async () => {
    try {
      const response = await axios.get(`${API_URL}/bonus-brackets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBrackets(response.data);
    } catch (error) {
      toast.error('Failed to load bonus brackets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        min_rating: parseFloat(formData.min_rating),
        max_rating: parseFloat(formData.max_rating),
        bonus_multiplier: parseFloat(formData.bonus_multiplier)
      };

      if (editingBracket) {
        await axios.put(`${API_URL}/bonus-brackets/${editingBracket.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Bonus bracket updated successfully');
      } else {
        await axios.post(`${API_URL}/bonus-brackets`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Bonus bracket created successfully');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchBrackets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save bonus bracket');
    }
  };

  const handleEdit = (bracket) => {
    setEditingBracket(bracket);
    setFormData({
      min_rating: bracket.min_rating,
      max_rating: bracket.max_rating,
      bonus_multiplier: bracket.bonus_multiplier,
      label: bracket.label
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (bracketId) => {
    if (!window.confirm('Delete this bonus bracket?')) return;
    
    try {
      await axios.delete(`${API_URL}/bonus-brackets/${bracketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Bonus bracket deleted successfully');
      fetchBrackets();
    } catch (error) {
      toast.error('Failed to delete bonus bracket');
    }
  };

  const resetForm = () => {
    setFormData({
      min_rating: 0,
      max_rating: 5,
      bonus_multiplier: 0,
      label: ''
    });
    setEditingBracket(null);
  };

  const getBracketColor = (multiplier) => {
    if (multiplier >= 1.5) return 'bg-emerald-50 border-emerald-200';
    if (multiplier >= 1.0) return 'bg-teal-50 border-teal-200';
    if (multiplier >= 0.5) return 'bg-amber-50 border-amber-200';
    return 'bg-slate-100 border-slate-200';
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
    <div className="flex" data-testid="bonus-bracket-page">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Bonus Bracket Management</h1>
              <p className="text-lg text-slate-500">Configure dynamic bonus multiplier ranges based on performance scores</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-950 hover:bg-indigo-900" data-testid="add-bracket-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bracket
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBracket ? 'Edit Bonus Bracket' : 'Add New Bonus Bracket'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min_rating">Min Rating *</Label>
                      <Input
                        id="min_rating"
                        type="number"
                        step="0.01"
                        value={formData.min_rating}
                        onChange={(e) => setFormData({...formData, min_rating: e.target.value})}
                        required
                        className="bg-slate-50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_rating">Max Rating *</Label>
                      <Input
                        id="max_rating"
                        type="number"
                        step="0.01"
                        value={formData.max_rating}
                        onChange={(e) => setFormData({...formData, max_rating: e.target.value})}
                        required
                        className="bg-slate-50"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bonus_multiplier">Bonus Multiplier *</Label>
                    <Input
                      id="bonus_multiplier"
                      type="number"
                      step="0.1"
                      value={formData.bonus_multiplier}
                      onChange={(e) => setFormData({...formData, bonus_multiplier: e.target.value})}
                      required
                      placeholder="e.g., 1.5 for 1.5 salaries"
                      className="bg-slate-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="label">Label *</Label>
                    <Input
                      id="label"
                      value={formData.label}
                      onChange={(e) => setFormData({...formData, label: e.target.value})}
                      required
                      placeholder="e.g., 1.5 salaries"
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-indigo-950 hover:bg-indigo-900">
                      {editingBracket ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {brackets.map((bracket) => (
              <Card key={bracket.id} className={`border-2 ${getBracketColor(bracket.bonus_multiplier)}`} data-testid={`bracket-${bracket.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{bracket.label}</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">
                        Score Range: {bracket.min_rating} - {bracket.max_rating}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-indigo-950">{bracket.bonus_multiplier}x</div>
                      <p className="text-xs text-slate-500">Multiplier</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(bracket)}
                      data-testid={`edit-bracket-${bracket.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(bracket.id)}
                      data-testid={`delete-bracket-${bracket.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BonusBracketManagementPage;