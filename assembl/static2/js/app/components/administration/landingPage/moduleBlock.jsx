// @flow
import React from 'react';
import { OverlayTrigger, Button } from 'react-bootstrap';

import { upTooltip, downTooltip } from '../../common/tooltips';

type Props = {
  moveUp: Function,
  moveDown: Function,
  required: boolean,
  title: string,
  withArrows: boolean
};

const ModuleBlock = ({ moveDown, moveUp, required, title, withArrows }: Props) => (
  <div className="module-block">
    {title}
    {required ? '*' : ''}
    {withArrows ? (
      <span>
        <OverlayTrigger placement="top" overlay={downTooltip}>
          <Button onClick={moveDown} className="admin-icons">
            <span className="assembl-icon-down-small" />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger placement="top" overlay={upTooltip}>
          <Button onClick={moveUp} className="admin-icons">
            <span className="assembl-icon-up-small" />
          </Button>
        </OverlayTrigger>
      </span>
    ) : null}
  </div>
);

ModuleBlock.defaultProps = {
  withArrows: false
};

export default ModuleBlock;