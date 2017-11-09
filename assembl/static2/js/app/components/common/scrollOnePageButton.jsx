import React from 'react';
import { isMobile } from '../../utils/globalFunctions';

const scrollOnePageDown = () => {
  window.scrollTo({ top: window.innerHeight, left: 0, behavior: 'smooth' });
};

const ScrollOnePageButton = ({ hidden }) => {
  const scrollOnePageTopPosition = window.innerHeight - 35;
  const isTouchScreen = isMobile.any();
  return (
    <a
      className={`scroll-one-page ${hidden || window.innerHeight > 750 || isTouchScreen ? 'hidden' : ''}`}
      onClick={scrollOnePageDown}
      style={{ top: scrollOnePageTopPosition }}
    >
      <span>
        <span className="icon assembl-icon-down-open">&nbsp;</span>
      </span>
    </a>
  );
};

export default ScrollOnePageButton;