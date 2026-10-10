import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Check } from 'lucide-react';
import Building3DModel from './Building3DModel';

/**
 * Construction3DCard Component (Compact & Premium)
 * Compact 3D building card for the Energy Intelligence platform.
 *
 * Features:
 * - Compact card height, padding, and small 3D building model
 * - Electric blue (#1677FF) and energy cyan (#00D9FF) lighting
 * - Dark navy electricity-themed design (#10243D card, #071426 background)
 * - Subtle 3D perspective tilt and model lift on hover
 * - Small "Plan This" action button
 * - Preserves all 11 construction types and routing
 */
export const Construction3DCard = ({
  constructionType,
  onSelect,
  isSelected = false,
  linkTo = null
}) => {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = (e) => {
    if (prefersReducedMotion || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle 3D tilt (max 5 degrees on X, 6 degrees on Y)
    const tiltX = -((y - centerY) / centerY) * 5;
    const tiltY = ((x - centerX) / centerX) * 6;

    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const ct = constructionType;
  const targetLink = linkTo || `/planning-studio?action=new&type=${encodeURIComponent(ct.name)}`;

  const cardTransform = !prefersReducedMotion && isHovered
    ? `perspective(1000px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) translateY(-4px) scale3d(1.02, 1.02, 1.02)`
    : !prefersReducedMotion && isSelected
    ? 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(-2px)'
    : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';

  const cardContent = (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect ? () => onSelect(ct.name) : undefined}
      style={{
        transform: cardTransform,
        transformStyle: 'preserve-3d',
        transition: isHovered
          ? 'transform 0.1s ease-out, box-shadow 0.25s ease, border-color 0.25s ease'
          : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease'
      }}
      className={`group relative flex flex-col justify-between rounded-2xl p-3 sm:p-3.5 cursor-pointer select-none overflow-hidden transition-all duration-300
        ${isSelected
          ? 'bg-[#10243D] border-2 border-[#00D9FF] shadow-[0_0_24px_rgba(0,217,255,0.4),0_8px_20px_rgba(7,20,38,0.9)]'
          : isHovered
          ? 'bg-[#10243D] border border-[#00D9FF]/90 shadow-[0_0_20px_rgba(0,217,255,0.25),0_12px_24px_rgba(7,20,38,0.85)]'
          : 'bg-[#10243D]/95 border border-[#1677FF]/30 shadow-[0_4px_14px_rgba(7,20,38,0.65)] hover:border-[#1677FF]/70'
        }`}
    >
      {/* Subtle Electric Ambient Corner Accents */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#00D9FF]/12 via-[#1677FF]/5 to-transparent rounded-bl-2xl pointer-events-none" />
      <div className="absolute -top-6 -left-6 w-20 h-20 bg-[#1677FF]/10 rounded-full blur-lg pointer-events-none" />

      {/* Top Header: Category Pill & Selection Badge */}
      <div className="flex items-center justify-between mb-1 z-10">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-[#071426] text-[#00D9FF] border border-[#1677FF]/40">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-pulse" />
          {ct.badge || ct.category || 'Facility'}
        </span>

        {isSelected ? (
          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-[#00D9FF] bg-[#00D9FF]/15 px-2 py-0.5 rounded-full border border-[#00D9FF]/50">
            <Check className="h-2.5 w-2.5 stroke-[3]" />
            Selected
          </span>
        ) : (
          <span className="text-[9px] font-medium text-slate-400 truncate max-w-[90px]">
            {ct.powerDensity ? ct.powerDensity.split(' ')[0] + ' W/sq ft' : ct.category}
          </span>
        )}
      </div>

      {/* Small 3D Building Model Visual Stage */}
      <div className="relative w-full h-24 sm:h-28 my-1 flex items-center justify-center">
        <Building3DModel type={ct.name} isHovered={isHovered || isSelected} compact={true} />
      </div>

      {/* Card Info: Construction Name & Subtitle */}
      <div className="space-y-1 mt-1 z-10">
        <h3 className="text-xs sm:text-sm font-bold text-[#F5F8FF] group-hover:text-[#00D9FF] transition-colors tracking-tight truncate">
          {ct.name}
        </h3>

        <p className="text-[10px] text-slate-300/80 leading-snug line-clamp-1">
          {ct.desc || ct.tagline || 'Calibrated electricity demand model'}
        </p>
      </div>

      {/* Bottom Footer: Compact "Plan This" Button */}
      <div className="mt-2.5 pt-2 border-t border-[#1677FF]/20 flex items-center justify-between z-10">
        <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-300 transition-colors flex items-center gap-1">
          <Zap className="h-2.5 w-2.5 text-[#FFD43B]" />
          <span className="hidden sm:inline">Demand</span> Plan
        </span>

        <div
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-300
            ${isSelected
              ? 'bg-[#00D9FF] text-[#071426] shadow-sm shadow-[#00D9FF]/30'
              : 'bg-gradient-to-r from-[#1677FF] to-[#00D9FF] text-[#071426] group-hover:from-[#00D9FF] group-hover:to-[#1677FF] group-hover:text-white shadow-sm shadow-[#1677FF]/20 group-hover:shadow-[#00D9FF]/40 group-hover:scale-105'
            }`}
        >
          <span>Plan This</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );

  if (onSelect) {
    return cardContent;
  }

  return (
    <Link to={targetLink} className="block no-underline">
      {cardContent}
    </Link>
  );
};

export default Construction3DCard;
