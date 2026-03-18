import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { 
  Download, Loader2, Play, Pause, Volume2, VolumeX, 
  RotateCw, AlertCircle, ZoomIn, ZoomOut, ExternalLink,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker - use local copy for version compatibility
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

export type FileType = "pdf" | "doc" | "docx" | "image" | "video" | "pptx" | "ppt" | "xlsx" | "xls";

interface EmbeddedDocumentViewerProps {
  fileUrl: string;
  fileName: string;
  fileType: FileType;
  mimeType?: string;
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

export function EmbeddedDocumentViewer({ 
  fileUrl, 
  fileName, 
  fileType, 
  mimeType,
  onDownload 
}: EmbeddedDocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // PDF navigation state
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  
  // Image state
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  // Reset states when fileUrl changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage("");
    if (fileType === "pdf") {
      setNumPages(0);
      setCurrentPage(1);
    }
  }, [fileUrl, fileType]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      window.open(fileUrl, "_blank");
    }
  };

  const handleOpenInNewTab = () => {
    window.open(fileUrl, "_blank");
  };

  // Video controls
  const togglePlay = () => {
    const video = document.getElementById("embedded-video-player") as HTMLVideoElement;
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
    const video = document.getElementById("embedded-video-player") as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoTimeUpdate = () => {
    const video = document.getElementById("embedded-video-player") as HTMLVideoElement;
    if (video) {
      setVideoProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleVideoSeek = (value: number[]) => {
    const video = document.getElementById("embedded-video-player") as HTMLVideoElement;
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

  // Render PDF viewer using react-pdf
  const renderPDFViewer = () => {
    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-lg mb-2">No se pudo cargar el PDF</p>
          {errorMessage && <p className="text-sm text-red-500 mb-2">{errorMessage}</p>}
          <div className="flex gap-3 mt-4">
            <Button onClick={handleOpenInNewTab} variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir en nueva pestaña
            </Button>
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Descargar archivo
            </Button>
          </div>
        </div>
      );
    }

    const goToPrevPage = () => setCurrentPage(p => Math.max(p - 1, 1));
    const goToNextPage = () => setCurrentPage(p => Math.min(p + 1, numPages));

    return (
      <div className="flex flex-col rounded-lg overflow-hidden">
        {/* PDF Header/Controls */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevPage} disabled={currentPage <= 1}>
              <ChevronLeft size={18} />
            </Button>
            <span className="text-sm text-gray-600">
              {currentPage} / {numPages || "..."}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextPage} disabled={currentPage >= numPages}>
              <ChevronRight size={18} />
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(z - 25, 50))}>
              <ZoomOut size={16} />
            </Button>
            <span className="text-xs w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(z + 25, 200))}>
              <ZoomIn size={16} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download size={16} className="mr-1" />
              Descargar
            </Button>
          </div>
        </div>

        {/* PDF Content with react-pdf */}
        <div className="overflow-auto bg-gray-300 flex justify-center p-4" style={{ height: "70vh", minHeight: "500px" }}>
          {hasError ? (
            <div className="flex items-center justify-center text-gray-500">
              <AlertCircle className="w-8 h-8 mr-2" />
              <span>No se pudo cargar el documento</span>
            </div>
          ) : (
            <Document
              file={fileUrl}
              onLoadSuccess={({ numPages: pages }) => {
                console.log("[PDF Viewer] Document loaded successfully, pages:", pages);
                setNumPages(pages);
                setIsLoading(false);
              }}
              onLoadError={(error) => {
                console.error("[PDF Viewer] Document load error:", error);
                setErrorMessage(error.message || "Error al procesar PDF");
                setHasError(true);
                setIsLoading(false);
              }}
              loading={
                <div className="flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="ml-2">Cargando PDF...</span>
                </div>
              }
              error={
                <div className="text-red-500 text-center p-4">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>Error al cargar el documento</p>
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={zoom / 100}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-xl bg-white"
                loading={
                  <div className="flex items-center justify-center p-8 bg-white" style={{ width: "600px", height: "800px" }}>
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                }
              />
            </Document>
          )}
        </div>
      </div>
    );
  };

  // Render Video player
  const renderVideoViewer = () => {
    return (
      <div className="flex flex-col rounded-lg overflow-hidden border border-gray-200">
        <div className="bg-black aspect-video flex items-center justify-center">
          <video
            id="embedded-video-player"
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
        <div className="bg-gray-100 px-4 py-3 space-y-2">
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
                className="h-9 w-9"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </Button>
              
              <span className="text-sm text-gray-600 ml-2">
                {formatTime((videoProgress / 100) * videoDuration)} / {formatTime(videoDuration)}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleDownload}
              title="Descargar"
            >
              <Download size={18} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render Image viewer
  const renderImageViewer = () => {
    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
    const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

    return (
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <div className="bg-gray-100 px-4 py-2 flex justify-between items-center">
          <span className="text-sm text-gray-600 truncate max-w-md">{fileName}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRotate}>
              <RotateCw size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} disabled={zoom <= 50}>
              <ZoomOut size={16} />
            </Button>
            <span className="text-xs w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomIn size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
              <Download size={16} />
            </Button>
          </div>
        </div>
        <div className="bg-gray-200 flex items-center justify-center p-4 overflow-auto" style={{ maxHeight: "60vh" }}>
          {isLoading && (
            <div className="absolute flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          <img
            src={fileUrl}
            alt={fileName}
            style={{ 
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: "transform 0.2s ease"
            }}
            className="max-w-full object-contain shadow-lg"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    );
  };

  // Render Office documents - show download option
  const renderOfficeViewer = () => {
    return (
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <div className="bg-gray-100 px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-600">{fileName}</span>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download size={16} className="mr-2" />
            Descargar
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50">
          <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">Vista previa no disponible para este formato</p>
          <p className="text-sm text-gray-500">Descarga el archivo para verlo</p>
        </div>
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
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {renderViewer()}
      </CardContent>
    </Card>
  );
}

export default EmbeddedDocumentViewer;
