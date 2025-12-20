import { useState, useEffect } from "react";
import { Newspaper, Star, Eye, Tag, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedFormDialog, FormSection, FormField, FormRow, ToggleOption } from "./EnhancedFormDialog";
import { RichTextEditor } from "@/components/RichTextEditor";

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
  const [isSaving, setIsSaving] = useState(false);

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
      <FormSection title="Content Editor" icon={<FileText className="w-4 h-4" />}>
        <FormField label="Article Content">
          <RichTextEditor
            content={formData.content_html || formData.content}
            onChange={(html) => setFormData({ ...formData, content: html, content_html: html })}
            placeholder="Write your article content here..."
            minHeight="350px"
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
