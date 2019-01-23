// @flow
import * as React from 'react';
// Helper imports
import { isMobile } from '../../../utils/globalFunctions';
// Import components
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
import { titleTooltip } from '../../common/tooltips';
import TooltipIcon from '../icons/tooltipIcon/tootltipIcon';

export type Props = {
  /** Title level with default value set to 1 */
  tooltipContent: React.Node
};

const TitleTooltip = ({ tooltipContent }: Props) => {
  const isTouchScreenDevice = isMobile.any();

  return isTouchScreenDevice ? (
    <TooltipIcon />
  ) : (
    <div className="tooltip-container">
      <ResponsiveOverlayTrigger placement="bottom" tooltip={titleTooltip(tooltipContent)}>
        <TooltipIcon />
      </ResponsiveOverlayTrigger>
    </div>
  );
};

export default TitleTooltip;