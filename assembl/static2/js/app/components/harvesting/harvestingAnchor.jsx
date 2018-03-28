// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

type Props = {
  dbId: number,
  displayHarvestingBox: Function,
  handleMouseDown: Function
};

const HarvestingAnchor = ({ dbId, displayHarvestingBox, handleMouseDown }: Props) => {
  const postBodyHtmlId = document.getElementById(`message-body-local:Content/${dbId}`);
  const anchorPosition = postBodyHtmlId ? postBodyHtmlId.offsetTop + postBodyHtmlId.clientHeight / 2 : 50;
  return (
    <div className="harvesting-anchor" style={{ marginTop: `${anchorPosition}px` }}>
      <div className="left-side-harvesting-button">
        <div className="left-side-harvesting-button__label">
          <Translate value="harvesting.harvestSelection" />
        </div>
        <div className="left-side-harvesting-button__button" onClick={displayHarvestingBox} onMouseDown={handleMouseDown}>
          <div className="left-side-harvesting-button__button__inside">
            <span className="confirm-harvest-button assembl-icon-catch" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HarvestingAnchor;