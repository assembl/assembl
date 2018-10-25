// @flow
import * as React from 'react';
import { I18n } from 'react-redux-i18n';
import { OverlayTrigger } from 'react-bootstrap';
import { ANCHOR_SIZE } from '../../../../constants';
import { harvestingTooltip } from '../../../common/tooltips';

export type Props = {
  anchorPosition: Object,
  handleClickAnchor: Function,
  handleMouseDown: Function
};

const SideCommentAnchor = ({ handleClickAnchor, handleMouseDown, anchorPosition }: Props) => (
  <OverlayTrigger placement="top" overlay={harvestingTooltip}>
    <div
      className="side-comment-anchor"
      style={{
        top: `${anchorPosition ? anchorPosition.y - ANCHOR_SIZE : 0}px`,
        left: `${anchorPosition ? anchorPosition.x - ANCHOR_SIZE : 0}px`
      }}
    >
      <div className="button" onClick={handleClickAnchor} onMouseDown={handleMouseDown}>
        <span className="suggest">{I18n.t('debate.brightMirror.suggest')}</span>
      </div>
      <div className="arrow-down" />
    </div>
  </OverlayTrigger>
);

export default SideCommentAnchor;