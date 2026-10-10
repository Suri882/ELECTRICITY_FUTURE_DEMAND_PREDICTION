import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';

const MobileDrawer = ({ isOpen, onClose }) => {
  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 left-0 flex max-w-xs w-full flex-col bg-slate-900 shadow-2xl z-50">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <span className="text-sm font-bold text-white tracking-wider">NAVIGATION</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close navigation drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
