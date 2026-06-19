
import { TouchEvent, useState } from 'react';

interface SwipeInput {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  range?: number;
  stopPropagation?: boolean;
}

export const useSwipe = ({ onSwipeLeft, onSwipeRight, range = 75, stopPropagation = false }: SwipeInput) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = (e: TouchEvent) => {
    if (stopPropagation) e.stopPropagation();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (stopPropagation) e.stopPropagation();
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (stopPropagation) e.stopPropagation();
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > range;
    const isRightSwipe = distance < -range;

    if (isLeftSwipe) {
      onSwipeLeft();
    } else if (isRightSwipe) {
      onSwipeRight();
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};
