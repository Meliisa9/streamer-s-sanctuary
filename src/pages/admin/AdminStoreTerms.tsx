import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, FileText, Plus, Trash2, GripVertical, ExternalLink, Eye, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FAQItem {
  question: string;
  answer: string;
}

interface FooterLink {
  label: string;
  url: string;
}

interface StoreTermsSettings {
  store_terms_enabled: boolean;
  store_terms_intro: string;
  store_terms_faq: FAQItem[];
  store_terms_footer_text: string;
  store_terms_footer_links: FooterLink[];
  store_restock_info: string;
  store_delivery_info: string;
}

const defaultSettings: StoreTermsSettings = {
  store_terms_enabled: true,
  store_terms_intro: "Welcome to our Points Store! Please read the following frequently asked questions to understand how our store works.",
  store_terms_faq: [
    {
      question: "HOW DO I COLLECT POINTS?",
      answer: "Points are earned by watching streams, participating in community events, daily check-ins, and engaging with our content."
    },
    {
      question: "WHAT CAN I DO WITH MY POINTS?",
      answer: "You can use your points to claim items from the store. The range of products will change regularly."
    },
    {
      question: "HOW LONG WILL IT TAKE TO GET AN ITEM?",
      answer: "Digital items will be credited within 14 business days from approval. Physical items may take longer."
    }
  ],
  store_terms_footer_text: "For more information, please check our Terms of Service and Privacy Policy.",
  store_terms_footer_links: [
    { label: "Terms of Service", url: "/terms" },
    { label: "Privacy Policy", url: "/privacy" }
  ],
  store_restock_info: "Latest restock information will be announced on stream.",
  store_delivery_info: "Item will be credited within 14 BUSINESS DAYS from the day of the approval."
};

function SortableFAQItem({
  faq,
  index,
  onUpdate,
  onDelete,
}: {
  faq: FAQItem;
  index: number;
  onUpdate: (index: number, field: "question" | "answer", value: string) => void;
  onDelete: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `faq-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 rounded-lg border bg-card ${isDragging ? "shadow-lg ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5" />
        </button>
        <div className="flex-1 space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Question</Label>
            <Input
              value={faq.question}
              onChange={(e) => onUpdate(index, "question", e.target.value)}
              placeholder="Enter question..."
              className="font-medium"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Answer</Label>
            <Textarea
              value={faq.answer}
              onChange={(e) => onUpdate(index, "answer", e.target.value)}
              placeholder="Enter answer..."
              className="min-h-[80px]"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-2"
          onClick={() => onDelete(index)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminStoreTerms() {
  const [settings, setSettings] = useState<StoreTermsSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const keys = Object.keys(defaultSettings);
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", keys);

      if (error) throw error;

      const loadedSettings: StoreTermsSettings = { ...defaultSettings };
      data?.forEach((row) => {
        const key = row.key as keyof StoreTermsSettings;
        if (key in loadedSettings) {
          loadedSettings[key] = row.value as never;
        }
      });

      setSettings(loadedSettings);
    } catch (error: any) {
      toast({ title: "Error loading settings", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from("site_settings")
          .upsert({ key, value }, { onConflict: "key" });
        if (error) throw error;
      }
      toast({ title: "Settings saved successfully!" });
    } catch (error: any) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = settings.store_terms_faq.findIndex((_, i) => `faq-${i}` === active.id);
      const newIndex = settings.store_terms_faq.findIndex((_, i) => `faq-${i}` === over.id);
      setSettings((s) => ({
        ...s,
        store_terms_faq: arrayMove(s.store_terms_faq, oldIndex, newIndex),
      }));
    }
  };

  const updateFAQ = (index: number, field: "question" | "answer", value: string) => {
    setSettings((s) => ({
      ...s,
      store_terms_faq: s.store_terms_faq.map((faq, i) =>
        i === index ? { ...faq, [field]: value } : faq
      ),
    }));
  };

  const addFAQ = () => {
    setSettings((s) => ({
      ...s,
      store_terms_faq: [...s.store_terms_faq, { question: "", answer: "" }],
    }));
  };

  const deleteFAQ = (index: number) => {
    setSettings((s) => ({
      ...s,
      store_terms_faq: s.store_terms_faq.filter((_, i) => i !== index),
    }));
  };

  const updateFooterLink = (index: number, field: "label" | "url", value: string) => {
    setSettings((s) => ({
      ...s,
      store_terms_footer_links: s.store_terms_footer_links.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const addFooterLink = () => {
    setSettings((s) => ({
      ...s,
      store_terms_footer_links: [...s.store_terms_footer_links, { label: "", url: "" }],
    }));
  };

  const deleteFooterLink = (index: number) => {
    setSettings((s) => ({
      ...s,
      store_terms_footer_links: s.store_terms_footer_links.filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Store Terms & Conditions"
        description="Configure the Store T&C page content and FAQ items"
        icon={FileText}
      />

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Switch
            checked={settings.store_terms_enabled}
            onCheckedChange={(v) => setSettings((s) => ({ ...s, store_terms_enabled: v }))}
          />
          <Label>Enable Store T&C Page</Label>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/store/terms" target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </a>
          </Button>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Introduction</CardTitle>
            <CardDescription>The introductory text shown at the top of the page</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={settings.store_terms_intro}
              onChange={(e) => setSettings((s) => ({ ...s, store_terms_intro: e.target.value }))}
              placeholder="Enter introduction text..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Store Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Store Information</CardTitle>
            <CardDescription>Key information displayed on the store page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Restock Information</Label>
              <Input
                value={settings.store_restock_info}
                onChange={(e) => setSettings((s) => ({ ...s, store_restock_info: e.target.value }))}
                placeholder="e.g., Latest restock: 09 Dec 2025"
              />
            </div>
            <div className="space-y-2">
              <Label>Delivery Information</Label>
              <Input
                value={settings.store_delivery_info}
                onChange={(e) => setSettings((s) => ({ ...s, store_delivery_info: e.target.value }))}
                placeholder="e.g., Items credited within 14 business days"
              />
            </div>
          </CardContent>
        </Card>

        {/* FAQ Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">FAQ Items</CardTitle>
              <CardDescription>Questions and answers shown as an accordion</CardDescription>
            </div>
            <Button onClick={addFAQ} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={settings.store_terms_faq.map((_, i) => `faq-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {settings.store_terms_faq.map((faq, index) => (
                    <SortableFAQItem
                      key={`faq-${index}`}
                      faq={faq}
                      index={index}
                      onUpdate={updateFAQ}
                      onDelete={deleteFAQ}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {settings.store_terms_faq.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No FAQ items yet. Click "Add FAQ" to create one.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Footer Section</CardTitle>
            <CardDescription>Footer text and links shown at the bottom</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Footer Text</Label>
              <Textarea
                value={settings.store_terms_footer_text}
                onChange={(e) => setSettings((s) => ({ ...s, store_terms_footer_text: e.target.value }))}
                placeholder="Enter footer text..."
              />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Footer Links</Label>
                <Button variant="outline" size="sm" onClick={addFooterLink}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Link
                </Button>
              </div>
              {settings.store_terms_footer_links.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={link.label}
                    onChange={(e) => updateFooterLink(index, "label", e.target.value)}
                    placeholder="Link Label"
                    className="flex-1"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => updateFooterLink(index, "url", e.target.value)}
                    placeholder="/terms or https://..."
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteFooterLink(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
