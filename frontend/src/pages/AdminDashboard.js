import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import StarRating from "@/components/StarRating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Award,
  Calendar,
  RefreshCw,
  Database,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seedingData, setSeedingData] = useState(false);
  const [period, setPeriod] = useState("this_year");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedMonth, setSelectedMonth] = useState(null);

  const currentYear = new Date().getFullYear();
  const yearOptions = [2026, 2025, 2024, 2023];

  useEffect(() => {
    fetchStats();
  }, [period, selectedYear, selectedMonth]);

  const fetchStats = async () => {
    try {
      const params = { period };
      if (period === "custom" || period === "this_year") {
        params.year = selectedYear;
        if (selectedMonth) params.month = selectedMonth;
      }

      const response = await axios.get(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    if (
      !window.confirm(
        "This will clear all existing review data and create fresh test data. Continue?",
      )
    ) {
      return;
    }

    setSeedingData(true);
    try {
      const response = await axios.post(
        `${API_URL}/admin/seed-data`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast.success(
        `Test data seeded! Created ${response.data.created.internal_reviews} internal reviews, ${response.data.created.monthly_finals} finals`,
      );
      fetchStats();
    } catch (error) {
      toast.error("Failed to seed data");
    } finally {
      setSeedingData(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 4.5) return "text-emerald-600";
    if (score >= 3.5) return "text-teal-600";
    if (score >= 3.0) return "text-amber-600";
    return "text-rose-600";
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
    <div className="flex" data-testid="admin-dashboard">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                Admin Dashboard
              </h1>
              <p className="text-lg text-slate-500">
                System overview and performance metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* <Button
                variant="outline"
                onClick={handleSeedData}
                disabled={seedingData}
                className="text-slate-600"
              >
                <Database className="w-4 h-4 mr-2" />
                {seedingData ? 'Seeding...' : 'Reset & Seed Data'}
              </Button> */}
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="previous_month">Previous Month</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {(period === "custom" || period === "this_year") && (
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-24 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card data-testid="total-employees-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Active Employees
                </CardTitle>
                <Users className="w-5 h-5 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">
                  {stats?.active_employees || 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {stats?.inactive_employees || 0} inactive •{" "}
                  {stats?.total_employees || 0} total
                </p>
              </CardContent>
            </Card>

            <Card data-testid="internal-reviews-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Internal Reviews
                </CardTitle>
                <FileText className="w-5 h-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-slate-900">
                  {stats?.internal_reviews_count || 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  For{" "}
                  {stats?.period_month
                    ? `${new Date(2024, stats.period_month - 1).toLocaleString("default", { month: "short" })} ${stats?.period_year}`
                    : `Year ${stats?.period_year}`}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="monthly-finals-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Published Finals
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-emerald-600">
                  {stats?.monthly_finals_count || 0}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-amber-50 text-amber-700 text-xs">
                    {stats?.draft_finals_count || 0} Drafts
                  </Badge>
                  <Badge className="bg-rose-50 text-rose-700 text-xs">
                    {stats?.pending_finals || 0} Pending
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="warnings-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  With Warnings
                </CardTitle>
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-rose-600">
                  {stats?.employees_with_warnings || 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Employees with active warnings
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Salary & Bonus Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card data-testid="bonus-payable-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Bonus Payable
                </CardTitle>
                <DollarSign className="w-5 h-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">
                  ${(stats?.total_bonus_payable || 0).toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-amber-50 text-amber-700">
                    {stats?.unpaid_bonuses_count || 0} Unpaid
                  </Badge>
                  <Badge className="bg-emerald-50 text-emerald-700">
                    {stats?.paid_bonuses_count || 0} Paid
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Average Score by Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {["Dev", "QA", "UI/UX", "PM"].map((role) => {
                    const score = stats?.avg_score_by_role?.[role] || 0;
                    return (
                      <div
                        key={role}
                        className="text-center p-4 bg-slate-50 rounded-lg"
                      >
                        <p className="text-sm text-slate-600 mb-2">{role}</p>
                        <p
                          className={`text-2xl font-bold ${getScoreColor(score)}`}
                        >
                          {score > 0 ? score.toFixed(2) : "-"}
                        </p>
                        {score > 0 && (
                          <StarRating value={score} readonly size="sm" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Top Performers
                </span>
                <Badge variant="outline">
                  {stats?.period_month
                    ? new Date(2024, stats.period_month - 1).toLocaleString(
                        "default",
                        { month: "long" },
                      )
                    : `Year ${stats?.period_year}`}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.top_performers?.length > 0 ? (
                <div className="space-y-4">
                  {stats.top_performers.map((performer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                      onClick={() =>
                        navigate(`/admin/employees/${performer.employee_id}`)
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {performer.employee_name}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {performer.role_type}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-2xl font-bold ${getScoreColor(performer.monthly_score)}`}
                        >
                          {(performer.monthly_score || 0).toFixed(2)}
                        </p>
                        <StarRating
                          value={performer.monthly_score}
                          readonly
                          size="sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Award className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p>No performers data available for this period</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleSeedData}
                  >
                    Seed Test Data
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate("/admin/employees")}
            >
              <Users className="w-6 h-6 text-indigo-600" />
              <span>Manage Employees</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate("/admin/internal-reviews")}
            >
              <FileText className="w-6 h-6 text-blue-600" />
              <span>Manage Reviews</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate("/admin/salary-payable")}
            >
              <DollarSign className="w-6 h-6 text-green-600" />
              <span>Salary Payable</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => navigate("/admin/users")}
            >
              <Users className="w-6 h-6 text-purple-600" />
              <span>User Accounts</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
