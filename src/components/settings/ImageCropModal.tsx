import { useState, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedImage: Blob) => void;
}

export function ImageCropModal({
  isOpen,
  onClose,
  imageUrl,
  onCropComplete,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>({
    unit: "px",
    width: 150,
    height: 150,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  const onImageLoad = useCallback((img: HTMLImageElement) => {
    setImageRef(img);
    // Center the initial crop
    const minSize = Math.min(img.width, img.height);
    setCrop({
      unit: "px",
      width: 150,
      height: 150,
      x: (img.width - 150) / 2,
      y: (img.height - 150) / 2,
    });
  }, []);

  const getCroppedImg = useCallback(async () => {
    if (!imageRef || !completedCrop) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 150;
    canvas.height = 150;

    ctx.drawImage(
      imageRef,
      completedCrop.x,
      completedCrop.y,
      completedCrop.width,
      completedCrop.height,
      0,
      0,
      150,
      150
    );

    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, "image/jpeg", 0.95);
    });
  }, [imageRef, completedCrop]);

  const handleCropComplete = async () => {
    const croppedImage = await getCroppedImg();
    if (croppedImage) {
      onCropComplete(croppedImage);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Apkirpti nuotrauką</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center p-4">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            minWidth={150}
            minHeight={150}
            circularCrop
          >
            <img
              src={imageUrl}
              onLoad={(e) => onImageLoad(e.currentTarget)}
              alt="Crop"
            />
          </ReactCrop>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Atšaukti
          </Button>
          <Button onClick={handleCropComplete}>Išsaugoti</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}