// @flow
import * as React from 'react';
import classNames from 'classnames';
import { COMMENT_BADGE_OFFSET } from '../../../../constants';

export type Props = {
  toggleExtractsBox: Function,
  extractsNumber: number,
  position: ?Object,
  showBox: boolean
};

const SideCommentBadge = ({ toggleExtractsBox, extractsNumber, position, showBox }: Props) => (
  <div
    className="side-comment-badge harvesting-badge hidden-xs hidden-sm hidden-md"
    onClick={toggleExtractsBox}
    style={{
      position: `${showBox ? 'absolute' : 'fixed'}`,
      top: `${position ? position.y : 0}px`,
      left: `${position ? position.x + COMMENT_BADGE_OFFSET : 0}px`
    }}
  >
    <div className={classNames('badge-total', { wide: extractsNumber > 9 })}>{extractsNumber}</div>
    <div className="side-comment-button">
      <span className="assembl-icon-suggest" />
    </div>
  </div>
);

export default SideCommentBadge;