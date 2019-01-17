// @flow
import * as React from 'react';
// Import components
import Title from '../title/title';
import TitleTooltip from '../titleTooltip/titleTooltip';
import { displayModal } from '../../../utils/utilityManager';
import { isMobile } from '../../../utils/globalFunctions';

export type Props = {
  /** Optional level */
  level: number,
  /** Title content */
  titleContent: string,
  /** Tooltip content */
  tooltipContent: React.Node
};

const TitleWithTooltip = ({ level, titleContent, tooltipContent }: Props) => {
  const modalTitle = titleContent.toUpperCase();
  const modalBody = tooltipContent;

  const iconClickHandler = () => {
    // We only handle click action when the device is either a mobile or a tablet
    if (isMobile.any()) {
      displayModal(modalTitle, modalBody, false);
    }
  };
  return (
    <div className="titleWithTooltip-container">
      <Title level={level} titleContent={titleContent} />
      <div className="titleTooltip-container" onClick={iconClickHandler}>
        <TitleTooltip tooltipContent={tooltipContent} />
      </div>
    </div>
  );
};

export default TitleWithTooltip;