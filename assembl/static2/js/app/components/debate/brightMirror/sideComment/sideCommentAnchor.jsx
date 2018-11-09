// @flow
import * as React from 'react';

import { I18n } from 'react-redux-i18n';
import { ANCHOR_SIZE } from '../../../../constants';

export type Props = {
  anchorPosition: { x: number, y: number },
  handleClickAnchor: () => void,
  handleMouseDown: SyntheticMouseEvent => void
};

const SideCommentAnchor = ({ handleClickAnchor, handleMouseDown, anchorPosition }: Props) => (
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
);

export default SideCommentAnchor;