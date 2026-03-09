import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldCheck, UserPlus, Power, Users } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminManagementPage = () => {
  const { token, user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get(`${API_URL}/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
    } catch (error) {
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.email || !newAdmin.password) {
      toast.error('Email and password are required');
      return;
    }
    
    if (newAdmin.password !== newAdmin.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newAdmin.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setCreating(true);
    try {
      await axios.post(`${API_URL}/admins`, {
        email: newAdmin.email,
        password: newAdmin.password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Admin user created successfully');
      setIsCreateOpen(false);
      setNewAdmin({ email: '', password: '', confirmPassword: '' });
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create admin user');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (adminId, currentStatus) => {
    if (adminId === user.id) {
      toast.error('Cannot deactivate your own account');
      return;
    }

    try {
      await axios.put(`${API_URL}/users/${adminId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Admin ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to toggle admin status');
    }
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
    <div className="flex" data-testid="admin-management-page">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                Admin Management
              </h1>
              <p className="text-lg text-slate-500">Manage administrator accounts</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="create-admin-btn">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Admin</DialogTitle>
                  <DialogDescription>
                    Create a new administrator account with full system access.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                      data-testid="admin-email-input"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                      data-testid="admin-password-input"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={newAdmin.confirmPassword}
                      onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
                      data-testid="admin-confirm-password-input"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAdmin} disabled={creating} data-testid="submit-create-admin">
                    {creating ? 'Creating...' : 'Create Admin'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Admins
                </CardTitle>
                <Users className="w-5 h-5 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">
                  {admins.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Active Admins
                </CardTitle>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-emerald-600">
                  {admins.filter(a => a.is_active).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Inactive Admins
                </CardTitle>
                <Power className="w-5 h-5 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-400">
                  {admins.filter(a => !a.is_active).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin List */}
          <Card>
            <CardHeader>
              <CardTitle>Administrator Accounts</CardTitle>
              <CardDescription>
                All administrator accounts have full access to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id} data-testid={`admin-row-${admin.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          {admin.email}
                          {admin.id === user.id && (
                            <Badge variant="outline" className="ml-2">You</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={admin.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {admin.last_login_at 
                          ? new Date(admin.last_login_at).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {new Date(admin.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {admin.id !== user.id && (
                          <Button
                            variant={admin.is_active ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => handleToggleStatus(admin.id, admin.is_active)}
                            data-testid={`toggle-admin-${admin.id}`}
                          >
                            {admin.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminManagementPage;
