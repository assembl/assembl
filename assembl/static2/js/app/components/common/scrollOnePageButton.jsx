import React from 'react';
import { isMobile } from '../../utils/globalFunctions';
import { withScreenHeight } from '../common/screenDimensions';

const scrollOnePageDown = screenHeight => () => {
  window.scrollTo({ top: screenHeight, left: 0, behavior: 'smooth' });
};

export const DumbScrollOnePageButton = ({ hidden, screenHeight }) => {
  const scrollOnePageTopPosition = screenHeight - 35;
  const isTouchScreen = isMobile.any();
  return (
    <a
      className={`scroll-one-page ${hidden || screenHeight > 750 || isTouchScreen ? 'hidden' : ''}`}
      onClick={scrollOnePageDown(screenHeight)}
      style={{ top: scrollOnePageTopPosition }}
    >
      <span>
        <span className="icon assembl-icon-down-open">&nbsp;</span>
      </span>
    </a>
  );
};

export default withScreenHeight(DumbScrollOnePageButton);