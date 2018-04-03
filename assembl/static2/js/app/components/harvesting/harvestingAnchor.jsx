// @flow
import React from 'react';
import { OverlayTrigger } from 'react-bootstrap';
import { ANCHOR_SIZE } from '../../constants';
import { harvestingTooltip } from '../common/tooltips';

type Props = {
  anchorPosition: Object,
  displayHarvestingBox: Function,
  handleMouseDown: Function
};

const HarvestingAnchor = ({ displayHarvestingBox, handleMouseDown, anchorPosition }: Props) => (
  <OverlayTrigger placement="top" overlay={harvestingTooltip}>
    <div
      className="harvesting-anchor"
      style={{ top: `${anchorPosition.y - ANCHOR_SIZE}px`, left: `${anchorPosition.x - ANCHOR_SIZE}px` }}
    >
      <div className="left-side-harvesting-button">
        <div className="left-side-harvesting-button__button" onClick={displayHarvestingBox} onMouseDown={handleMouseDown}>
          <div className="left-side-harvesting-button__button__inside">
            <span className="confirm-harvest-button assembl-icon-catch" />
          </div>
        </div>
      </div>
    </div>
  </OverlayTrigger>
);

export default HarvestingAnchor;