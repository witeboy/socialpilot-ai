import React from 'react';
import { X } from 'lucide-react';

export default function VideoPlayerModal({ videoUrl, onClose }) {
  if (!videoUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full h-auto max-h-[80vh]"
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
}