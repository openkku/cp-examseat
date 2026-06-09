import React, { useState, useEffect } from 'react';

interface ScrollToTopButtonProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ scrollContainerRef }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // The button listens to the parent's scroll event directly
    const handleScroll = () => {
      if (container.scrollTop > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    
    // Cleanup the listener when the component unmounts
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!showScrollTop) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition-all hover:scale-110 hover:shadow-2xl flex items-center justify-center group border-2 border-white"
      title="กลับไปข้างบน"
    >
      <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
      </svg>
    </button>
  );
};