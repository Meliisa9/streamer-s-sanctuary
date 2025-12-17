import { useState, useRef } from "react";
import { Camera, Upload, Link as LinkIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  currentAvatarUrl: string;
  userId: string;
  onAvatarChange: (url: string) => void;
}

export function AvatarUpload({ currentAvatarUrl, userId, onAvatarChange }: AvatarUploadProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url" | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      onAvatarChange(publicUrl);
      toast({ title: "Avatar uploaded successfully!" });
      setShowOptions(false);
      setUploadMode(null);
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;

    // Basic URL validation
    try {
      new URL(urlInput);
      onAvatarChange(urlInput);
      toast({ title: "Avatar URL updated!" });
      setShowOptions(false);
      setUploadMode(null);
      setUrlInput("");
    } catch {
      toast({ title: "Invalid URL", description: "Please enter a valid image URL", variant: "destructive" });
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {!showOptions ? (
        <button
          type="button"
          onClick={() => setShowOptions(true)}
          className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
        >
          <Camera className="w-4 h-4" />
        </button>
      ) : (
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-card border border-border rounded-xl shadow-xl z-50 min-w-[220px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Change Avatar</span>
            <button
              type="button"
              onClick={() => {
                setShowOptions(false);
                setUploadMode(null);
              }}
              className="p-1 hover:bg-secondary rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!uploadMode ? (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setUploadMode("file");
                  fileInputRef.current?.click();
                }}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload Image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setUploadMode("url")}
              >
                <LinkIcon className="w-4 h-4" />
                Use URL
              </Button>
            </div>
          ) : uploadMode === "url" ? (
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUrlSubmit}
                  className="flex-1"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadMode(null)}
                >
                  Back
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
