import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Search, RefreshCw, Download, Filter, User, Calendar, Database, Eye, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { 
  AdminPageHeader, 
  AdminCard, 
  AdminEmptyState, 
  AdminLoadingState,
  AdminSearchInput 
} from "@/components/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  created_at: string;
  profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTable, setFilterTable] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [uniqueTables, setUniqueTables] = useState<string[]>([]);
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Fetch profiles for user_ids
      const userIds = [...new Set(data?.map(l => l.user_id).filter(Boolean))];
      let logsWithProfiles = data || [];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        logsWithProfiles = data?.map(log => ({
          ...log,
          profile: log.user_id ? profileMap.get(log.user_id) : undefined,
        })) || [];
      }

      setLogs(logsWithProfiles);

      // Extract unique values for filters
      const tables = [...new Set(data?.map(l => l.table_name).filter(Boolean) as string[])];
      const actions = [...new Set(data?.map(l => l.action).filter(Boolean) as string[])];
      setUniqueTables(tables.sort());
      setUniqueActions(actions.sort());
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.table_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.profile?.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.profile?.display_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTable = filterTable === "all" || log.table_name === filterTable;
    const matchesAction = filterAction === "all" || log.action === filterAction;
    
    return matchesSearch && matchesTable && matchesAction;
  });

  const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("insert") || action.includes("add")) 
      return "bg-green-500/10 text-green-500 border-green-500/20";
    if (action.includes("delete") || action.includes("remove")) 
      return "bg-red-500/10 text-red-500 border-red-500/20";
    if (action.includes("update") || action.includes("edit") || action.includes("modify")) 
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    if (action.includes("login") || action.includes("auth")) 
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    return "bg-secondary text-muted-foreground border-border";
  };

  const exportToCSV = () => {
    const headers = ["Timestamp", "User", "Action", "Table", "Record ID", "IP Address"];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      log.profile?.display_name || log.profile?.username || log.user_id || "System",
      log.action,
      log.table_name || "-",
      log.record_id || "-",
      log.ip_address || "-"
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const totalLogs = filteredLogs.length;
  const uniqueUsers = new Set(filteredLogs.map(l => l.user_id).filter(Boolean)).size;
  const tablesAffected = new Set(filteredLogs.map(l => l.table_name).filter(Boolean)).size;

  if (isLoading) {
    return <AdminLoadingState message="Loading audit logs..." />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit Log"
        description="Track all administrative actions and changes"
        icon={FileText}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchLogs} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportToCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50"
        >
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalLogs}</p>
            <p className="text-xs text-muted-foreground">Log Entries</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50"
        >
          <div className="p-2 rounded-lg bg-blue-500/10">
            <User className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{uniqueUsers}</p>
            <p className="text-xs text-muted-foreground">Unique Users</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50"
        >
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Database className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{tablesAffected}</p>
            <p className="text-xs text-muted-foreground">Tables Affected</p>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <AdminSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search logs..."
          className="w-64"
        />
        <Select value={filterTable} onValueChange={setFilterTable}>
          <SelectTrigger className="w-[180px] bg-secondary/50">
            <Database className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter by table" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tables</SelectItem>
            {uniqueTables.map(table => (
              <SelectItem key={table} value={table}>{table}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[180px] bg-secondary/50">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map(action => (
              <SelectItem key={action} value={action}>{action}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <AdminCard noPadding>
        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/30">
                  <th className="text-left p-4 text-sm font-medium">Timestamp</th>
                  <th className="text-left p-4 text-sm font-medium">User</th>
                  <th className="text-left p-4 text-sm font-medium">Action</th>
                  <th className="text-left p-4 text-sm font-medium hidden md:table-cell">Table</th>
                  <th className="text-left p-4 text-sm font-medium hidden lg:table-cell">Record ID</th>
                  <th className="text-right p-4 text-sm font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium">{format(new Date(log.created_at), "MMM d, HH:mm")}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {log.profile?.avatar_url ? (
                          <img src={log.profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {log.profile?.display_name || log.profile?.username || "System"}
                          </p>
                          {log.ip_address && (
                            <p className="text-xs text-muted-foreground">{log.ip_address}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{log.table_name || "-"}</span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <code className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {log.record_id?.slice(0, 8) || "-"}
                      </code>
                    </td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedLog(log)}
                        className="gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            icon={FileText}
            title="No audit logs found"
            description="Logs matching your filters will appear here"
          />
        )}
      </AdminCard>

      <p className="text-sm text-muted-foreground text-center">
        Showing {filteredLogs.length} of {logs.length} audit log entries
      </p>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Audit Log Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p className="font-medium">{format(new Date(selectedLog.created_at), "PPpp")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">
                    {selectedLog.profile?.display_name || selectedLog.profile?.username || "System"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Action</p>
                  <Badge variant="outline" className={getActionColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Table</p>
                  <p className="font-medium">{selectedLog.table_name || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Record ID</p>
                  <code className="text-sm">{selectedLog.record_id || "-"}</code>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="font-medium">{selectedLog.ip_address || "-"}</p>
                </div>
              </div>
              
              {selectedLog.old_data && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Previous Data</p>
                  <pre className="text-xs bg-secondary/50 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.new_data && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">New Data</p>
                  <pre className="text-xs bg-secondary/50 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
