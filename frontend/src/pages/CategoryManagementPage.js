import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CategoryManagementPage = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    criteria_short_text: '',
    criteria_bullets: '',
    display_order: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API_URL}/categories/${editingCategory.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Category updated successfully');
      } else {
        await axios.post(`${API_URL}/categories`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Category created successfully');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      title: category.title,
      criteria_short_text: category.criteria_short_text,
      criteria_bullets: category.criteria_bullets || '',
      display_order: category.display_order
    });
    setIsDialogOpen(true);
  };

  const handleToggle = async (categoryId, currentStatus) => {
    try {
      await axios.put(
        `${API_URL}/categories/${categoryId}`,
        { is_enabled: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Category ${!currentStatus ? 'enabled' : 'disabled'}`);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Delete this category? This cannot be undone if reviews use it.')) return;
    
    try {
      await axios.delete(`${API_URL}/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete category');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      criteria_short_text: '',
      criteria_bullets: '',
      display_order: categories.length
    });
    setEditingCategory(null);
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
    <div className="flex" data-testid="category-management-page">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Category Management</h1>
              <p className="text-lg text-slate-500">Manage review categories and rating criteria</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-950 hover:bg-indigo-900" data-testid="add-category-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Category Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                      placeholder="e.g., Delivery and Ownership"
                      className="bg-slate-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="criteria_short_text">Short Description *</Label>
                    <Input
                      id="criteria_short_text"
                      value={formData.criteria_short_text}
                      onChange={(e) => setFormData({...formData, criteria_short_text: e.target.value})}
                      required
                      placeholder="Brief description shown in review form"
                      className="bg-slate-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="criteria_bullets">Detailed Criteria (shown when expanded)</Label>
                    <Textarea
                      id="criteria_bullets"
                      value={formData.criteria_bullets}
                      onChange={(e) => setFormData({...formData, criteria_bullets: e.target.value})}
                      placeholder="What to check:\n- Point 1\n- Point 2\n\nStrong signals:\n- Signal 1"
                      className="bg-slate-50"
                      rows={10}
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_order">Display Order</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                      className="bg-slate-50"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-indigo-950 hover:bg-indigo-900">
                      {editingCategory ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {categories.map((category) => (
              <Card key={category.id} data-testid={`category-${category.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="text-slate-400" size={20} />
                      <div>
                        <CardTitle className="text-xl">{category.title}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">{category.criteria_short_text}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={category.is_enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-700'}>
                        {category.is_enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {category.criteria_bullets && (
                    <div className="bg-slate-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{category.criteria_bullets.substring(0, 200)}...</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`toggle-${category.id}`} className="text-sm">Status:</Label>
                      <Switch
                        id={`toggle-${category.id}`}
                        checked={category.is_enabled}
                        onCheckedChange={() => handleToggle(category.id, category.is_enabled)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(category)}
                        data-testid={`edit-category-${category.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(category.id)}
                        data-testid={`delete-category-${category.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                      </Button>
                    </div>
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

export default CategoryManagementPage;