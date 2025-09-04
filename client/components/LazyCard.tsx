import React, { useState, useRef, useEffect } from 'react';

interface LazyCardProps {
  children: React.ReactNode;
  className?: string;
  placeholder?: React.ReactNode;
}

/**
 * LazyCard component that only renders its children when in viewport
 * Helps with performance for large lists
 */
export function LazyCard({ children, className, placeholder }: LazyCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasBeenVisible) {
          setIsVisible(true);
          setHasBeenVisible(true);
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the card is visible
        rootMargin: '50px', // Start loading 50px before the card enters viewport
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [hasBeenVisible]);

  return (
    <div ref={cardRef} className={className}>
      {isVisible || hasBeenVisible ? (
        children
      ) : (
        placeholder || (
          <div className="animate-pulse">
            <div className="bg-muted h-32 rounded-lg"></div>
          </div>
        )
      )}
    </div>
  );
}
