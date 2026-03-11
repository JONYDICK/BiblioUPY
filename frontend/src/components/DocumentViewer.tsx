import { useState } from "react";
import { X, ZoomIn, ZoomOut, Download, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
  fileType: "pdf" | "doc" | "docx" | "image";
  onClose: () => void;
}

export function DocumentViewer({ fileUrl, fileName, fileType, onClose }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderViewer = () => {
    if (fileType === "image") {
      return (
        <div className="flex items-center justify-center h-full">
          <img
            src={fileUrl}
            alt={fileName}
            style={{ transform: `scale(${zoom / 100})` }}
            className="max-w-full max-h-full object-contain transition-transform"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      );
    }

    if (fileType === "pdf") {
      return (
        <iframe
          src={`${fileUrl}#toolbar=0&zoom=${zoom}`}
          className="w-full h-full border-0"
          title={fileName}
          onLoad={() => setIsLoading(false)}
        />
      );
    }

    // For DOC/DOCX, use Google Docs Viewer as fallback
    return (
      <iframe
        src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
        className="w-full h-full border-0"
        title={fileName}
        onLoad={() => setIsLoading(false)}
      />
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <h2 className="text-white font-medium truncate max-w-sm">{fileName}</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-gray-700"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              >
                <ZoomOut size={16} />
              </Button>
              <span className="text-white text-sm w-12 text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-gray-700"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomIn size={16} />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-gray-700"
              onClick={toggleFullscreen}
            >
              <Maximize2 size={18} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-gray-700"
              onClick={handleDownload}
            >
              <Download size={18} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-gray-700"
              onClick={onClose}
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Document viewer */}
        <div className="flex-1 overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="space-y-4 w-full max-w-2xl px-8">
                <Skeleton className="h-8 w-1/3 bg-gray-800" />
                <Skeleton className="h-96 w-full bg-gray-800" />
                <Skeleton className="h-4 w-2/3 bg-gray-800" />
                <Skeleton className="h-4 w-1/2 bg-gray-800" />
              </div>
            </div>
          )}
          {renderViewer()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default DocumentViewer;
