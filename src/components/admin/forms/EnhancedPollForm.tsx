import { useState, useEffect } from "react";
import { BarChart, Plus, X, Star, Clock, CheckSquare, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedFormDialog, FormSection, FormField, FormRow, ToggleOption } from "./EnhancedFormDialog";

interface PollFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPoll?: any;
  onSuccess: () => void;
}

export function EnhancedPollForm({ open, onOpenChange, editingPoll, onSuccess }: PollFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    options: ["", ""],
    is_active: true,
    is_multiple_choice: false,
    ends_at: "",
  });

  useEffect(() => {
    if (editingPoll) {
      setFormData({
        title: editingPoll.title,
        description: editingPoll.description || "",
        options: editingPoll.options.length > 0 ? editingPoll.options : ["", ""],
        is_active: editingPoll.is_active ?? true,
        is_multiple_choice: editingPoll.is_multiple_choice ?? false,
        ends_at: editingPoll.ends_at ? editingPoll.ends_at.slice(0, 16) : "",
      });
    } else {
      resetForm();
    }
  }, [editingPoll, open]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      options: ["", ""],
      is_active: true,
      is_multiple_choice: false,
      ends_at: "",
    });
  };

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData({ ...formData, options: [...formData.options, ""] });
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData({ ...formData, options: formData.options.filter((_, i) => i !== index) });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredOptions = formData.options.filter((o) => o.trim() !== "");
    if (filteredOptions.length < 2) {
      toast({ title: "At least 2 options required", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      const pollData = {
        title: formData.title,
        description: formData.description || null,
        options: filteredOptions,
        is_active: formData.is_active,
        is_multiple_choice: formData.is_multiple_choice,
        ends_at: formData.ends_at || null,
        created_by: user?.id,
        is_community: false,
        is_approved: true,
      };

      if (editingPoll) {
        const { error } = await supabase.from("polls").update(pollData).eq("id", editingPoll.id);
        if (error) throw error;
        toast({ title: "Poll updated" });
      } else {
        const { error } = await supabase.from("polls").insert([pollData]);
        if (error) throw error;
        toast({ title: "Poll created" });
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
      title={editingPoll ? "Edit Poll" : "Create Official Poll"}
      subtitle="Ask your community a question"
      icon={<BarChart className="w-5 h-5 text-primary" />}
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
      submitText={isSaving ? "Saving..." : "Create Poll"}
      submitIcon={<BarChart className="w-4 h-4" />}
      size="lg"
    >
      {/* Question */}
      <FormSection title="Question" icon={<FileText className="w-4 h-4" />}>
        <FormField label="Poll Question" required>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="What's your favorite...?"
            required
          />
        </FormField>

        <FormField label="Description (Optional)">
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            placeholder="Additional context for the poll..."
          />
        </FormField>
      </FormSection>

      {/* Options */}
      <FormSection title="Answer Options" icon={<CheckSquare className="w-4 h-4" />}>
        <div className="space-y-3">
          {formData.options.map((option, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex items-center justify-center w-8 h-10 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                {index + 1}
              </div>
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                required={index < 2}
                className="flex-1"
              />
              {formData.options.length > 2 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(index)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        
        {formData.options.length < 10 && (
          <Button type="button" variant="outline" size="sm" onClick={addOption} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Option
          </Button>
        )}
        
        <p className="text-xs text-muted-foreground">
          {formData.options.filter(o => o.trim()).length} of {formData.options.length} options filled ({10 - formData.options.length} more available)
        </p>
      </FormSection>

      {/* Settings */}
      <FormSection title="Settings" icon={<Clock className="w-4 h-4" />}>
        <FormField label="End Date & Time (Optional)">
          <Input
            type="datetime-local"
            value={formData.ends_at}
            onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <ToggleOption
            checked={formData.is_multiple_choice}
            onChange={(checked) => setFormData({ ...formData, is_multiple_choice: checked })}
            icon={<CheckSquare className="w-4 h-4" />}
            label="Multiple Choice"
            description="Allow multiple selections"
            color="primary"
          />
          <ToggleOption
            checked={formData.is_active}
            onChange={(checked) => setFormData({ ...formData, is_active: checked })}
            icon={<Star className="w-4 h-4" />}
            label="Active"
            description="Accept votes"
            color="green"
          />
        </div>
      </FormSection>
    </EnhancedFormDialog>
  );
}
