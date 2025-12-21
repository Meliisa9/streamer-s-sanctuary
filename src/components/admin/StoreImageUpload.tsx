import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Link2, Image, Loader2, X, Check } from "lucide-react";

interface StoreImageUploadProps {
  currentImageUrl: string;
  onImageChange: (url: string) => void;
}

export function StoreImageUpload({ currentImageUrl, onImageChange }: StoreImageUploadProps) {
  const [uploadMode, setUploadMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(currentImageUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `store-items/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(fileName);

      onImageChange(publicUrl);
      toast({ title: "Image uploaded successfully!" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;

    // Basic URL validation
    try {
      new URL(urlInput);
      onImageChange(urlInput);
      toast({ title: "Image URL updated!" });
    } catch {
      toast({ title: "Invalid URL", description: "Please enter a valid image URL", variant: "destructive" });
    }
  };

  const clearImage = () => {
    onImageChange("");
    setUrlInput("");
  };

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <Image className="w-4 h-4 text-muted-foreground" />
        Item Image
      </Label>

      <div className="flex gap-4">
        <div className="flex-1">
          <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "upload" | "url")}>
            <TabsList className="w-full">
              <TabsTrigger value="upload" className="flex-1 gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="flex-1 gap-2">
                <Link2 className="w-4 h-4" />
                URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-3">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
                  ${dragActive 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }
                  ${isUploading ? "pointer-events-none opacity-50" : ""}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF, WebP up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="url" className="mt-3">
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Enter a direct link to an image
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        {currentImageUrl && (
          <div className="relative w-28 h-28 rounded-lg border bg-muted overflow-hidden flex-shrink-0 group">
            <img
              src={currentImageUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21,15 16,10 5,21'%3E%3C/polyline%3E%3C/svg%3E";
              }}
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
