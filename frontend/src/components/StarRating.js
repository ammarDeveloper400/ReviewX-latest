import React, { useState, useRef, useEffect } from 'react';
import { Star } from 'lucide-react';

/**
 * StarRating Component with Fractional Fill Support
 * 
 * Features:
 * - Displays 5 stars with partial fill (0-100% per star)
 * - Interactive mode: allows clicking/dragging to set rating
 * - Readonly mode: displays score visually
 * - Accessible with ARIA labels
 * 
 * @param {number} value - Rating value (0.00 to 5.00)
 * @param {function} onChange - Callback when rating changes (interactive mode)
 * @param {boolean} readonly - If true, rating cannot be changed
 * @param {string} size - Size variant: 'sm', 'md', 'lg' (default: 'md')
 */
const StarRating = ({ 
  value = 0, 
  onChange, 
  readonly = false, 
  size = 'md' 
}) => {
  const [hoverValue, setHoverValue] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Normalize and clamp the value
  const normalizeValue = (val) => {
    if (val === null || val === undefined || isNaN(val)) return 0;
    return Math.min(5, Math.max(0, Number(val)));
  };

  const normalizedValue = normalizeValue(value);
  const displayValue = hoverValue !== null ? hoverValue : normalizedValue;
  const roundedDisplay = Math.round(displayValue * 100) / 100;

  // Size configurations
  const sizeConfig = {
    sm: { star: 16, gap: 'gap-0.5' },
    md: { star: 20, gap: 'gap-1' },
    lg: { star: 28, gap: 'gap-1.5' }
  };
  const config = sizeConfig[size] || sizeConfig.md;

  // Calculate fill percentage for each star
  const getStarFillPercent = (starIndex, score) => {
    const remaining = score - (starIndex - 1);
    return Math.min(100, Math.max(0, remaining * 100));
  };

  // Get rating from mouse/touch position
  const getRatingFromPosition = (clientX) => {
    if (!containerRef.current) return 0;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const starWidth = rect.width / 5;
    
    // Calculate rating with 0.1 precision
    const rawRating = x / starWidth;
    const clampedRating = Math.min(5, Math.max(0, rawRating));
    
    // Round to nearest 0.1 for smoother interaction
    return Math.round(clampedRating * 10) / 10;
  };

  const handleMouseMove = (e) => {
    if (readonly) return;
    const rating = getRatingFromPosition(e.clientX);
    setHoverValue(rating);
    
    if (isDragging && onChange) {
      onChange(rating);
    }
  };

  const handleMouseDown = (e) => {
    if (readonly) return;
    setIsDragging(true);
    const rating = getRatingFromPosition(e.clientX);
    if (onChange) {
      onChange(rating);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(null);
      setIsDragging(false);
    }
  };

  const handleClick = (e) => {
    if (readonly) return;
    const rating = getRatingFromPosition(e.clientX);
    if (onChange) {
      onChange(rating);
    }
  };

  // Touch support
  const handleTouchStart = (e) => {
    if (readonly) return;
    setIsDragging(true);
    const touch = e.touches[0];
    const rating = getRatingFromPosition(touch.clientX);
    setHoverValue(rating);
    if (onChange) {
      onChange(rating);
    }
  };

  const handleTouchMove = (e) => {
    if (readonly || !isDragging) return;
    const touch = e.touches[0];
    const rating = getRatingFromPosition(touch.clientX);
    setHoverValue(rating);
    if (onChange) {
      onChange(rating);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setHoverValue(null);
  };

  // Keyboard support
  const handleKeyDown = (e) => {
    if (readonly || !onChange) return;
    
    let newValue = normalizedValue;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = Math.min(5, Math.round((normalizedValue + 0.1) * 10) / 10);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = Math.max(0, Math.round((normalizedValue - 0.1) * 10) / 10);
        break;
      case 'Home':
        newValue = 0;
        break;
      case 'End':
        newValue = 5;
        break;
      default:
        return;
    }
    e.preventDefault();
    onChange(newValue);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={`inline-flex ${config.gap} select-none ${!readonly ? 'cursor-pointer' : ''}`}
      role="slider"
      aria-label={`Rating: ${roundedDisplay.toFixed(2)} out of 5`}
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={roundedDisplay}
      aria-valuetext={`${roundedDisplay.toFixed(2)} out of 5 stars`}
      tabIndex={readonly ? -1 : 0}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      data-testid="star-rating"
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const fillPercent = getStarFillPercent(starIndex, displayValue);
        
        return (
          <div 
            key={starIndex} 
            className={`relative ${!readonly ? 'transition-transform hover:scale-110' : ''}`}
            style={{ width: config.star, height: config.star }}
          >
            {/* Empty star (background) */}
            <Star
              size={config.star}
              className="absolute top-0 left-0 text-slate-300"
              strokeWidth={1.5}
            />
            
            {/* Filled star with clip mask */}
            <div
              className="absolute top-0 left-0 overflow-hidden"
              style={{ width: `${fillPercent}%`, height: '100%' }}
            >
              <Star
                size={config.star}
                className="fill-amber-400 text-amber-400"
                strokeWidth={1.5}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * StarRatingDisplay - Read-only display variant with numeric value
 * Shows stars and the numeric rating together
 */
export const StarRatingDisplay = ({ 
  value, 
  size = 'md',
  showNumeric = true,
  className = ''
}) => {
  const normalizedValue = value === null || value === undefined || isNaN(value) 
    ? 0 
    : Math.min(5, Math.max(0, Number(value)));
  
  const displayValue = Math.round(normalizedValue * 100) / 100;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <StarRating value={normalizedValue} readonly size={size} />
      {showNumeric && (
        <span className="text-sm font-medium text-slate-600">
          {displayValue.toFixed(2)}
        </span>
      )}
    </div>
  );
};

/**
 * StarRatingInput - Interactive input variant
 * Shows stars with optional numeric display and allows fractional input
 */
export const StarRatingInput = ({ 
  value, 
  onChange,
  size = 'md',
  showNumeric = true,
  className = ''
}) => {
  const normalizedValue = value === null || value === undefined || isNaN(value) 
    ? 0 
    : Math.min(5, Math.max(0, Number(value)));
  
  const displayValue = Math.round(normalizedValue * 100) / 100;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <StarRating value={normalizedValue} onChange={onChange} size={size} />
      {showNumeric && (
        <span className="text-lg font-bold text-slate-900 min-w-[3rem]">
          {displayValue.toFixed(2)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
