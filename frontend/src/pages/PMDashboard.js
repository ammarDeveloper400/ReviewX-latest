import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ title, value, icon: Icon, color, testId }) => (
  <Card data-testid={testId}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      <Icon className={`w-5 h-5 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
    </CardContent>
  </Card>
);

const PMDashboard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
      console.error(error);
    } finally {
      setLoading(false);
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
    <div className="flex" data-testid="pm-dashboard">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">PM Dashboard</h1>
              <p className="text-lg text-slate-500">Manage team reviews and performance</p>
            </div>
            <Button
              className="bg-indigo-950 hover:bg-indigo-900"
              onClick={() => navigate('/admin/reviews/create')}
              data-testid="create-review-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Review
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Employees"
              value={stats?.total_employees || 0}
              icon={Users}
              color="text-indigo-600"
              testId="stat-total-employees"
            />
            <StatCard
              title="Active Employees"
              value={stats?.active_employees || 0}
              icon={Users}
              color="text-emerald-600"
              testId="stat-active-employees"
            />
            <StatCard
              title="Reviews This Month"
              value={stats?.reviews_this_month || 0}
              icon={FileText}
              color="text-teal-600"
              testId="stat-reviews-month"
            />
            <StatCard
              title="Pending Drafts"
              value={stats?.pending_drafts || 0}
              icon={FileText}
              color="text-amber-600"
              testId="stat-pending-drafts"
            />
          </div>

          <Card data-testid="top-performers-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Top Performers This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.top_performers?.length > 0 ? (
                <div className="space-y-3">
                  {stats.top_performers.map((performer, idx) => (
                    <div
                      key={performer.employee_id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/employees/${performer.employee_id}`)}
                      data-testid={`top-performer-${idx}`}
                    >
                      <div>
                        <p className="font-medium text-slate-900">{performer.employee_name}</p>
                        <p className="text-sm text-slate-500">{performer.role_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-600">{performer.monthly_score}</p>
                        <p className="text-xs text-slate-500">Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PMDashboard;
