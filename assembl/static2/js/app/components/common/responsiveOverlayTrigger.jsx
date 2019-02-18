// @flow
import * as React from 'react';
import { OverlayTrigger } from 'react-bootstrap';
import { isMobile } from '../../utils/globalFunctions';

type Props = {
  children: React.Node,
  placement: OverlayPlacement,
  tooltip: React.Node
};

const ResponsiveOverlayTrigger = ({ children, placement, tooltip }: Props) => {
  const isTouchScreenDevice = isMobile.any();
  return (
    <div className="custom-overlay">
      {isTouchScreenDevice ? (
        children
      ) : (
        <OverlayTrigger placement={placement} overlay={tooltip} delayShow={300}>
          <div>{children}</div>
        </OverlayTrigger>
      )}
    </div>
  );
};

export default ResponsiveOverlayTrigger;