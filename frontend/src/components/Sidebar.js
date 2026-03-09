import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  User,
  Settings,
  UserCog,
  ShieldCheck,
  Star,
  Menu,
  ScrollText,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const adminLinks = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/employees", label: "Employees", icon: Users },
    { path: "/admin/internal-reviews", label: "Reviews", icon: FileText },
    { path: "/admin/users", label: "User Accounts", icon: UserCog },
    { path: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
    {
      path: "/admin/admin-management",
      label: "Admin Management",
      icon: ShieldCheck,
    },
    { path: "/admin/categories", label: "Categories", icon: Settings },
    { path: "/admin/bonus-brackets", label: "Bonus Brackets", icon: Settings },
    { path: "/admin/salary-payable", label: "Salary Payable", icon: FileText },
  ];

  const pmLinks = [
    { path: "/pm", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/internal-reviews", label: "Reviews", icon: FileText },
    { path: "/pm/my-reviews", label: "My Reviews", icon: Star },
  ];

  const employeeLinks = [
    { path: "/employee", label: "My Reviews", icon: FileText },
  ];

  const links =
    user?.role === "Admin"
      ? adminLinks
      : user?.role === "PM"
        ? pmLinks
        : employeeLinks;

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-indigo-950 tracking-tight">
          ReviewX
        </h1>
        <p className="text-sm text-slate-500 mt-1">Performance System</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              data-testid={`sidebar-${link.label.toLowerCase().replace(" ", "-")}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-indigo-950 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <User size={20} className="text-indigo-950" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start gap-2"
          data-testid="logout-button"
        >
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-white shadow-md"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            {SidebarContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 h-screen flex-col sticky top-0">
        {SidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
