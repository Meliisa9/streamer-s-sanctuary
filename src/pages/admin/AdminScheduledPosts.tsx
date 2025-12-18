import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Clock, Plus, Loader2, Newspaper, Gift, Trash2, Edit, Eye } from "lucide-react";
import { format } from "date-fns";

export default function AdminScheduledPosts() {
  const { isAdmin, isModerator, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [postForm, setPostForm] = useState({
    type: "news" as "news" | "giveaway",
    title: "",
    content: "",
    excerpt: "",
    category: "Updates",
    scheduledFor: "",
    scheduledTime: "",
    // Giveaway specific
    prize: "",
    endDate: "",
  });

  const { data: scheduledPosts, isLoading } = useQuery({
    queryKey: ["scheduled-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .order("scheduled_for", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (postData: any) => {
      const { error } = await supabase.from("scheduled_posts").insert(postData);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Post scheduled successfully" });
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error scheduling post", description: error.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .update({ status: "cancelled" })
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Post cancelled" });
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error cancelling post", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setPostForm({
      type: "news",
      title: "",
      content: "",
      excerpt: "",
      category: "Updates",
      scheduledFor: "",
      scheduledTime: "",
      prize: "",
      endDate: "",
    });
  };

  const handleSchedule = async () => {
    if (!postForm.title || !postForm.scheduledFor || !postForm.scheduledTime) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const scheduledDateTime = new Date(`${postForm.scheduledFor}T${postForm.scheduledTime}`);
    
    const postData: any = {
      post_type: postForm.type,
      scheduled_for: scheduledDateTime.toISOString(),
      created_by: user?.id,
      post_data: postForm.type === "news" 
        ? {
            title: postForm.title,
            content: postForm.content,
            excerpt: postForm.excerpt,
            category: postForm.category,
            slug: postForm.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          }
        : {
            title: postForm.title,
            description: postForm.content,
            prize: postForm.prize,
            end_date: postForm.endDate,
          },
    };

    createMutation.mutate(postData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pending</Badge>;
      case "published":
        return <Badge variant="default" className="bg-green-500">Published</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isAdmin && !isModerator) {
    return <div className="text-center py-20 text-muted-foreground">Access denied</div>;
  }

  return (
    <div>
      <AdminSettingsNav />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Scheduled Posts</h2>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Schedule Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Schedule New Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Post Type</label>
                  <Select
                    value={postForm.type}
                    onValueChange={(value: "news" | "giveaway") => setPostForm({ ...postForm, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="news">
                        <span className="flex items-center gap-2">
                          <Newspaper className="w-4 h-4" />
                          News Article
                        </span>
                      </SelectItem>
                      <SelectItem value="giveaway">
                        <span className="flex items-center gap-2">
                          <Gift className="w-4 h-4" />
                          Giveaway
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    placeholder="Post title..."
                  />
                </div>

                {postForm.type === "news" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Excerpt</label>
                      <Input
                        value={postForm.excerpt}
                        onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                        placeholder="Short description..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select
                        value={postForm.category}
                        onValueChange={(value) => setPostForm({ ...postForm, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Updates">Updates</SelectItem>
                          <SelectItem value="Giveaways">Giveaways</SelectItem>
                          <SelectItem value="Tutorials">Tutorials</SelectItem>
                          <SelectItem value="Reviews">Reviews</SelectItem>
                          <SelectItem value="Community">Community</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {postForm.type === "giveaway" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Prize *</label>
                      <Input
                        value={postForm.prize}
                        onChange={(e) => setPostForm({ ...postForm, prize: e.target.value })}
                        placeholder="e.g., $100 Cash"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date *</label>
                      <Input
                        type="datetime-local"
                        value={postForm.endDate}
                        onChange={(e) => setPostForm({ ...postForm, endDate: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={postForm.content}
                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                    placeholder="Post content..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Schedule Date *</label>
                    <Input
                      type="date"
                      value={postForm.scheduledFor}
                      onChange={(e) => setPostForm({ ...postForm, scheduledFor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Schedule Time *</label>
                    <Input
                      type="time"
                      value={postForm.scheduledTime}
                      onChange={(e) => setPostForm({ ...postForm, scheduledTime: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSchedule}
                  disabled={createMutation.isPending}
                  className="w-full gap-2"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  Schedule Post
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Scheduled Posts Table */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : scheduledPosts && scheduledPosts.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Scheduled For</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledPosts.map((post) => {
                  const postData = post.post_data as any;
                  return (
                    <TableRow key={post.id}>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {post.post_type === "news" ? (
                            <Newspaper className="w-3 h-3" />
                          ) : (
                            <Gift className="w-3 h-3" />
                          )}
                          {post.post_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {postData?.title || "Untitled"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-3 h-3" />
                          {format(new Date(post.scheduled_for), "MMM d, yyyy HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {post.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelMutation.mutate(post.id)}
                              disabled={cancelMutation.isPending}
                              className="gap-1 text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            No scheduled posts
          </div>
        )}
      </motion.div>
    </div>
  );
}
