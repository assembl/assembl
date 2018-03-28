// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

type Props = {
  displayHarvestingBox: Function,
  handleMouseDown: Function
};

const HarvestingAnchor = ({ displayHarvestingBox, handleMouseDown }: Props) => (
  <div className="harvesting-anchor">
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

export default HarvestingAnchor;