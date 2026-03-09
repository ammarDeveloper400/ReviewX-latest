import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Filter,
  KeyRound,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EmployeesPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    role_type: "Dev",
    department: "",
    joining_date: new Date().toISOString().split("T")[0],
    base_salary: "",
    password: "",
    password_confirmation: "",
  });

  // State for create account dialog
  const [createAccountDialog, setCreateAccountDialog] = useState({
    open: false,
    employee: null,
  });
  const [accountPassword, setAccountPassword] = useState("");
  const [accountPasswordConfirm, setAccountPasswordConfirm] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);

  // State for showing password result
  const [passwordResultDialog, setPasswordResultDialog] = useState({
    open: false,
    email: "",
    password: "",
  });
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    let filtered = employees.filter(
      (emp) =>
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role_type.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Filter by active status
    if (!showInactive) {
      filtered = filtered.filter((emp) => emp.status === "Active");
    }

    setFilteredEmployees(filtered);
  }, [searchTerm, employees, showInactive]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(response.data);
      setFilteredEmployees(response.data);
    } catch (error) {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords for new employee
    if (!editingEmployee) {
      if (!formData.password || formData.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      if (formData.password !== formData.password_confirmation) {
        toast.error("Passwords do not match");
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        joining_date: new Date(formData.joining_date).toISOString(),
        base_salary: formData.base_salary
          ? parseFloat(formData.base_salary)
          : null,
      };

      if (editingEmployee) {
        // Don't send password fields during edit
        delete payload.password;
        delete payload.password_confirmation;
        await axios.put(`${API_URL}/employees/${editingEmployee.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Employee updated successfully");
      } else {
        await axios.post(`${API_URL}/employees`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Employee created with user account");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to save employee",
      );
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      full_name: employee.full_name,
      email: employee.email,
      phone: employee.phone || "",
      role_type: employee.role_type,
      department: employee.department || "",
      joining_date: new Date(employee.joining_date).toISOString().split("T")[0],
      base_salary: employee.base_salary?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;

    try {
      await axios.delete(`${API_URL}/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Employee deleted successfully");
      fetchEmployees();
    } catch (error) {
      toast.error("Failed to delete employee");
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      role_type: "Dev",
      department: "",
      joining_date: new Date().toISOString().split("T")[0],
      base_salary: "",
      password: "",
      password_confirmation: "",
    });
    setEditingEmployee(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-700";
      case "Inactive":
        return "bg-slate-200 text-slate-700";
      case "Termination Recommended":
        return "bg-rose-50 text-rose-700";
      case "Terminated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const handleToggleStatus = async (employeeId, currentStatus) => {
    // Only allow toggling between Active and Inactive
    if (currentStatus !== "Active" && currentStatus !== "Inactive") {
      toast.error(
        `Cannot toggle status. Current status is '${currentStatus}'. Manual update required.`,
      );
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/employees/${employeeId}/toggle-status`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { deactivate_linked_user: true },
        },
      );
      toast.success(response.data.message);
      if (response.data.linked_user_deactivated) {
        toast.info(
          `User account ${response.data.linked_user_deactivated} was also deactivated`,
        );
      }
      if (response.data.linked_user_activated) {
        toast.info(
          `User account ${response.data.linked_user_activated} was also activated`,
        );
      }
      fetchEmployees();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to update employee status",
      );
    }
  };

  const handleCreateAccount = async () => {
    if (!accountPassword || accountPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (accountPassword !== accountPasswordConfirm) {
      toast.error("Passwords do not match");
      return;
    }

    setCreatingAccount(true);
    try {
      const response = await axios.post(
        `${API_URL}/employees/${createAccountDialog.employee.id}/create-account`,
        {
          password: accountPassword,
          password_confirmation: accountPasswordConfirm,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      toast.success("User account created successfully");

      // Show password result dialog
      setPasswordResultDialog({
        open: true,
        email: response.data.email,
        password: response.data.password,
      });

      setCreateAccountDialog({ open: false, employee: null });
      setAccountPassword("");
      setAccountPasswordConfirm("");
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create account");
    } finally {
      setCreatingAccount(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(passwordResultDialog.password);
    setPasswordCopied(true);
    toast.success("Password copied to clipboard");
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const getAccountStatusColor = (accountStatus) => {
    switch (accountStatus) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Inactive":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Not Created":
        return "bg-slate-100 text-slate-500 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700";
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
    <div className="flex" data-testid="employees-page">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex flex-wrap items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                Employees
              </h1>
              <p className="text-lg text-slate-500">
                Manage employee profiles and accounts
              </p>
            </div>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="bg-indigo-950 hover:bg-indigo-900 mt-2 md:mt-0"
                  data-testid="add-employee-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingEmployee ? "Edit Employee" : "Add New Employee"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            full_name: e.target.value,
                          })
                        }
                        required
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                        disabled={editingEmployee}
                        className={
                          editingEmployee
                            ? "bg-slate-200 cursor-not-allowed"
                            : "bg-slate-50"
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role_type">Role Type *</Label>
                      <Select
                        value={formData.role_type}
                        onValueChange={(value) =>
                          setFormData({ ...formData, role_type: value })
                        }
                      >
                        <SelectTrigger className="bg-slate-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dev">Developer</SelectItem>
                          <SelectItem value="QA">QA</SelectItem>
                          <SelectItem value="UI/UX">UI/UX Designer</SelectItem>
                          <SelectItem value="PM">Project Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value,
                          })
                        }
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="joining_date">Joining Date *</Label>
                      <Input
                        id="joining_date"
                        type="date"
                        value={formData.joining_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            joining_date: e.target.value,
                          })
                        }
                        required
                        className="bg-slate-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="base_salary">Base Salary (PKR)</Label>
                      <Input
                        id="base_salary"
                        type="number"
                        value={formData.base_salary}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            base_salary: e.target.value,
                          })
                        }
                        className="bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Password Fields - Only show for new employees */}
                  {!editingEmployee && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          required
                          minLength={8}
                          placeholder="Min 8 characters"
                          className="bg-slate-50"
                          data-testid="password-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password_confirmation">
                          Confirm Password *
                        </Label>
                        <Input
                          id="password_confirmation"
                          type="password"
                          value={formData.password_confirmation}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password_confirmation: e.target.value,
                            })
                          }
                          required
                          minLength={8}
                          placeholder="Confirm password"
                          className="bg-slate-50"
                          data-testid="password-confirmation-input"
                        />
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500">
                          A user account will be created with this password.
                          Role will be set based on employee type (PM → PM role,
                          others → Employee role).
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-indigo-950 hover:bg-indigo-900"
                    >
                      {editingEmployee ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm bg-slate-50"
                      data-testid="search-input"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <Checkbox
                    id="show-inactive"
                    checked={showInactive}
                    onCheckedChange={setShowInactive}
                    data-testid="show-inactive-checkbox"
                  />
                  <Label
                    htmlFor="show-inactive"
                    className="text-sm text-slate-600 cursor-pointer"
                  >
                    Show inactive employees
                  </Label>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        Account
                      </th>
                      <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        Active
                      </th>
                      <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => (
                      <tr
                        key={employee.id}
                        className={`border-b border-slate-100 whitespace-nowrap hover:bg-slate-50 transition-colors ${employee.status === "Inactive" ? "opacity-60" : ""}`}
                        data-testid={`employee-row-${employee.id}`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {employee.status === "Inactive" && (
                              <UserX className="w-4 h-4 text-slate-400" />
                            )}
                            <div>
                              <div className="font-medium text-slate-900">
                                {employee.full_name}
                              </div>
                              <div className="text-sm text-slate-500">
                                {employee.department || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {employee.email}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className="bg-indigo-50 text-indigo-700 border-indigo-200"
                          >
                            {employee.role_type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(employee.status)}>
                            {employee.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {employee.has_account ? (
                            <Badge
                              variant="outline"
                              className={getAccountStatusColor(
                                employee.account_status,
                              )}
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              {employee.account_status}
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCreateAccountDialog({ open: true, employee })
                              }
                              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                              data-testid={`create-account-${employee.id}`}
                            >
                              <KeyRound className="w-3 h-3 mr-1" />
                              Create Account
                            </Button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Switch
                            checked={employee.status === "Active"}
                            onCheckedChange={() =>
                              handleToggleStatus(employee.id, employee.status)
                            }
                            disabled={
                              employee.status !== "Active" &&
                              employee.status !== "Inactive"
                            }
                            data-testid={`toggle-status-${employee.id}`}
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/admin/employees/${employee.id}`)
                              }
                              data-testid={`view-profile-${employee.id}`}
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(employee)}
                              data-testid={`edit-employee-${employee.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(employee.id)}
                              data-testid={`delete-employee-${employee.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredEmployees.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    No employees found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Create Account Dialog */}
          <Dialog
            open={createAccountDialog.open}
            onOpenChange={(open) => {
              if (!open) {
                setCreateAccountDialog({ open: false, employee: null });
                setAccountPassword("");
                setAccountPasswordConfirm("");
              }
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create User Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-slate-600">
                  Create a login account for:{" "}
                  <strong>{createAccountDialog.employee?.full_name}</strong>
                </p>
                <p className="text-sm text-slate-500">
                  Email: {createAccountDialog.employee?.email}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="account-password">Password</Label>
                  <Input
                    id="account-password"
                    type="password"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="bg-slate-50"
                    data-testid="account-password-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-password-confirm">
                    Confirm Password
                  </Label>
                  <Input
                    id="account-password-confirm"
                    type="password"
                    value={accountPasswordConfirm}
                    onChange={(e) => setAccountPasswordConfirm(e.target.value)}
                    placeholder="Confirm password"
                    className="bg-slate-50"
                    data-testid="account-password-confirm-input"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCreateAccountDialog({ open: false, employee: null });
                      setAccountPassword("");
                      setAccountPasswordConfirm("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateAccount}
                    disabled={creatingAccount}
                    className="bg-indigo-950 hover:bg-indigo-900"
                    data-testid="confirm-create-account-button"
                  >
                    {creatingAccount ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Password Result Dialog - Shows password once after creation */}
          <Dialog
            open={passwordResultDialog.open}
            onOpenChange={(open) => {
              if (!open) {
                setPasswordResultDialog({
                  open: false,
                  email: "",
                  password: "",
                });
                setPasswordCopied(false);
              }
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-emerald-700">
                  <UserCheck className="w-5 h-5" />
                  Account Created Successfully
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-800 font-medium mb-2">
                    Login Credentials
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Email:</span>
                      <span className="text-sm font-medium">
                        {passwordResultDialog.email}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Password:</span>
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
                    ⚠️ <strong>Important:</strong> Copy this password now. For
                    security, passwords are stored encrypted and cannot be
                    retrieved later.
                  </p>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => {
                      setPasswordResultDialog({
                        open: false,
                        email: "",
                        password: "",
                      });
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

export default EmployeesPage;
