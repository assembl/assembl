// @flow
import * as React from 'react';
// Import components
import Title from '../title/title';
import TitleTooltip from '../titleTooltip/titleTooltip';
import { displayModal } from '../../../utils/utilityManager';
import { isMobile } from '../../../utils/globalFunctions';

export type Props = {
  /** Title content */
  children: string,
  /** Title level with default value set to 1 */
  level: number,
  /** Tooltip content */
  tooltipContent: React.Node
};

const TitleWithTooltip = ({ level, children, tooltipContent }: Props) => {
  const modalTitle = children;
  const modalBody = tooltipContent;

  const iconClickHandler = () => {
    // We only handle click action when the device is either a mobile or a tablet
    if (isMobile.any()) {
      displayModal(modalTitle, modalBody, false);
    }
  };
  return (
    <div className="titleWithTooltip-container">
      <Title level={level}>{children}</Title>
      <div className="titleTooltip-container" onClick={iconClickHandler}>
        <TitleTooltip tooltipContent={tooltipContent} />
      </div>
    </div>
  );
};

export default TitleWithTooltip;