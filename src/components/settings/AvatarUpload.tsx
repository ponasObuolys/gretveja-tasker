import { useState } from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ImageCropModal } from "./ImageCropModal";
import type { Profile } from "@/pages/Settings";

interface AvatarUploadProps {
  profile: Profile;
  onAvatarChange: (file: File) => void;
  avatarPreview: string | null;
  isUploading?: boolean;
}

export function AvatarUpload({ 
  profile, 
  onAvatarChange, 
  avatarPreview,
  isUploading = false 
}: AvatarUploadProps) {
  const { toast } = useToast();
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Klaida",
        description: "Nuotrauka negali būti didesnė nei 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImageUrl(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
    onAvatarChange(file);
    setCropModalOpen(false);
  };

  return (
    <div className="flex flex-col items-center mb-8">
      <div className="relative group">
        <Avatar className="w-40 h-40">
          <AvatarImage src={avatarPreview || profile?.avatar_url || ''} />
          <AvatarFallback>
            {profile?.email?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <label
          htmlFor="avatar-upload"
          className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full 
            ${isUploading ? 'opacity-100 cursor-wait' : 'opacity-0 group-hover:opacity-100 cursor-pointer'} 
            transition-opacity`}
        >
          {isUploading ? (
            <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin" />
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
          disabled={isUploading}
        />
      </div>
      <p className="text-sm text-gray-400 mt-2">
        Rekomenduojamas dydis: 150x150px
      </p>

      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageUrl={selectedImageUrl}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}