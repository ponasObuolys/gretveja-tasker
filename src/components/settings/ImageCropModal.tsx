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

    // Calculate the center position for the initial crop
    const minDimension = Math.min(img.width, img.height);
    const cropSize = Math.min(150, minDimension);
    
    setCrop({
      unit: "px",
      width: cropSize,
      height: cropSize,
      x: (img.width - cropSize) / 2,
      y: (img.height - cropSize) / 2,
    });
  }, []);

  const getCroppedImg = useCallback(async () => {
    if (!imageRef || !completedCrop) {
      console.error("Missing image or crop data");
      return;
    }

    // Create a temporary canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("No 2d context");
      return;
    }

    // Set the canvas size to our desired output size
    canvas.width = 150;
    canvas.height = 150;

    // Calculate scale factors
    const scaleX = imageRef.naturalWidth / imageRef.width;
    const scaleY = imageRef.naturalHeight / imageRef.height;

    // Calculate the actual source dimensions
    const sourceX = completedCrop.x * scaleX;
    const sourceY = completedCrop.y * scaleY;
    const sourceWidth = completedCrop.width * scaleX;
    const sourceHeight = completedCrop.height * scaleY;

    // Draw the cropped image
    ctx.drawImage(
      imageRef,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      150,
      150
    );

    // Create a circular clipping path
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(75, 75, 75, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    return new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
        },
        "image/jpeg",
        0.95
      );
    });
  }, [imageRef, completedCrop]);

  const handleCropComplete = async () => {
    console.log("Starting crop completion");
    const croppedImage = await getCroppedImg();
    if (croppedImage) {
      console.log("Crop completed successfully");
      onCropComplete(croppedImage);
      onClose();
    } else {
      console.error("Failed to generate cropped image");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#242832]">
        <DialogHeader>
          <DialogTitle className="text-white">Apkirpti nuotrauką</DialogTitle>
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
            className="max-h-[500px]"
          >
            <img
              src={imageUrl}
              onLoad={(e) => onImageLoad(e.currentTarget)}
              alt="Crop"
              className="max-h-[500px] w-auto"
            />
          </ReactCrop>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="mr-2"
          >
            Atšaukti
          </Button>
          <Button
            type="button"
            onClick={handleCropComplete}
          >
            Išsaugoti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}