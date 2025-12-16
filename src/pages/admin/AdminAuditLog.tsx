import { useState, useEffect } from "react";
import { Loader2, FileText, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  created_at: string;
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setLogs(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.table_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Audit Log
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="pl-9 pr-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary w-64"
          />
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left p-4 text-sm font-medium">Time</th>
              <th className="text-left p-4 text-sm font-medium">Action</th>
              <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Table</th>
              <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Record ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b border-border/50 last:border-0">
                <td className="p-4">
                  <span className="text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-medium">{log.action}</span>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">{log.table_name || "-"}</span>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <code className="text-xs text-primary">{log.record_id?.slice(0, 8) || "-"}</code>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Showing the last 100 audit log entries
      </p>
    </div>
  );
}
