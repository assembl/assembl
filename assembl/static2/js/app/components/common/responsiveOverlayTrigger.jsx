import React from 'react';
import { OverlayTrigger } from 'react-bootstrap';
import { isMobile } from '../../utils/globalFunctions';

const ResponsiveOverlayTrigger = ({ component, placement, tooltip }) => {
  const isTouchScreenDevice = isMobile.any();
  return (
    <div>
      {isTouchScreenDevice
        ? component
        : <OverlayTrigger placement={placement} overlay={tooltip}>
          {component}
        </OverlayTrigger>}
    </div>
  );
};

export default ResponsiveOverlayTrigger;