import React from 'react';

const scrollOnePageDown = () => {
  window.scrollTo({ top: window.innerHeight, left: 0, behavior: 'smooth' });
};

const ScrollOnePageButton = ({ hidden }) => {
  const scrollOnePageTopPosition = window.innerHeight - 35;
  return (
    <a
      className={`scroll-one-page ${hidden || window.innerHeight > 880 ? 'hidden' : ''}`}
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