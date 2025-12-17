import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Search, Image, Film, Upload, Loader2, Bold, Italic, Link2, Type } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

type NewsArticle = Tables<"news_articles">;

const categories = ["Updates", "Giveaways", "Tutorials", "Reviews", "Community"];

export default function AdminNews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFontSize, setSelectedFontSize] = useState("normal");
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    content_html: "",
    category: "Updates",
    image_url: "",
    is_published: true,
    is_featured: false,
    author_id: "",
  });

  const { data: articles, isLoading } = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as NewsArticle[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { author_id, ...articleData } = data;
      const { error } = await supabase.from("news_articles").insert([{
        ...articleData,
        author_id: user?.id || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast({ title: "Article created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error creating article", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase.from("news_articles").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast({ title: "Article updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error updating article", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news_articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast({ title: "Article deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting article", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      content_html: "",
      category: "Updates",
      image_url: "",
      is_published: true,
      is_featured: false,
      author_id: "",
    });
    setEditingArticle(null);
    setSelectedFontSize("normal");
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || "",
      content: article.content,
      content_html: article.content_html || "",
      category: article.category || "Updates",
      image_url: article.image_url || "",
      is_published: article.is_published ?? true,
      is_featured: article.is_featured ?? false,
      author_id: article.author_id || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArticle) {
      updateMutation.mutate({ id: editingArticle.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const uploadMedia = async (file: File, type: "image" | "video") => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const insertMediaAtCursor = async (type: "image" | "video" | "gif") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "video" ? "video/*" : "image/*";
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const url = await uploadMedia(file, type === "video" ? "video" : "image");
      if (!url) return;

      let mediaHtml = "";
      if (type === "video") {
        mediaHtml = `\n<div class="my-6"><video controls class="w-full max-w-2xl h-auto max-h-[400px] rounded-lg mx-auto block"><source src="${url}" type="${file.type}"></video></div>\n`;
      } else {
        mediaHtml = `\n<img src="${url}" alt="Article image" class="max-w-full rounded-lg my-4" />\n`;
      }

      // Insert at cursor position in content - update both content and content_html together
      const textarea = contentRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = formData.content.substring(0, start) + mediaHtml + formData.content.substring(end);
        setFormData({ 
          ...formData, 
          content: newContent,
          content_html: newContent 
        });
      } else {
        const newContent = formData.content + mediaHtml;
        setFormData({ 
          ...formData, 
          content: newContent,
          content_html: newContent 
        });
      }

      toast({ title: `${type === "video" ? "Video" : "Image"} uploaded and inserted` });
    };

    input.click();
  };

  const insertFormatting = (format: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    
    let formattedText = "";
    let htmlTag = "";
    
    switch (format) {
      case "bold":
        formattedText = `<strong>${selectedText || "bold text"}</strong>`;
        htmlTag = formattedText;
        break;
      case "italic":
        formattedText = `<em>${selectedText || "italic text"}</em>`;
        htmlTag = formattedText;
        break;
      case "link":
        const url = prompt("Enter URL:", "https://");
        if (!url) return;
        formattedText = `<a href="${url}" class="text-primary hover:underline">${selectedText || "link text"}</a>`;
        htmlTag = formattedText;
        break;
      case "h1":
        formattedText = `<h1 class="text-3xl font-bold my-4">${selectedText || "Heading 1"}</h1>`;
        htmlTag = formattedText;
        break;
      case "h2":
        formattedText = `<h2 class="text-2xl font-bold my-3">${selectedText || "Heading 2"}</h2>`;
        htmlTag = formattedText;
        break;
      case "h3":
        formattedText = `<h3 class="text-xl font-semibold my-2">${selectedText || "Heading 3"}</h3>`;
        htmlTag = formattedText;
        break;
      case "small":
        formattedText = `<span class="text-sm">${selectedText || "small text"}</span>`;
        htmlTag = formattedText;
        break;
      case "large":
        formattedText = `<span class="text-lg">${selectedText || "large text"}</span>`;
        htmlTag = formattedText;
        break;
      default:
        return;
    }

    const newContent = formData.content.substring(0, start) + formattedText + formData.content.substring(end);
    setFormData({ 
      ...formData, 
      content: newContent,
      content_html: newContent 
    });

    // Refocus textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const filteredArticles = articles?.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">News Articles</h1>
          <p className="text-muted-foreground">Manage news and announcements</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingArticle ? "Edit Article" : "Add New Article"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) });
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Featured Image URL</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                />
              </div>
              
              {/* Media Upload Buttons */}
              <div className="space-y-2">
                <Label>Insert Media</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => insertMediaAtCursor("image")}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                    Upload Image
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => insertMediaAtCursor("gif")}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                    Upload GIF
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => insertMediaAtCursor("video")}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                    Upload Video
                  </Button>
                </div>
              </div>

              {/* Text Formatting Toolbar */}
              <div className="space-y-2">
                <Label>Text Formatting</Label>
                <div className="flex gap-2 flex-wrap p-2 bg-secondary/50 rounded-lg">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => insertFormatting("bold")}
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => insertFormatting("italic")}
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => insertFormatting("link")}
                    title="Insert Link"
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                  <div className="h-6 w-px bg-border mx-1" />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => insertFormatting("h1")}
                    title="Heading 1"
                    className="text-xs font-bold"
                  >
                    H1
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => insertFormatting("h2")}
                    title="Heading 2"
                    className="text-xs font-bold"
                  >
                    H2
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => insertFormatting("h3")}
                    title="Heading 3"
                    className="text-xs font-bold"
                  >
                    H3
                  </Button>
                  <div className="h-6 w-px bg-border mx-1" />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => insertFormatting("small")}
                    title="Small Text"
                    className="text-xs"
                  >
                    <Type className="w-3 h-3" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => insertFormatting("large")}
                    title="Large Text"
                  >
                    <Type className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select text in the content area and click a formatting button, or click to insert formatted placeholder text.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Content (supports HTML for embedded media)</Label>
                <Textarea
                  ref={contentRef}
                  value={formData.content}
                  onChange={(e) => {
                    const newContent = e.target.value;
                    setFormData({ 
                      ...formData, 
                      content: newContent,
                      content_html: newContent // Keep content_html in sync
                    });
                  }}
                  rows={12}
                  required
                  placeholder="Write your article content here. Use the formatting toolbar above or add HTML directly.&#10;&#10;Tips:&#10;- Press Enter twice for new paragraphs&#10;- Use the toolbar to add images and videos&#10;- HTML tags will be rendered in the article"
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label>Published</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label>Featured</Label>
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingArticle ? "Update Article" : "Create Article"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {filteredArticles?.map((article) => (
            <div key={article.id} className="glass rounded-xl p-4 flex items-center gap-4">
              {article.image_url && (
                <img src={article.image_url} alt="" className="w-20 h-14 object-cover rounded-lg" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{article.title}</h3>
                  {article.is_featured && <Star className="w-4 h-4 text-accent fill-accent" />}
                  {!article.is_published && <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="px-2 py-0.5 bg-secondary rounded">{article.category}</span>
                  <span>•</span>
                  <span>{article.views ?? 0} views</span>
                  <span>•</span>
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(article)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Delete this article?")) deleteMutation.mutate(article.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {filteredArticles?.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">No articles found</div>
          )}
        </div>
      )}
    </div>
  );
}
