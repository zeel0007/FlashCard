import React, { useState } from 'react';
import CodeViewer from './CodeViewer';

const Flashcard = ({ card, onStatusChange, onNext, onPrev }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null); // 'mastered' | 'review' | null
  
  // Touch coordinates for swipe gesture detection
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  const handleFlip = (e) => {
    // Prevent flipping when interacting with code, copy button, navigation, or action buttons
    if (
      e.target.closest('.code-wrapper') ||
      e.target.closest('.action-bar') ||
      e.target.closest('.code-copy-btn') ||
      e.target.closest('.nav-btn-arrows')
    ) {
      return;
    }
    setIsFlipped(!isFlipped);
  };

  // Mobile Swipe Gestures
  const handleTouchStart = (e) => {
    setTouchStartX(e.changedTouches[0].screenX);
    setTouchStartY(e.changedTouches[0].screenY);
  };

  const handleTouchMove = (e) => {
    if (!touchStartX) return;
    const currentX = e.changedTouches[0].screenX;
    const diffX = touchStartX - currentX;
    
    // Swipe feedback overlay toggles
    if (diffX > 40) {
      setSwipeDirection('review'); // swiped left
    } else if (diffX < -40) {
      setSwipeDirection('mastered'); // swiped right
    } else {
      setSwipeDirection(null);
    }
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Horizontal swipe check
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 80) {
      if (diffX > 0) {
        triggerSwipeAction('review');
      } else {
        triggerSwipeAction('mastered');
      }
    } else {
      setSwipeDirection(null);
    }
    
    setTouchStartX(0);
    setTouchStartY(0);
  };

  const triggerSwipeAction = (status) => {
    setSwipeDirection(status);
    setTimeout(() => {
      onStatusChange(status);
      setSwipeDirection(null);
      setIsFlipped(false);
    }, 300);
  };

  const handleStatusButtonClick = (status, e) => {
    e.stopPropagation();
    onStatusChange(status);
    setIsFlipped(false);
  };

  return (
    <div className="flashcard-deck">
      {/* Swipe Feedback Overlay */}
      {swipeDirection && (
        <div className={`swipe-overlay ${swipeDirection}`}>
          {swipeDirection === 'mastered' ? 'MASTERED ✓' : 'REVISE ✗'}
        </div>
      )}

      {/* 3D Card Container */}
      <div 
        className={`card-container ${isFlipped ? 'is-flipped' : ''}`}
        onClick={handleFlip}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* FRONT CARD FACE */}
        <div className="card-face card-front">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="eyebrow">{card.category}</span>
            <span className={`badge ${card.difficulty}`}>{card.difficulty}</span>
          </div>

          <h2 style={{ marginTop: '16px', fontSize: '1.4rem', color: 'var(--color-ink)' }}>
            {card.title}
          </h2>
          <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--color-slate)', lineHeight: '1.4' }}>
            {card.description}
          </p>

          <CodeViewer code={card.code} />

          <div style={{ textAlign: 'center', marginTop: '16px', padding: '10px 0 0 0', borderTop: '1.5px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-orange)', fontWeight: 600, letterSpacing: '-0.01em' }}>
              💡 Think: Time & Space Complexity? Tap to flip
            </span>
          </div>
          
          {/* Mobile Arrows Navigation */}
          <div className="nav-btn-arrows" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 16px', fontSize: '0.75rem', borderRadius: '20px' }} 
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
            >
              ← Prev
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 16px', fontSize: '0.75rem', borderRadius: '20px' }} 
              onClick={(e) => { e.stopPropagation(); onNext(); }}
            >
              Next →
            </button>
          </div>
        </div>

        {/* BACK CARD FACE */}
        <div className="card-face card-back">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="eyebrow">{card.category}</span>
            <span className={`badge ${card.difficulty}`}>{card.difficulty}</span>
          </div>

          <h2 style={{ marginTop: '16px', fontSize: '1.4rem', color: 'var(--color-ink)' }}>
            {card.title}
          </h2>

          <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            <div className="stat-card" style={{ flex: 1, padding: '16px', borderRadius: '20px', textAlign: 'center', borderColor: 'rgba(207, 69, 0, 0.2)' }}>
              <div className="stat-value" style={{ color: 'var(--color-orange)', fontSize: '1.6rem' }}>
                {card.timeComplexity || 'N/A'}
              </div>
              <div className="stat-label" style={{ fontSize: '0.75rem' }}>Time Complexity</div>
            </div>
            <div className="stat-card" style={{ flex: 1, padding: '16px', borderRadius: '20px', textAlign: 'center', borderColor: 'rgba(20, 20, 19, 0.1)' }}>
              <div className="stat-value" style={{ color: 'var(--color-ink)', fontSize: '1.6rem' }}>
                {card.spaceComplexity || 'N/A'}
              </div>
              <div className="stat-label" style={{ fontSize: '0.75rem' }}>Space Complexity</div>
            </div>
          </div>

          <div style={{ marginTop: '24px', flexGrow: 1, overflowY: 'auto', paddingRight: '4px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-ink)', marginBottom: '8px' }}>
              Explanation & Key Insights:
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-slate)', lineHeight: '1.6', whiteSpace: 'pre-line', fontWeight: 450 }}>
              {card.description}
            </p>
            {card.timeComplexity && (
              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--color-slate)', fontStyle: 'italic' }}>
                💡 <strong>Java Note:</strong> Time complexity optimized using Java Collections framework (e.g. HashMap/ArrayList bounds).
              </div>
            )}
          </div>

          {/* Quick status revision action buttons */}
          <div className="action-bar">
            <button 
              className="action-btn btn-learn"
              onClick={(e) => handleStatusButtonClick('learning', e)}
            >
              Learning
            </button>
            <button 
              className="action-btn btn-review"
              onClick={(e) => handleStatusButtonClick('review', e)}
            >
              Revise
            </button>
            <button 
              className="action-btn btn-mastered"
              onClick={(e) => handleStatusButtonClick('mastered', e)}
            >
              Mastered
            </button>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-slate)' }}>
              (Or swipe right for Mastered, swipe left to Revise)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
