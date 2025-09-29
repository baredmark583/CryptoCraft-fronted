
import React from 'react';
import { useIcons } from '../hooks/useIcons';

interface DynamicIconProps {
    name: string;
    fallback: React.ReactElement;
    className?: string;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ name, fallback, className }) => {
    const { getIcon, isLoading } = useIcons();

    if (isLoading) {
        // Render a placeholder while icons are loading to prevent layout shifts
        return <div className={`bg-base-300/50 rounded-full animate-pulse ${className ?? 'w-6 h-6'}`}></div>;
    }

    const svgContent = getIcon(name);

    if (svgContent) {
        // The SVG from DB might not have width/height or other classes, so we wrap it in a span
        // that receives the className prop. This allows us to control size and color from the parent component.
        return (
            <span
                className={className}
                dangerouslySetInnerHTML={{ __html: svgContent }}
            />
        );
    }
    
    // If icon not found in DB, return the hardcoded fallback
    // FIX: The spread operator (`...fallback.props`) can cause a TypeScript error if the compiler cannot
    // guarantee that `fallback.props` is an object. Using `Object.assign` is a safer way to merge props
    // that avoids this "Spread types may only be created from object types" error.
    return React.cloneElement(fallback, Object.assign({}, fallback.props, { className }));
};

export default DynamicIcon;
