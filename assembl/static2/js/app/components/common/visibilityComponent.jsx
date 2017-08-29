import React from 'react';

const VisibilityComponent = ({ className, isVisible }) => {
  return (
    <div className={isVisible ? className : 'hidden'}>
      {this.props.children}
    </div>
  );
};

export default VisibilityComponent;