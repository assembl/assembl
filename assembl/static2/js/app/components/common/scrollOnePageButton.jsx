import React from 'react';

const scrollOnePageDown = () => {
  window.scrollBy(0, window.innerHeight);
};

const ScrollOnePageButton = ({ hidden }) => {
  const scrollOnePageTopPosition = window.innerHeight - 50;
  return (
    <a className={`scroll-one-page ${hidden ? 'hidden' : ''}`} onClick={scrollOnePageDown} style={{ top: scrollOnePageTopPosition }}>
      <span>
        <span className="icon assembl-icon-down-open">&nbsp;</span>
      </span>
    </a>
  );
};

export default ScrollOnePageButton;