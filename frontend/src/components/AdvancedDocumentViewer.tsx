import { useState, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { 
  X, ZoomIn, ZoomOut, Download, Maximize2, ChevronLeft, ChevronRight,
  Loader2, Play, Pause, Volume2, VolumeX, RotateCw, FileText, AlertCircle,
  Presentation, Film, Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export type FileType = "pdf" | "doc" | "docx" | "image" | "video" | "pptx" | "ppt" | "xlsx" | "xls";

interface AdvancedDocumentViewerProps {
  fileUrl: string;
  fileName: string;
  fileType: FileType;
  mimeType?: string;
  onClose: () => void;
  onDownload?: () => void;
}

// Determine file type from mime type
export function getFileTypeFromMime(mimeType: string): FileType {
  const mimeMap: Record<string, FileType> = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "image/jpeg": "image",
    "image/jpg": "image",
    "image/png": "image",
    "image/gif": "image",
    "image/webp": "image",
    "video/mp4": "video",
    "video/webm": "video",
    "video/ogg": "video",
  };
  return mimeMap[mimeType] || "pdf";
}

export function AdvancedDocumentViewer({ 
  fileUrl, 
  fileName, 
  fileType, 
  mimeType,
  onClose,
  onDownload 
}: AdvancedDocumentViewerProps) {
  // PDF state
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfError, setPdfError] = useState<string | null>(null);
  
  // General state
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // PDF document loaded
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setPdfError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("PDF load error:", error);
    setPdfError("No se pudo cargar el PDF. Intenta descargarlo.");
    setIsLoading(false);
  }, []);

  // Navigation
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, numPages));
  const goToPage = (page: number) => setCurrentPage(Math.min(Math.max(page, 1), numPages));

  // Zoom
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Fullscreen
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  // Download
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Video controls
  const togglePlay = () => {
    const video = document.getElementById("video-player") as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const video = document.getElementById("video-player") as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoTimeUpdate = () => {
    const video = document.getElementById("video-player") as HTMLVideoElement;
    if (video) {
      setVideoProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleVideoSeek = (value: number[]) => {
    const video = document.getElementById("video-player") as HTMLVideoElement;
    if (video) {
      video.currentTime = (value[0] / 100) * video.duration;
      setVideoProgress(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (fileType === "pdf") {
        if (e.key === "ArrowLeft") goToPrevPage();
        if (e.key === "ArrowRight") goToNextPage();
      }
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fileType, numPages, onClose]);

  // Get file type icon
  const getFileTypeIcon = () => {
    switch (fileType) {
      case "pdf": return <FileText className="w-5 h-5" />;
      case "video": return <Film className="w-5 h-5" />;
      case "pptx": case "ppt": return <Presentation className="w-5 h-5" />;
      case "image": return <ImageIcon className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  // Render PDF viewer with pagination
  const renderPDFViewer = () => {
    if (pdfError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <p className="text-lg mb-2">{pdfError}</p>
          <Button onClick={handleDownload} variant="secondary" className="mt-4">
            <Download className="w-4 h-4 mr-2" />
            Descargar archivo
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* PDF Content */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-4 bg-gray-800">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            }
            className="max-w-full"
          >
            <Page
              pageNumber={currentPage}
              scale={zoom / 100}
              rotate={rotation}
              loading={
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              }
              className="shadow-2xl"
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>

        {/* PDF Navigation */}
        {numPages > 0 && (
          <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-gray-700"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft size={20} />
            </Button>
            
            <div className="flex items-center gap-2 text-white">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-14 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-center text-sm"
                min={1}
                max={numPages}
              />
              <span className="text-gray-400">de {numPages}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-gray-700"
              onClick={goToNextPage}
              disabled={currentPage >= numPages}
            >
              <ChevronRight size={20} />
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Render Video player
  const renderVideoViewer = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center bg-black p-4">
          <video
            id="video-player"
            src={fileUrl}
            className="max-w-full max-h-full"
            onTimeUpdate={handleVideoTimeUpdate}
            onLoadedMetadata={(e) => {
              setVideoDuration((e.target as HTMLVideoElement).duration);
              setIsLoading(false);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            controls={false}
          />
        </div>

        {/* Video Controls */}
        <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 space-y-2">
          {/* Progress bar */}
          <Slider
            value={[videoProgress]}
            onValueChange={handleVideoSeek}
            max={100}
            step={0.1}
            className="cursor-pointer"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-gray-700"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-gray-700"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </Button>
              
              <span className="text-white text-sm ml-2">
                {formatTime((videoProgress / 100) * videoDuration)} / {formatTime(videoDuration)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Image viewer
  const renderImageViewer = () => {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 p-4 overflow-auto">
        <img
          src={fileUrl}
          alt={fileName}
          style={{ 
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transition: "transform 0.2s ease"
          }}
          className="max-w-full object-contain"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    );
  };

  // Render Office documents (PPTX, DOCX, XLSX) using Microsoft Office Online viewer
  const renderOfficeViewer = () => {
    // Microsoft Office Online Viewer URL
    // Note: This requires the file URL to be publicly accessible
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    
    // Google Docs Viewer as fallback
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

    return (
      <div className="h-full w-full">
        <iframe
          src={googleViewerUrl}
          className="w-full h-full border-0"
          title={fileName}
          onLoad={() => setIsLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>
    );
  };

  // Main render switch
  const renderViewer = () => {
    switch (fileType) {
      case "pdf":
        return renderPDFViewer();
      case "video":
        return renderVideoViewer();
      case "image":
        return renderImageViewer();
      case "doc":
      case "docx":
      case "ppt":
      case "pptx":
      case "xls":
      case "xlsx":
        return renderOfficeViewer();
      default:
        return renderOfficeViewer();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">
              {getFileTypeIcon()}
            </div>
            <div className="max-w-md">
              <h2 className="text-white font-medium truncate">{fileName}</h2>
              <p className="text-gray-400 text-xs uppercase">{fileType}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Rotation (for PDF and images) */}
            {(fileType === "pdf" || fileType === "image") && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white hover:bg-gray-700"
                onClick={handleRotate}
                title="Rotar"
              >
                <RotateCw size={18} />
              </Button>
            )}

            {/* Zoom controls (not for video) */}
            {fileType !== "video" && (
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
                  disabled={zoom >= 300}
                >
                  <ZoomIn size={16} />
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-gray-700"
              onClick={toggleFullscreen}
              title="Pantalla completa"
            >
              <Maximize2 size={18} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-gray-700"
              onClick={handleDownload}
              title="Descargar"
            >
              <Download size={18} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-gray-700 hover:text-red-400"
              onClick={onClose}
              title="Cerrar (Esc)"
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-white">Cargando documento...</p>
            </div>
          </div>
        )}

        {/* Document viewer */}
        <div className="flex-1 overflow-hidden">
          {renderViewer()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default AdvancedDocumentViewer;
