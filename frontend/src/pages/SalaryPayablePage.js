import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Download, Calculator, Calendar, TrendingUp, DollarSign, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SalaryPayablePage = () => {
  const { token } = useAuth();
  const [bonuses, setBonuses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    status: null
  });

  useEffect(() => {
    fetchBonuses();
    fetchSummary();
  }, [filters]);

  const fetchBonuses = async () => {
    try {
      const params = {};
      if (filters.year) params.year = filters.year;
      if (filters.status) params.status = filters.status;

      const response = await axios.get(`${API_URL}/annual-bonuses`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setBonuses(response.data);
    } catch (error) {
      toast.error('Failed to load annual bonuses');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API_URL}/annual-bonuses/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { year: filters.year }
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to load summary');
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const response = await axios.post(`${API_URL}/annual-bonuses/calculate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Bonus calculation complete: ${response.data.created} created, ${response.data.updated} updated`);
      fetchBonuses();
      fetchSummary();
    } catch (error) {
      toast.error('Failed to calculate bonuses');
    } finally {
      setCalculating(false);
    }
  };

  const handleMarkPaid = async (bonusId) => {
    try {
      await axios.post(`${API_URL}/annual-bonuses/${bonusId}/mark-paid`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Bonus marked as paid');
      fetchBonuses();
      fetchSummary();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to mark as paid');
    }
  };

  const handleViewDetails = async (bonus) => {
    setDetailLoading(true);
    try {
      const response = await axios.get(`${API_URL}/annual-bonuses/${bonus.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedBonus(response.data);
    } catch (error) {
      toast.error('Failed to load bonus details');
    } finally {
      setDetailLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Employee', 'Role', 'Joining Date', 'Period Start', 'Period End', 'Months Counted', 'Avg Score', 'Bracket', 'Multiplier', 'Base Salary', 'Bonus Amount', 'Status'];
    const rows = bonuses.map(b => [
      b.employee_name || 'N/A',
      b.employee_role || 'N/A',
      b.joining_date || 'N/A',
      b.period_start,
      b.period_end,
      b.months_counted,
      b.annual_average_score || 'N/A',
      b.bonus_bracket_label || 'N/A',
      b.multiplier || 0,
      b.base_salary || 'N/A',
      b.bonus_amount || 'N/A',
      b.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annual-bonuses-${filters.year}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getScoreColor = (score) => {
    if (!score) return 'text-slate-400';
    if (score >= 4.5) return 'text-emerald-600';
    if (score >= 3.5) return 'text-teal-600';
    if (score >= 3.0) return 'text-amber-600';
    return 'text-rose-600';
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
    <div className="flex" data-testid="salary-payable-page">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Annual Bonus Payable</h1>
              <p className="text-lg text-slate-500">Anniversary-based bonus calculation and management</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleCalculate} 
                disabled={calculating}
                className="bg-teal-600 hover:bg-teal-700"
                data-testid="calculate-bonus-btn"
              >
                {calculating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Calculator className="w-4 h-4 mr-2" />
                )}
                {calculating ? 'Calculating...' : 'Calculate Bonuses'}
              </Button>
              <Button onClick={exportToCSV} variant="outline" data-testid="export-csv-button">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Anniversary Year</label>
                  <Select value={filters.year?.toString()} onValueChange={(value) => setFilters({...filters, year: parseInt(value)})}>
                    <SelectTrigger className="bg-slate-50" data-testid="year-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027].map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Payment Status</label>
                  <Select value={filters.status || "all"} onValueChange={(value) => setFilters({...filters, status: value === "all" ? null : value})}>
                    <SelectTrigger className="bg-slate-50" data-testid="status-filter">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Records</CardTitle>
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{summary.total_count}</div>
                  <p className="text-xs text-slate-500 mt-1">
                    {summary.incomplete_year_count} with &lt;12 months
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Pending Bonuses</CardTitle>
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">{summary.pending_count}</div>
                  <p className="text-xs text-slate-500 mt-1">
                    PKR {(summary.total_pending_amount || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Paid Bonuses</CardTitle>
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">{summary.paid_count}</div>
                  <p className="text-xs text-slate-500 mt-1">
                    PKR {(summary.total_paid_amount || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Amount</CardTitle>
                  <DollarSign className="w-5 h-5 text-teal-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-teal-600">
                    PKR {((summary.total_pending_amount || 0) + (summary.total_paid_amount || 0)).toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Year {summary.year}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Bonus Table */}
          <Card>
            <CardHeader>
              <CardTitle>Annual Bonus Records</CardTitle>
              <CardDescription>
                Bonuses are calculated based on the average score of published monthly reviews over the 12-month period following each employee's joining anniversary.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Months</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Bracket</TableHead>
                    <TableHead>Bonus Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bonuses.map((bonus) => (
                    <TableRow key={bonus.id} data-testid={`bonus-row-${bonus.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900">{bonus.employee_name || 'N/A'}</div>
                          <div className="text-xs text-slate-500">{bonus.employee_role}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(bonus.period_start)}</div>
                          <div className="text-slate-500">to {formatDate(bonus.period_end)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className={`font-semibold ${bonus.months_counted === 12 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {bonus.months_counted}
                          </span>
                          <span className="text-slate-400">/12</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-lg font-bold ${getScoreColor(bonus.annual_average_score)}`}>
                          {bonus.annual_average_score ? parseFloat(bonus.annual_average_score).toFixed(2) : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                          {bonus.bonus_bracket_label || 'N/A'}
                        </Badge>
                        <div className="text-xs text-slate-500 mt-1">
                          {bonus.multiplier ? `${bonus.multiplier}x` : '0x'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {bonus.bonus_amount ? (
                          <span className="font-bold text-emerald-600">
                            PKR {parseFloat(bonus.bonus_amount).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={bonus.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                          {bonus.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(bonus)}
                            data-testid={`view-detail-${bonus.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {bonus.status === 'Pending' && bonus.bonus_amount > 0 && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkPaid(bonus.id)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                              data-testid={`mark-paid-${bonus.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Pay
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {bonuses.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Calculator className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg">No annual bonus records found</p>
                  <p className="text-sm">Click "Calculate Bonuses" to generate records for eligible employees</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedBonus} onOpenChange={() => setSelectedBonus(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Annual Bonus Details</DialogTitle>
            <DialogDescription>
              Detailed breakdown of the annual bonus calculation
            </DialogDescription>
          </DialogHeader>
          {selectedBonus && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Employee</p>
                  <p className="font-semibold text-slate-900">{selectedBonus.employee?.full_name}</p>
                  <p className="text-sm text-slate-500">{selectedBonus.employee?.role_type}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Review Period</p>
                  <p className="font-semibold text-slate-900">
                    {formatDate(selectedBonus.payable?.period_start)} - {formatDate(selectedBonus.payable?.period_end)}
                  </p>
                  <p className="text-sm text-slate-500">12-month anniversary cycle</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Months Counted</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {selectedBonus.payable?.months_counted}/12
                  </p>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Average Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(selectedBonus.payable?.annual_average_score)}`}>
                    {selectedBonus.payable?.annual_average_score ? parseFloat(selectedBonus.payable.annual_average_score).toFixed(2) : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-1">Bonus Amount</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    PKR {selectedBonus.payable?.bonus_amount ? parseFloat(selectedBonus.payable.bonus_amount).toLocaleString() : '0'}
                  </p>
                </div>
              </div>

              {selectedBonus.monthly_scores && selectedBonus.monthly_scores.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Monthly Scores in Period</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedBonus.monthly_scores.map((ms, idx) => (
                      <div key={idx} className="text-center p-2 bg-white border border-slate-200 rounded">
                        <p className="text-xs text-slate-500">
                          {new Date(ms.year, ms.month - 1).toLocaleString('default', { month: 'short', year: '2-digit' })}
                        </p>
                        <p className={`font-bold ${getScoreColor(ms.score)}`}>{ms.score.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedBonus.months_missing > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> {selectedBonus.months_missing} month(s) are missing reviews. 
                    The average score is calculated only from available months.
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedBonus(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalaryPayablePage;
