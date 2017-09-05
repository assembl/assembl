import React from 'react';

const VisibilityComponent = ({ classname, isVisible, children }) => {
  return (
    <div className={isVisible ? classname : 'hidden'}>
      {children}
    </div>
  );
};

export default VisibilityComponent;