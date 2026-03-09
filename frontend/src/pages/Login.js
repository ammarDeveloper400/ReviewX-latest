import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success('Login successful!');
      
      // Redirect based on role
      if (user.role === 'Admin') {
        navigate('/admin');
      } else if (user.role === 'PM') {
        navigate('/pm');
      } else {
        navigate('/employee');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200" data-testid="login-card">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center mb-2">
            <div className="flex items-center gap-2">
              <Star className="w-8 h-8 text-indigo-950 fill-indigo-950" />
              <h1 className="text-3xl font-bold text-indigo-950 tracking-tight">ReviewX</h1>
            </div>
          </div>
          <CardTitle className="text-2xl">Performance Management</CardTitle>
          <CardDescription>Sign in to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-50"
                data-testid="email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-50"
                data-testid="password-input"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-indigo-950 hover:bg-indigo-900 text-white"
              disabled={loading}
              data-testid="login-button"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          {/* <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 font-medium mb-2">Demo Credentials:</p>
            <div className="text-xs text-slate-500 space-y-1">
              <p><strong>Admin:</strong> admin@reviewsystem.com / admin123</p>
              <p><strong>PM:</strong> pm@reviewsystem.com / pm123</p>
              <p><strong>Employee:</strong> ali.hassan@company.com / employee123</p>
            </div>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
