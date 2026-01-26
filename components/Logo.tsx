
import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'theme' | 'white';
}

/**
 * High-resolution Logo Component using local assets 1.
 * Ensure 'public/logo.png' exists (512x512 recommended).
 */
export const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", variant = 'theme' }) => {
  const src = '/logo.png';
  
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-xl ${className}`}>
      {/* Ambient glow for theme variant */}
      {variant === 'theme' && (
        <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full opacity-30"></div>
      )}
      
      <img 
        src={src} 
        alt="The Rasten Cup '26" 
        className="w-full h-full object-contain relative z-10 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition-transform duration-500 hover:scale-105"
        loading="eager"
        onError={(e) => {
            // Fallback during transition or if file missing
            console.warn("Local logo.png not found.");
            (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
};
