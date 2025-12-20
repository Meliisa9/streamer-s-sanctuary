import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Link2, Upload, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CoverPhotoUploadProps {
  currentCoverUrl?: string | null;
  userId: string;
  onCoverChange: (url: string) => void;
}

export function CoverPhotoUpload({ currentCoverUrl, userId, onCoverChange }: CoverPhotoUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `covers/${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(fileName);

      // Directly update the database to persist the cover photo
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_url: publicUrl })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      onCoverChange(publicUrl);
      setIsOpen(false);
      toast({ title: "Cover photo updated!" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) {
      toast({ title: "Please enter a URL", variant: "destructive" });
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
    } catch {
      toast({ title: "Please enter a valid URL", variant: "destructive" });
      return;
    }

    // Directly update the database
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ cover_url: urlInput })
        .eq("user_id", userId);

      if (error) throw error;

      onCoverChange(urlInput);
      setIsOpen(false);
      setUrlInput("");
      toast({ title: "Cover photo updated!" });
    } catch (error: any) {
      toast({ title: "Failed to update cover", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveCover = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ cover_url: null })
        .eq("user_id", userId);

      if (error) throw error;

      onCoverChange("");
      setIsOpen(false);
      toast({ title: "Cover photo removed" });
    } catch (error: any) {
      toast({ title: "Failed to remove cover", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 shadow-lg"
        >
          <Camera className="w-4 h-4" />
          Change Cover
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Cover Photo</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <Link2 className="w-4 h-4" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 pt-4">
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="cover-upload"
              />
              <label htmlFor="cover-upload" className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                ) : (
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                )}
                <p className="text-sm text-muted-foreground">
                  {uploading ? "Uploading..." : "Click to upload an image"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Max 5MB, JPG/PNG/GIF</p>
              </label>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4 pt-4">
            <div className="space-y-3">
              <Input
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <Button onClick={handleUrlSubmit} className="w-full gap-2">
                <Link2 className="w-4 h-4" />
                Use URL
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {currentCoverUrl && (
          <Button
            variant="outline"
            onClick={handleRemoveCover}
            className="w-full gap-2 mt-4 text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4" />
            Remove Cover Photo
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
