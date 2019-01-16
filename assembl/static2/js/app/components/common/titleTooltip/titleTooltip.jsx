// @flow
import * as React from 'react';
// Import components
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
import { getIconPath } from '../../../utils/globalFunctions';
import { titleTooltip } from '../../common/tooltips';

export type Props = {
  /** Tooltip content */
  tooltipContent: React.Node
};

const infoIcon = getIconPath('info.svg');

const TitleTooltip = ({ tooltipContent }: Props) => (
  <ResponsiveOverlayTrigger placement="bottom" tooltip={titleTooltip(tooltipContent)}>
    <img className="tooltip-icon" src={infoIcon} alt={tooltipContent} width={20} height={20} />
  </ResponsiveOverlayTrigger>
);

export default TitleTooltip;