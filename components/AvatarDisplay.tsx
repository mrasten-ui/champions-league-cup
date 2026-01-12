
import React from 'react';

interface AvatarDisplayProps {
  avatar: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  ring?: boolean;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ avatar, size = 'md', className = '', ring = false }) => {
  const sizeMap = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-xl',
    xl: 'w-16 h-16 text-2xl',
    '2xl': 'w-20 h-20 text-3xl',
    '3xl': 'w-24 h-24 text-4xl',
    '4xl': 'w-32 h-32 text-5xl'
  };

  const ringClass = ring ? 'ring-2 ring-white shadow-lg' : '';

  // Safety Check: If avatar is undefined/null/empty, show a fallback placeholder immediately
  if (!avatar) {
    return (
      <div className={`rounded-full flex items-center justify-center bg-slate-100 text-slate-300 font-black border border-slate-200 ${sizeMap[size]} ${ringClass} ${className}`}>
        ?
      </div>
    );
  }

  // UPDATED: Now checks for '/' to support local files in public/avatars
  const isImage = avatar.startsWith('http') || avatar.startsWith('data:image') || avatar.startsWith('/');
  
  if (isImage) {
    return (
      <div className={`rounded-full overflow-hidden bg-white border border-slate-200 ${sizeMap[size]} ${ringClass} ${className}`}>
        <img 
            src={avatar} 
            alt="Avatar" 
            className="w-full h-full object-cover" 
            onError={(e) => {
                // Improved Error Handling: Log the failure and show fallback
                console.warn("Avatar failed to load:", avatar);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                    target.parentElement.classList.add('bg-slate-200');
                    target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400 font-bold">?</div>';
                }
            }}
        />
      </div>
    );
  }

  // Fallback for emojis or text initials
  return (
    <div className={`rounded-full flex items-center justify-center bg-blue-100 text-blue-900 font-black border border-blue-200 ${sizeMap[size]} ${ringClass} ${className}`}>
      {avatar}
    </div>
  );
};
