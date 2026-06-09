import React, { useRef, useState, useEffect } from "react";
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";

interface ProImageViewerProps {
  src?: string;         // Use for single image
  images?: string[];    // Use for gallery
  initialIndex?: number;
  onClose: () => void;
}

export const ImageViewer: React.FC<ProImageViewerProps> = ({ 
  src,
  images, 
  initialIndex = 0, 
  onClose 
}) => {
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Normalize the input into an array so the logic works uniformly
  const imageList = images && images.length > 0 ? images : (src ? [src] : []);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const currentImage = imageList[currentIndex];

  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const isLoading = !loadedImages[currentImage];

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (imageList.length > 1) {
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, imageList.length]);

const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
    transformRef.current?.resetTransform();
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
    transformRef.current?.resetTransform();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDragging(false); // Reset drag state on new touch
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    // If they moved their finger more than 5px, it was a pan/drag
    if (Math.sqrt(dx * dx + dy * dy) > 5) {
      setIsDragging(true); 
    }
  };

  // --- NEW: Handle closing on the actual Click event ---
  const handleWrapperClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop the click from bleeding through
    if (isDragging) return; // If they were just dragging, do nothing
    
    const target = e.target as HTMLElement;
    if (target.tagName !== "IMG" && !target.closest("button")) {
      onClose();
    }
  };

  // IF NO IMAGES ARE PROVIDED, DON'T RENDER
  if (imageList.length === 0) return null;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={handleWrapperClick} // <-- Catch the ghost click here!
      style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
        zIndex: isFullscreen ? 9999 : 100,
        background: "rgba(15, 15, 15, 0.95)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
      }}
    >
      {/* Loading Spinner */}
      {isLoading && (
        <div style={{ position: "absolute", zIndex: 10, color: "#888" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Top Right Controls */}
      <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 20, display: "flex", gap: "12px", alignItems: "center" }}>
        {imageList.length > 1 && (
          <span style={{ color: "rgba(255,255,255,0.7)", marginRight: "10px", fontSize: "14px", fontWeight: "bold" }}>
            {currentIndex + 1} / {imageList.length}
          </span>
        )}
        <GlassButton onClick={() => toggleFullscreen()} icon={isFullscreen ? <MinimizeIcon/> : <MaximizeIcon/>} title="Fullscreen" />
        <GlassButton onClick={onClose} icon={<CloseIcon />} title="Close" />
      </div>

      {/* CONDITIONAL Gallery Arrows */}
      {imageList.length > 1 && (
        <>
          <div style={{ position: "absolute", left: "20px", zIndex: 20 }}>
            <GlassButton onClick={handlePrev} icon={<ChevronLeftIcon />} title="Previous" />
          </div>
          <div style={{ position: "absolute", right: "20px", zIndex: 20 }}>
            <GlassButton onClick={handleNext} icon={<ChevronRightIcon />} title="Next" />
          </div>
        </>
      )}

      {/* Main Transformation Layer */}
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit
        doubleClick={{ disabled: false, step: 0.7, mode: "reset" }}
        wheel={{ step: 0.1 }} 
        panning={{ velocityDisabled: false }} 
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Bottom Controls */}
            <div style={{ position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "16px", padding: "12px 24px", background: "rgba(30, 30, 30, 0.6)", borderRadius: "50px", zIndex: 20, boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)" }}>
              <GlassButton onClick={() => zoomOut()} icon={<MinusIcon />} title="Zoom Out" />
              <GlassButton onClick={() => resetTransform()} icon={<ResetIcon />} title="Reset" />
              <GlassButton onClick={() => zoomIn()} icon={<PlusIcon />} title="Zoom In" />
            </div>

            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
              <img
                key={currentImage}
                src={currentImage}
                onLoad={() => setLoadedImages(prev => ({ ...prev, [currentImage]: true }))}
                onError={() => setLoadedImages(prev => ({ ...prev, [currentImage]: true }))}
                style={{
                  width: "100%", height: "100%", objectFit: "contain",
                  opacity: isLoading ? 0 : 1, transition: "opacity 0.2s ease",
                  cursor: "grab",
                }}
                onMouseDown={(e) => (e.currentTarget.style.cursor = "grabbing")}
                onMouseUp={(e) => (e.currentTarget.style.cursor = "grab")}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

// --- Subcomponents & Icons ---
const GlassButton = ({ onClick, icon, title }: { onClick: () => void; icon: React.ReactNode, title: string }) => (
  <button onClick={onClick} title={title} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer", padding: "10px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")} onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")} onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")} onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}>{icon}</button>
);

const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const MinusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const ResetIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;
const MaximizeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>;
const MinimizeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>;
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const ChevronLeftIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>;
const ChevronRightIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>;