import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, User, Shield, UserX, UserCheck, KeyRound, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const UsersManagementPage = () => {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [resetPasswordDialog, setResetPasswordDialog] = useState({ open: false, user: null });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  
  // Password result dialog state
  const [passwordResultDialog, setPasswordResultDialog] = useState({ open: false, email: '', password: '' });
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(u =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.employee_name && u.employee_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const response = await axios.put(
        `${API_URL}/users/${userId}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user status');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setResetting(true);
    try {
      const response = await axios.post(
        `${API_URL}/users/${resetPasswordDialog.user.id}/reset-password`,
        { new_password: newPassword, new_password_confirmation: confirmPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Password reset successfully for ${resetPasswordDialog.user.email}`);
      
      // Show password result dialog with the new password
      setPasswordResultDialog({
        open: true,
        email: response.data.email,
        password: response.data.new_password
      });
      
      setResetPasswordDialog({ open: false, user: null });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(passwordResultDialog.password);
    setPasswordCopied(true);
    toast.success('Password copied to clipboard');
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PM': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Employee': return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700';
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
    <div className="flex" data-testid="users-management-page">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">User Accounts</h1>
              <p className="text-lg text-slate-500">Manage user accounts and access permissions</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Users</p>
                    <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <UserCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Active</p>
                    <p className="text-2xl font-bold text-emerald-600">{users.filter(u => u.is_active).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-50 rounded-lg">
                    <UserX className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Inactive</p>
                    <p className="text-2xl font-bold text-rose-600">{users.filter(u => !u.is_active).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Admins</p>
                    <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'Admin').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search users by email, role, or linked employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md bg-slate-50"
                  data-testid="search-input"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Role</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Linked Employee</th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Last Login</th>
                      <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Status</th>
                      <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Active</th>
                      <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${!user.is_active ? 'opacity-60' : ''}`}
                        data-testid={`user-row-${user.id}`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.is_active ? 'bg-indigo-100' : 'bg-slate-200'}`}>
                              <User className={`w-4 h-4 ${user.is_active ? 'text-indigo-600' : 'text-slate-400'}`} />
                            </div>
                            <span className="font-medium text-slate-900">{user.email}</span>
                            {user.id === currentUser?.id && (
                              <Badge className="bg-indigo-50 text-indigo-700 text-xs">You</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {user.employee_name ? (
                            <div>
                              <div className="font-medium text-slate-900">{user.employee_name}</div>
                              {user.employee_status && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {user.employee_status}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-sm">
                          {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Switch
                            checked={user.is_active}
                            onCheckedChange={() => handleToggleStatus(user.id)}
                            disabled={user.id === currentUser?.id}
                            data-testid={`toggle-user-${user.id}`}
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setResetPasswordDialog({ open: true, user })}
                            data-testid={`reset-password-${user.id}`}
                          >
                            <KeyRound className="w-4 h-4 mr-1" />
                            Reset
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    No users found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">User Account Rules:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Inactive users cannot log in to the system</li>
                    <li>Deactivating an employee will automatically deactivate their linked user account</li>
                    <li>You cannot deactivate your own account</li>
                    <li>All status changes are logged in the audit trail</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reset Password Dialog */}
          <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => {
            if (!open) {
              setResetPasswordDialog({ open: false, user: null });
              setNewPassword('');
              setConfirmPassword('');
            }
          }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-slate-600">
                  Reset password for: <strong>{resetPasswordDialog.user?.email}</strong>
                </p>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="bg-slate-50"
                    data-testid="new-password-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="bg-slate-50"
                    data-testid="confirm-password-input"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setResetPasswordDialog({ open: false, user: null });
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleResetPassword}
                    disabled={resetting}
                    className="bg-indigo-950 hover:bg-indigo-900"
                    data-testid="confirm-reset-button"
                  >
                    {resetting ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Password Result Dialog - Shows password once after reset */}
          <Dialog open={passwordResultDialog.open} onOpenChange={(open) => {
            if (!open) {
              setPasswordResultDialog({ open: false, email: '', password: '' });
              setPasswordCopied(false);
            }
          }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-emerald-700">
                  <UserCheck className="w-5 h-5" />
                  Password Reset Successfully
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-800 font-medium mb-2">New Login Credentials</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Email:</span>
                      <span className="text-sm font-medium">{passwordResultDialog.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">New Password:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-2 py-1 rounded text-sm font-mono border">
                          {passwordResultDialog.password}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyPassword}
                          className="h-8 w-8 p-0"
                          data-testid="copy-password-button"
                        >
                          {passwordCopied ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    ⚠️ <strong>Important:</strong> Copy this password now. For security, passwords are stored encrypted and cannot be retrieved later.
                  </p>
                </div>
                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={() => {
                      setPasswordResultDialog({ open: false, email: '', password: '' });
                      setPasswordCopied(false);
                    }}
                    className="bg-indigo-950 hover:bg-indigo-900"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default UsersManagementPage;
