// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';

type Props = {
  handleClick: Function,
  handleMouseDown: Function
};

const HarvestingAnchor = ({ handleClick, handleMouseDown }: Props) => (
  <div className="harvesting-anchor">
    <div className="left-side-harvesting-button">
      <div className="left-side-harvesting-button__label">
        <Translate value="harvesting.harvestSelection" />
      </div>
      <div className="left-side-harvesting-button__button" onClick={handleClick} onMouseDown={handleMouseDown}>
        <div className="left-side-harvesting-button__button__inside">
          <span className="confirm-harvest-button assembl-icon-catch" />
        </div>
      </div>
    </div>
  </div>
);

export default HarvestingAnchor;