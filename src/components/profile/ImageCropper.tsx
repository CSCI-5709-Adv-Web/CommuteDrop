"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { X, Check, Loader } from "lucide-react";

interface ImageCropperProps {
  imageFile: File;
  onCrop: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({
  imageFile,
  onCrop,
  onCancel,
}: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State for cropping
  const [isDragging, setIsDragging] = useState(false);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // Load the image
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageSrc(e.target.result as string);
      }
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Initialize the image when it loads
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = "anonymous"; // Add this line to prevent CORS issues
    img.onload = () => {
      imageRef.current = img;
      setIsLoading(false);

      // Center the image initially
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        setCropPosition({
          x: (containerWidth - img.width * scale) / 2,
          y: (containerHeight - img.height * scale) / 2,
        });
      }

      drawCanvas();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw the canvas with the current crop settings
  const drawCanvas = () => {
    if (!canvasRef.current || !imageRef.current || !containerRef.current)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // Set canvas size to be square (for circular crop)
    const size = Math.min(containerWidth, containerHeight);
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw circular mask
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Draw image with current position and scale
    ctx.drawImage(
      imageRef.current,
      -cropPosition.x + (containerWidth - size) / 2,
      -cropPosition.y + (containerHeight - size) / 2,
      imageRef.current.width * scale,
      imageRef.current.height * scale
    );
  };

  // Update canvas when crop settings change
  useEffect(() => {
    drawCanvas();
  }, [cropPosition, scale]);

  // Handle mouse/touch events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    setCropPosition((prev) => ({
      x: prev.x - e.movementX,
      y: prev.y - e.movementY,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom
  const handleZoom = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(Number.parseFloat(e.target.value));
  };

  // Handle crop completion
  const handleCrop = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          onCrop(blob);
        }
      },
      "image/jpeg",
      0.95
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">Crop Profile Picture</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            <div
              ref={containerRef}
              className="relative h-64 overflow-hidden bg-gray-100 cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <canvas
                ref={canvasRef}
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
              />

              {/* Circular overlay to show crop area */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 rounded-full border-2 border-white shadow-lg"></div>
              </div>
            </div>

            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zoom
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.01"
                value={scale}
                onChange={handleZoom}
                className="w-full"
              />

              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCrop}
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90"
                >
                  <Check size={16} className="inline mr-1" />
                  Apply
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
