// @flow
import * as React from 'react';
// Helper imports
import { I18n } from 'react-redux-i18n';
import { getIconPath, isMobile } from '../../../utils/globalFunctions';
// Import components
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
import { titleTooltip } from '../../common/tooltips';

export type Props = {
  /** Title level with default value set to 1 */
  tooltipContent: React.Node
};

const tooltipIcon = getIconPath('tooltipIcon.svg');

const TitleTooltip = ({ tooltipContent }: Props) => {
  const isTouchScreenDevice = isMobile.any();

  // Translation keys
  const alternativeTextTooltipKey = 'common.icons.tooltip';

  // Title contents
  const alternativeTextTooltip: string = I18n.t(alternativeTextTooltipKey);

  return isTouchScreenDevice ? (
    <img className="tooltip-icon" src={tooltipIcon} alt={alternativeTextTooltip} width={20} height={20} />
  ) : (
    <ResponsiveOverlayTrigger placement="bottom" tooltip={titleTooltip(tooltipContent)}>
      <img className="tooltip-icon" src={tooltipIcon} alt={alternativeTextTooltip} width={20} height={20} />
    </ResponsiveOverlayTrigger>
  );
};

export default TitleTooltip;