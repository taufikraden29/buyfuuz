import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = '', size = 20 }) => {
  // Safe lookup for icon component
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number }>>)[name];
  
  if (!IconComponent) {
    // Fallback icon if not found
    return <Icons.HelpCircle className={className} size={size} />;
  }
  
  return <IconComponent className={className} size={size} />;
};

export default DynamicIcon;
