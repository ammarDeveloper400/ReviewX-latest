import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuditLogsPage = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(response.data || []);
    } catch (error) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    const normalized = (action || "").toUpperCase();
    if (["CREATE", "PUBLISH", "ACTIVATE", "MARK_PAID"].includes(normalized)) {
      return <Badge className="bg-emerald-50 text-emerald-700">{action}</Badge>;
    }
    if (["UPDATE", "UNPUBLISH"].includes(normalized)) {
      return <Badge className="bg-amber-50 text-amber-700">{action}</Badge>;
    }
    if (["DELETE", "DEACTIVATE"].includes(normalized)) {
      return <Badge className="bg-rose-50 text-rose-700">{action}</Badge>;
    }
    return <Badge className="bg-slate-50 text-slate-700">{action}</Badge>;
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
    <div className="flex" data-testid="audit-logs-page">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
                Audit Logs
              </h1>
              <p className="text-lg text-slate-500">
                All status changes and audit trail entries
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-3 pr-4">Time</th>
                      <th className="py-3 pr-4">User</th>
                      <th className="py-3 pr-4">Role</th>
                      <th className="py-3 pr-4">Action</th>
                      <th className="py-3 pr-4">Entity</th>
                      <th className="py-3 pr-4">Entity ID</th>
                      <th className="py-3 pr-4">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 whitespace-nowrap text-slate-700">
                          {log.timestamp
                            ? new Date(log.timestamp).toLocaleString()
                            : "-"}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {log.user_email || "System"}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {log.user_role || "-"}
                        </td>
                        <td className="py-3 pr-4">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {log.entity_type}
                        </td>
                        <td className="py-3 pr-4 text-slate-500">
                          {log.entity_id}
                        </td>
                        <td className="py-3 pr-4 text-slate-600 max-w-md">
                          <span className="line-clamp-2">
                            {log.details ? JSON.stringify(log.details) : "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {logs.length === 0 && (
                  <div className="text-center py-10 text-slate-500">
                    No audit logs found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
