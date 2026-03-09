import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import StarRating from '@/components/StarRating';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Calendar, Calculator, CheckCircle, Clock, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AnnualBonusPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [payables, setPayables] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Detail modal state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState(null);
  const [payableDetails, setPayableDetails] = useState(null);
  
  // Mark paid modal state
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markPaidId, setMarkPaidId] = useState(null);
  const [paidNotes, setPaidNotes] = useState('');

  const yearOptions = [2026, 2025, 2024, 2023];

  useEffect(() => {
    fetchData();
  }, [selectedYear, statusFilter]);

  const fetchData = async () => {
    try {
      let payablesUrl = `${API_URL}/annual-bonuses?year=${selectedYear}`;
      if (statusFilter !== 'all') {
        payablesUrl += `&status=${statusFilter}`;
      }

      const [payablesRes, summaryRes] = await Promise.all([
        axios.get(payablesUrl, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/annual-bonuses/summary?year=${selectedYear}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        })
      ]);

      setPayables(payablesRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      toast.error('Failed to load annual bonus data');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const response = await axios.post(`${API_URL}/annual-bonuses/calculate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(`Calculation complete: ${response.data.created} created, ${response.data.updated} updated`);
      fetchData();
    } catch (error) {
      toast.error('Failed to calculate annual bonuses');
    } finally {
      setCalculating(false);
    }
  };

  const handleViewDetails = async (payable) => {
    setSelectedPayable(payable);
    try {
      const response = await axios.get(`${API_URL}/annual-bonuses/${payable.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayableDetails(response.data);
      setDetailOpen(true);
    } catch (error) {
      toast.error('Failed to load bonus details');
    }
  };

  const handleMarkPaid = async () => {
    try {
      await axios.post(`${API_URL}/annual-bonuses/${markPaidId}/mark-paid`, {
        notes: paidNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Bonus marked as paid');
      setMarkPaidOpen(false);
      setPaidNotes('');
      setMarkPaidId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to mark as paid');
    }
  };

  const openMarkPaid = (id) => {
    setMarkPaidId(id);
    setPaidNotes('');
    setMarkPaidOpen(true);
  };

  const getScoreColor = (score) => {
    if (score >= 4.5) return 'text-emerald-600';
    if (score >= 3.5) return 'text-teal-600';
    if (score >= 3.0) return 'text-amber-600';
    return 'text-rose-600';
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
    <div className="flex" data-testid="annual-bonus-page">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                Annual Bonus Payable
              </h1>
              <p className="text-lg text-slate-500">Anniversary-based bonus calculations (12 months from joining)</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-28" data-testid="year-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCalculate} disabled={calculating} data-testid="calculate-btn">
                <RefreshCw className={`w-4 h-4 mr-2 ${calculating ? 'animate-spin' : ''}`} />
                {calculating ? 'Calculating...' : 'Calculate Bonuses'}
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Total Pending
                  </CardTitle>
                  <Clock className="w-5 h-5 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600">
                    {formatCurrency(summary.total_pending_amount)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {summary.pending_count} employees
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Total Paid
                  </CardTitle>
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">
                    {formatCurrency(summary.total_paid_amount)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {summary.paid_count} employees
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Incomplete Year
                  </CardTitle>
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-rose-600">
                    {summary.incomplete_year_count}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Less than 12 months reviewed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    Total Eligible
                  </CardTitle>
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-indigo-600">
                    {summary.total_count}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Annual bonus periods
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payables Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Annual Bonus Records
              </CardTitle>
              <CardDescription>
                Bonus is calculated after 12 months from joining date (anniversary-based)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Bonus Period</TableHead>
                    <TableHead>Months</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Bracket</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payables.length > 0 ? (
                    payables.map((payable) => (
                      <TableRow key={payable.id} data-testid={`payable-row-${payable.id}`}>
                        <TableCell className="font-medium">
                          {payable.employee_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payable.employee_role}</Badge>
                        </TableCell>
                        <TableCell>
                          {payable.joining_date 
                            ? new Date(payable.joining_date).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(payable.period_start).toLocaleDateString()} - {new Date(payable.period_end).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={payable.months_counted < 12 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}>
                            {payable.months_counted}/12
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payable.annual_average_score ? (
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${getScoreColor(parseFloat(payable.annual_average_score))}`}>
                                {parseFloat(payable.annual_average_score).toFixed(2)}
                              </span>
                              <StarRating value={parseFloat(payable.annual_average_score)} readonly size="sm" />
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payable.bonus_bracket_label || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payable.bonus_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={payable.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>
                            {payable.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(payable)}
                              data-testid={`view-details-${payable.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {payable.status === 'Pending' && (
                              <Button
                                size="sm"
                                onClick={() => openMarkPaid(payable.id)}
                                data-testid={`mark-paid-${payable.id}`}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                        <Calculator className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>No annual bonus records found</p>
                        <p className="text-sm">Click "Calculate Bonuses" to generate records for eligible employees</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bonus Details</DialogTitle>
            <DialogDescription>
              Monthly breakdown for annual bonus calculation
            </DialogDescription>
          </DialogHeader>
          {payableDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Employee</p>
                  <p className="font-medium">{payableDetails.employee?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Role</p>
                  <p className="font-medium">{payableDetails.employee?.role_type}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Period</p>
                  <p className="font-medium">
                    {new Date(payableDetails.payable.period_start).toLocaleDateString()} - {new Date(payableDetails.payable.period_end).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Months Reviewed</p>
                  <p className="font-medium">{payableDetails.payable.months_counted} / 12</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Monthly Scores</h4>
                <div className="grid grid-cols-4 gap-2">
                  {payableDetails.monthly_scores?.map((score, idx) => (
                    <div key={idx} className="bg-slate-50 rounded p-2 text-center">
                      <p className="text-xs text-slate-500">
                        {new Date(score.year, score.month - 1).toLocaleString('default', { month: 'short', year: '2-digit' })}
                      </p>
                      <p className={`font-bold ${getScoreColor(score.score)}`}>
                        {score.score.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                {payableDetails.months_missing > 0 && (
                  <p className="text-sm text-rose-600 mt-2">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {payableDetails.months_missing} months missing reviews
                  </p>
                )}
              </div>

              <div className="border-t pt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Annual Average</p>
                  <p className={`text-2xl font-bold ${getScoreColor(parseFloat(payableDetails.payable.annual_average_score))}`}>
                    {parseFloat(payableDetails.payable.annual_average_score || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Multiplier</p>
                  <p className="text-2xl font-bold">{payableDetails.payable.multiplier}x</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Bonus Amount</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(payableDetails.payable.bonus_amount)}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Paid Modal */}
      <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Bonus as Paid</DialogTitle>
            <DialogDescription>
              Confirm payment and add optional notes
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Payment notes (optional)"
              value={paidNotes}
              onChange={(e) => setPaidNotes(e.target.value)}
              data-testid="paid-notes-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkPaid} data-testid="confirm-mark-paid">
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnualBonusPage;
