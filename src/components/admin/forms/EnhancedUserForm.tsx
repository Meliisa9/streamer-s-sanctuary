import { useState, useEffect } from "react";
import { User, Mail, Lock, Shield, Award, MessageCircle, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EnhancedFormDialog, FormSection, FormField, FormRow } from "./EnhancedFormDialog";

interface AddUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EnhancedAddUserForm({ open, onOpenChange, onSuccess }: AddUserFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    display_name: "",
  });

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      username: "",
      display_name: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast({ title: "Email and password are required", variant: "destructive" });
      return;
    }

    if (formData.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      const response = await supabase.functions.invoke("create-user", {
        body: {
          email: formData.email,
          password: formData.password,
          username: formData.username,
          display_name: formData.display_name,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: "User created successfully" });
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
      title="Create New User"
      subtitle="Add a new user to the platform"
      icon={<User className="w-5 h-5 text-primary" />}
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
      submitText={isSaving ? "Creating..." : "Create User"}
      submitIcon={<User className="w-4 h-4" />}
      size="md"
    >
      {/* Account Credentials */}
      <FormSection title="Account Credentials" icon={<Lock className="w-4 h-4" />}>
        <FormField label="Email Address" required>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              required
              className="pl-10"
            />
          </div>
        </FormField>

        <FormField label="Password" required hint="Minimum 6 characters">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              className="pl-10"
            />
          </div>
        </FormField>
      </FormSection>

      {/* Profile Information */}
      <FormSection title="Profile Information" icon={<User className="w-4 h-4" />}>
        <FormField label="Username">
          <Input
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="username"
          />
        </FormField>

        <FormField label="Display Name">
          <Input
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="Display Name"
          />
        </FormField>
      </FormSection>
    </EnhancedFormDialog>
  );
}

interface EditUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onSuccess: () => void;
}

export function EnhancedEditUserForm({ open, onOpenChange, user, onSuccess }: EditUserFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    bio: "",
    discord_tag: "",
    twitch_username: "",
    points: 0,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        display_name: user.display_name || "",
        bio: user.bio || "",
        discord_tag: user.discord_tag || "",
        twitch_username: user.twitch_username || "",
        points: user.points || 0,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: formData.username || null,
          display_name: formData.display_name || null,
          bio: formData.bio || null,
          discord_tag: formData.discord_tag || null,
          twitch_username: formData.twitch_username || null,
          points: formData.points,
        })
        .eq("user_id", user.user_id);

      if (error) throw error;

      toast({ title: "User updated successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <EnhancedFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit User Profile"
      subtitle={user.username || user.display_name || "User"}
      icon={<User className="w-5 h-5 text-primary" />}
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
      submitText={isSaving ? "Saving..." : "Save Changes"}
      submitIcon={<User className="w-4 h-4" />}
      size="lg"
    >
      {/* Basic Info */}
      <FormSection title="Basic Information" icon={<User className="w-4 h-4" />}>
        <FormRow>
          <FormField label="Username">
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="username"
            />
          </FormField>
          <FormField label="Display Name">
            <Input
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Display Name"
            />
          </FormField>
        </FormRow>

        <FormField label="Bio">
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            placeholder="User bio..."
          />
        </FormField>
      </FormSection>

      {/* Social Links */}
      <FormSection title="Connected Accounts" icon={<MessageCircle className="w-4 h-4" />}>
        <FormRow>
          <FormField label="Discord Tag">
            <Input
              value={formData.discord_tag}
              onChange={(e) => setFormData({ ...formData, discord_tag: e.target.value })}
              placeholder="username#0000"
            />
          </FormField>
          <FormField label="Twitch Username">
            <Input
              value={formData.twitch_username}
              onChange={(e) => setFormData({ ...formData, twitch_username: e.target.value })}
              placeholder="twitch_user"
            />
          </FormField>
        </FormRow>
      </FormSection>

      {/* Points */}
      <FormSection title="Rewards" icon={<Award className="w-4 h-4" />}>
        <FormField label="Points Balance">
          <div className="relative">
            <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              className="pl-10"
            />
          </div>
        </FormField>
      </FormSection>
    </EnhancedFormDialog>
  );
}
