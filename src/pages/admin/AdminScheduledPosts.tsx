import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AdminSettingsNav } from "@/components/admin/AdminSettingsNav";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, Clock, Plus, Loader2, Newspaper, Gift, Trash2, 
  Edit, Eye, CalendarDays, CheckCircle2, XCircle, AlertCircle,
  Timer, Sparkles, FileText, Zap, CalendarClock, Send, Image
} from "lucide-react";
import { format, isToday, isTomorrow, isPast, isFuture, formatDistanceToNow } from "date-fns";

interface ScheduledPost {
  id: string;
  post_type: string;
  scheduled_for: string;
  status: string;
  created_at: string;
  published_at: string | null;
  error_message: string | null;
  post_data: {
    title?: string;
    content?: string;
    excerpt?: string;
    category?: string;
    slug?: string;
    description?: string;
    prize?: string;
    end_date?: string;
    image_url?: string;
  };
}

export default function AdminScheduledPosts() {
  const { isAdmin, isModerator, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<"all" | "pending" | "published" | "cancelled">("all");
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [postForm, setPostForm] = useState({
    type: "news" as "news" | "giveaway",
    title: "",
    content: "",
    excerpt: "",
    category: "Updates",
    scheduledFor: "",
    scheduledTime: "",
    imageUrl: "",
    // Giveaway specific
    prize: "",
    endDate: "",
    isExclusive: false,
    winnersCount: 1,
  });

  const { data: scheduledPosts, isLoading } = useQuery({
    queryKey: ["scheduled-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .order("scheduled_for", { ascending: true });
      if (error) throw error;
      return data as ScheduledPost[];
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Post updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      setIsDialogOpen(false);
      setEditingPost(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error updating post", description: error.message, variant: "destructive" });
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

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Post deleted" });
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting post", description: error.message, variant: "destructive" });
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
      imageUrl: "",
      prize: "",
      endDate: "",
      isExclusive: false,
      winnersCount: 1,
    });
    setEditingPost(null);
  };

  const handleEdit = (post: ScheduledPost) => {
    setEditingPost(post);
    const scheduledDate = new Date(post.scheduled_for);
    setPostForm({
      type: post.post_type as "news" | "giveaway",
      title: post.post_data.title || "",
      content: post.post_data.content || post.post_data.description || "",
      excerpt: post.post_data.excerpt || "",
      category: post.post_data.category || "Updates",
      scheduledFor: format(scheduledDate, "yyyy-MM-dd"),
      scheduledTime: format(scheduledDate, "HH:mm"),
      imageUrl: post.post_data.image_url || "",
      prize: post.post_data.prize || "",
      endDate: post.post_data.end_date || "",
      isExclusive: false,
      winnersCount: 1,
    });
    setIsDialogOpen(true);
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
            image_url: postForm.imageUrl,
            slug: postForm.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          }
        : {
            title: postForm.title,
            description: postForm.content,
            prize: postForm.prize,
            end_date: postForm.endDate,
            image_url: postForm.imageUrl,
            is_exclusive: postForm.isExclusive,
            winners_count: postForm.winnersCount,
          },
    };

    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: postData });
    } else {
      createMutation.mutate(postData);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
            <Timer className="w-3 h-3" />
            Pending
          </Badge>
        );
      case "published":
        return (
          <Badge className="gap-1 bg-green-500/20 text-green-500 border-green-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Published
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="w-3 h-3" />
            Cancelled
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTimeIndicator = (scheduledFor: string) => {
    const date = new Date(scheduledFor);
    if (isPast(date)) {
      return <span className="text-muted-foreground text-xs">Past</span>;
    }
    if (isToday(date)) {
      return <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/30">Today</Badge>;
    }
    if (isTomorrow(date)) {
      return <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/30">Tomorrow</Badge>;
    }
    return <span className="text-xs text-muted-foreground">{formatDistanceToNow(date, { addSuffix: true })}</span>;
  };

  // Filter posts based on active view
  const filteredPosts = scheduledPosts?.filter(post => {
    if (activeView === "all") return true;
    return post.status === activeView;
  }) || [];

  // Stats
  const stats = {
    total: scheduledPosts?.length || 0,
    pending: scheduledPosts?.filter(p => p.status === "pending").length || 0,
    published: scheduledPosts?.filter(p => p.status === "published").length || 0,
    cancelled: scheduledPosts?.filter(p => p.status === "cancelled").length || 0,
    news: scheduledPosts?.filter(p => p.post_type === "news").length || 0,
    giveaways: scheduledPosts?.filter(p => p.post_type === "giveaway").length || 0,
  };

  if (!isAdmin && !isModerator) {
    return <div className="text-center py-20 text-muted-foreground">Access denied</div>;
  }

  return (
    <div className="space-y-6">
      <AdminSettingsNav />
      
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-blue-500/10 border border-primary/20 p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-primary/20 backdrop-blur-sm">
              <CalendarClock className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Content Scheduler</h1>
              <p className="text-muted-foreground">Schedule news articles and giveaways to auto-publish</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Timer className="w-4 h-4" />
                <span className="text-xs">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
            </div>
            <div className="p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs">Published</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{stats.published}</p>
            </div>
            <div className="p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Newspaper className="w-4 h-4" />
                <span className="text-xs">News</span>
              </div>
              <p className="text-2xl font-bold">{stats.news}</p>
            </div>
            <div className="p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Gift className="w-4 h-4" />
                <span className="text-xs">Giveaways</span>
              </div>
              <p className="text-2xl font-bold">{stats.giveaways}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Schedule Form Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-80 flex-shrink-0"
        >
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Quick Schedule
              </CardTitle>
              <CardDescription>Create a new scheduled post</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => {
                  resetForm();
                  setPostForm(prev => ({ ...prev, type: "news" }));
                  setIsDialogOpen(true);
                }}
                className="w-full gap-2 justify-start"
                variant="outline"
              >
                <Newspaper className="w-4 h-4 text-blue-500" />
                Schedule News Article
              </Button>
              <Button 
                onClick={() => {
                  resetForm();
                  setPostForm(prev => ({ ...prev, type: "giveaway" }));
                  setIsDialogOpen(true);
                }}
                className="w-full gap-2 justify-start"
                variant="outline"
              >
                <Gift className="w-4 h-4 text-primary" />
                Schedule Giveaway
              </Button>
              
              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Status Filter</p>
                <div className="space-y-2">
                  {[
                    { value: "all", label: "All Posts", count: stats.total },
                    { value: "pending", label: "Pending", count: stats.pending },
                    { value: "published", label: "Published", count: stats.published },
                    { value: "cancelled", label: "Cancelled", count: stats.cancelled },
                  ].map(item => (
                    <button
                      key={item.value}
                      onClick={() => setActiveView(item.value as any)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                        activeView === item.value 
                          ? "bg-primary/10 text-primary" 
                          : "hover:bg-secondary/50"
                      }`}
                    >
                      <span>{item.label}</span>
                      <Badge variant="secondary" className="text-xs">{item.count}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Posts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  Scheduled Posts
                </CardTitle>
                <Badge variant="outline">{filteredPosts.length} posts</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredPosts.length > 0 ? (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredPosts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-start gap-4">
                          {/* Type Icon */}
                          <div className={`p-3 rounded-xl ${
                            post.post_type === "news" 
                              ? "bg-blue-500/10 text-blue-500" 
                              : "bg-primary/10 text-primary"
                          }`}>
                            {post.post_type === "news" ? (
                              <Newspaper className="w-5 h-5" />
                            ) : (
                              <Gift className="w-5 h-5" />
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold truncate">
                                {post.post_data.title || "Untitled"}
                              </h4>
                              {getStatusBadge(post.status)}
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(post.scheduled_for), "MMM d, yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(post.scheduled_for), "HH:mm")}
                              </span>
                              {getTimeIndicator(post.scheduled_for)}
                            </div>
                            
                            {post.post_data.excerpt && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {post.post_data.excerpt}
                              </p>
                            )}
                            
                            {post.error_message && (
                              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {post.error_message}
                              </p>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {post.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(post)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => cancelMutation.mutate(post.id)}
                                  disabled={cancelMutation.isPending}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {(post.status === "cancelled" || post.status === "failed") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMutation.mutate(post.id)}
                                disabled={deleteMutation.isPending}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="font-semibold mb-1">No scheduled posts</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {activeView === "all" 
                      ? "Schedule your first post to see it here"
                      : `No ${activeView} posts found`}
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Schedule Post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {editingPost ? "Edit Scheduled Post" : "Schedule New Post"}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={postForm.type} onValueChange={(v) => setPostForm({ ...postForm, type: v as "news" | "giveaway" })}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="news" className="gap-2">
                <Newspaper className="w-4 h-4" />
                News Article
              </TabsTrigger>
              <TabsTrigger value="giveaway" className="gap-2">
                <Gift className="w-4 h-4" />
                Giveaway
              </TabsTrigger>
            </TabsList>
            
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Title *
                </label>
                <Input
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  placeholder="Enter post title..."
                  className="bg-secondary/30"
                />
              </div>

              {/* News-specific fields */}
              <TabsContent value="news" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Excerpt</label>
                  <Input
                    value={postForm.excerpt}
                    onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                    placeholder="Short description for preview..."
                    className="bg-secondary/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={postForm.category}
                    onValueChange={(value) => setPostForm({ ...postForm, category: value })}
                  >
                    <SelectTrigger className="bg-secondary/30">
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
              </TabsContent>

              {/* Giveaway-specific fields */}
              <TabsContent value="giveaway" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prize *</label>
                    <Input
                      value={postForm.prize}
                      onChange={(e) => setPostForm({ ...postForm, prize: e.target.value })}
                      placeholder="e.g., $100 Cash"
                      className="bg-secondary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Winners Count</label>
                    <Input
                      type="number"
                      min="1"
                      value={postForm.winnersCount}
                      onChange={(e) => setPostForm({ ...postForm, winnersCount: parseInt(e.target.value) || 1 })}
                      className="bg-secondary/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date *</label>
                  <Input
                    type="datetime-local"
                    value={postForm.endDate}
                    onChange={(e) => setPostForm({ ...postForm, endDate: e.target.value })}
                    className="bg-secondary/30"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <p className="text-sm font-medium">Exclusive Giveaway</p>
                    <p className="text-xs text-muted-foreground">Only for eligible members</p>
                  </div>
                  <Switch
                    checked={postForm.isExclusive}
                    onCheckedChange={(checked) => setPostForm({ ...postForm, isExclusive: checked })}
                  />
                </div>
              </TabsContent>

              {/* Shared fields */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Image className="w-4 h-4 text-muted-foreground" />
                  Image URL
                </label>
                <Input
                  value={postForm.imageUrl}
                  onChange={(e) => setPostForm({ ...postForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="bg-secondary/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  placeholder="Post content..."
                  rows={4}
                  className="bg-secondary/30"
                />
              </div>

              {/* Schedule Time */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <CalendarClock className="w-4 h-4 text-primary" />
                  Schedule Date & Time *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    value={postForm.scheduledFor}
                    onChange={(e) => setPostForm({ ...postForm, scheduledFor: e.target.value })}
                    className="bg-background"
                  />
                  <Input
                    type="time"
                    value={postForm.scheduledTime}
                    onChange={(e) => setPostForm({ ...postForm, scheduledTime: e.target.value })}
                    className="bg-background"
                  />
                </div>
              </div>

              <Button
                onClick={handleSchedule}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full gap-2"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {editingPost ? "Update Scheduled Post" : "Schedule Post"}
              </Button>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}