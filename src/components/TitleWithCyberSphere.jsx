import React from 'react';
import MethodologyCyberSphere from './MethodologyCyberSphere';

/** Title row with cyber-sphere art anchored to the right */
export default function TitleWithCyberSphere({ children, size = 'md', className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0 flex-1">{children}</div>
      <MethodologyCyberSphere size={size} />
    </div>
  );
}
