import { useState, useEffect, useRef } from "react";
import { Newspaper, Image, Film, Link2, Bold, Italic, Type, Star, Eye, Tag, FileText, Sparkles, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedFormDialog, FormSection, FormField, FormRow, ToggleOption } from "./EnhancedFormDialog";

const categories = ["Updates", "Giveaways", "Tutorials", "Reviews", "Community"];

interface NewsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingArticle?: any;
  onSuccess: () => void;
}

export function EnhancedNewsForm({ open, onOpenChange, editingArticle, onSuccess }: NewsFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
  });

  useEffect(() => {
    if (editingArticle) {
      setFormData({
        title: editingArticle.title,
        slug: editingArticle.slug,
        excerpt: editingArticle.excerpt || "",
        content: editingArticle.content,
        content_html: editingArticle.content_html || "",
        category: editingArticle.category || "Updates",
        image_url: editingArticle.image_url || "",
        is_published: editingArticle.is_published ?? true,
        is_featured: editingArticle.is_featured ?? false,
      });
    } else {
      resetForm();
    }
  }, [editingArticle, open]);

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
    });
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  const uploadMedia = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("media").upload(fileName, file, { upsert: true });
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

  const insertMediaAtCursor = async (type: "image" | "video") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = type === "video" ? "video/*" : "image/*";
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const url = await uploadMedia(file);
      if (!url) return;

      let mediaHtml = "";
      if (type === "video") {
        mediaHtml = `\n<div class="my-6"><video controls class="w-full max-w-2xl h-auto max-h-[400px] rounded-lg mx-auto block"><source src="${url}" type="${file.type}"></video></div>\n`;
      } else {
        mediaHtml = `\n<img src="${url}" alt="Article image" class="max-w-full rounded-lg my-4" />\n`;
      }

      const textarea = contentRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const newContent = formData.content.substring(0, start) + mediaHtml + formData.content.substring(textarea.selectionEnd);
        setFormData({ ...formData, content: newContent, content_html: newContent });
      } else {
        const newContent = formData.content + mediaHtml;
        setFormData({ ...formData, content: newContent, content_html: newContent });
      }
      toast({ title: `${type === "video" ? "Video" : "Image"} inserted` });
    };
    input.click();
  };

  const insertFormatting = (format: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    
    const formatMap: Record<string, string> = {
      bold: `<strong>${selectedText || "bold text"}</strong>`,
      italic: `<em>${selectedText || "italic text"}</em>`,
      h2: `<h2 class="text-2xl font-bold my-3">${selectedText || "Heading 2"}</h2>`,
      h3: `<h3 class="text-xl font-semibold my-2">${selectedText || "Heading 3"}</h3>`,
    };

    const formattedText = formatMap[format] || "";
    const newContent = formData.content.substring(0, start) + formattedText + formData.content.substring(end);
    setFormData({ ...formData, content: newContent, content_html: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const articleData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || null,
        content: formData.content,
        content_html: formData.content_html || formData.content,
        category: formData.category,
        image_url: formData.image_url || null,
        is_published: formData.is_published,
        is_featured: formData.is_featured,
        author_id: user?.id || null,
      };

      if (editingArticle) {
        const { error } = await supabase.from("news_articles").update(articleData).eq("id", editingArticle.id);
        if (error) throw error;
        toast({ title: "Article updated successfully" });
      } else {
        const { error } = await supabase.from("news_articles").insert([articleData]);
        if (error) throw error;
        toast({ title: "Article created successfully" });
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EnhancedFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingArticle ? "Edit Article" : "Create New Article"}
      subtitle="Write engaging content for your community"
      icon={<Newspaper className="w-5 h-5 text-primary" />}
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
      submitText={isSaving ? "Saving..." : "Publish Article"}
      submitIcon={<FileText className="w-4 h-4" />}
      size="2xl"
    >
      {/* Basic Info Section */}
      <FormSection title="Article Details" icon={<FileText className="w-4 h-4" />}>
        <FormRow>
          <FormField label="Title" required>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) })}
              placeholder="Article title..."
              required
            />
          </FormField>
          <FormField label="URL Slug" required>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="article-url-slug"
              required
            />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField label="Category">
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary appearance-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </FormField>
          <FormField label="Featured Image URL">
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
          </FormField>
        </FormRow>

        <FormField label="Excerpt" hint="Short description shown in listings">
          <Textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            rows={2}
            placeholder="Brief summary of the article..."
          />
        </FormField>
      </FormSection>

      {/* Content Editor Section */}
      <FormSection title="Content Editor" icon={<Type className="w-4 h-4" />}>
        {/* Toolbar */}
        <div className="flex gap-2 flex-wrap p-3 bg-secondary/50 rounded-xl border border-border/50">
          <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("bold")} title="Bold">
            <Bold className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("italic")} title="Italic">
            <Italic className="w-4 h-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-1" />
          <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("h2")} className="text-xs font-bold">H2</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => insertFormatting("h3")} className="text-xs font-bold">H3</Button>
          <div className="h-6 w-px bg-border mx-1" />
          <Button type="button" variant="outline" size="sm" onClick={() => insertMediaAtCursor("image")} disabled={isUploading} className="gap-1">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
            Image
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => insertMediaAtCursor("video")} disabled={isUploading} className="gap-1">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
            Video
          </Button>
        </div>

        <FormField label="Content (HTML supported)">
          <Textarea
            ref={contentRef}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value, content_html: e.target.value })}
            rows={12}
            placeholder="Write your article content here. HTML is supported..."
            className="font-mono text-sm"
          />
        </FormField>
      </FormSection>

      {/* Visibility Section */}
      <FormSection title="Publishing Options" icon={<Eye className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <ToggleOption
            checked={formData.is_featured}
            onChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            icon={<Star className="w-4 h-4" />}
            label="Featured Article"
            description="Show in featured section"
            color="amber"
          />
          <ToggleOption
            checked={formData.is_published}
            onChange={(checked) => setFormData({ ...formData, is_published: checked })}
            icon={<Eye className="w-4 h-4" />}
            label="Published"
            description="Visible to everyone"
            color="green"
          />
        </div>
      </FormSection>
    </EnhancedFormDialog>
  );
}
