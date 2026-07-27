import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageCarousel({ images = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(1);

  if (!images || images.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 border-dashed p-8 rounded-2xl text-center">
        <p className="text-sm text-slate-400 font-mono">Nenhuma imagem cadastrada neste guia.</p>
      </div>
    );
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
    setScale(1);
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1));

  return (
    <div className="relative border border-white/10 bg-black/80 rounded-2xl overflow-hidden select-none shadow-xl">
      {/* Slider View */}
      <div className="h-72 sm:h-80 relative flex items-center justify-center bg-black/60 backdrop-blur-md">
        <img
          src={images[currentIndex]}
          alt={`Visualização ${currentIndex + 1}`}
          className="max-h-full max-w-full object-contain p-2"
        />

        {/* Counter Badge */}
        <div className="absolute top-3 left-3 bg-slate-900/80 border border-white/10 text-[10px] font-mono px-3 py-1 text-white rounded-full backdrop-blur-md">
          FOTO {currentIndex + 1} DE {images.length}
        </div>

        {/* Zoom Trigger */}
        <button
          onClick={toggleZoom}
          className="absolute top-3 right-3 bg-slate-900/80 hover:bg-red-600 hover:text-white transition-all border border-white/10 p-2 text-slate-300 rounded-full backdrop-blur-md shadow-xs"
          title="Ampliar Imagem"
        >
          <Maximize2 size={15} />
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-red-600 hover:text-white border border-white/10 p-2 text-slate-300 rounded-full backdrop-blur-md transition-all shadow-md"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-red-600 hover:text-white border border-white/10 p-2 text-slate-300 rounded-full backdrop-blur-md transition-all shadow-md"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails list */}
      {images.length > 1 && (
        <div className="bg-slate-900/80 border-t border-white/10 p-2.5 flex gap-2.5 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-14 w-20 flex-shrink-0 bg-black border rounded-xl overflow-hidden transition-all ${
                idx === currentIndex ? 'border-red-500 scale-95 ring-2 ring-red-500/40' : 'border-white/10 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt="Miniatura" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
          >
            {/* Modal Controls Header */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <span className="text-xs font-mono text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                VISUALIZAÇÃO DETALHADA • ESQUEMA DE INSTALAÇÃO
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleZoomIn}
                  className="bg-slate-800/80 border border-white/10 p-2.5 text-white hover:text-red-400 rounded-full transition-colors"
                  title="Aumentar Zoom"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="bg-slate-800/80 border border-white/10 p-2.5 text-white hover:text-red-400 rounded-full transition-colors"
                  title="Diminuir Zoom"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={toggleZoom}
                  className="bg-red-950/60 border border-red-500/30 p-2.5 text-red-400 hover:bg-red-600 hover:text-white rounded-full transition-all"
                  title="Fechar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Zoomed Image */}
            <div className="w-full h-full flex items-center justify-center overflow-auto mt-12">
              <motion.img
                animate={{ scale }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                src={images[currentIndex]}
                alt="Esquema Ampliado"
                className="max-h-[85vh] max-w-full object-contain cursor-grab active:cursor-grabbing origin-center rounded-xl"
              />
            </div>

            {/* Zoom scale info tag */}
            <div className="absolute bottom-4 bg-slate-900 border border-white/10 text-[10px] font-mono px-3 py-1 text-white rounded-full">
              ZOOM: {Math.round(scale * 100)}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
