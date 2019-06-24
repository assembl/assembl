// @flow
import * as React from 'react';
import { Button, OverlayTrigger } from 'react-bootstrap';
import classNames from 'classnames';

import { downTooltip, editModuleTooltip, removeModuleTooltip, upTooltip } from '../../common/tooltips';

type Props = {
  edit?: (() => void) | null,
  moveUp: Function,
  moveDown: Function,
  required: boolean,
  remove?: (() => void) | null,
  title: string,
  type: string,
  withArrows: boolean
};

const ModuleBlock = ({ edit, moveDown, moveUp, remove, required, title, type, withArrows }: Props) => (
  <div className={classNames(['module-block', `module-${type.toLowerCase()}`])}>
    <span>
      {title}
      {required ? '*' : ''}
    </span>
    <span>
      {withArrows && (
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
      )}
      {!!edit && (
        <OverlayTrigger placement="top" overlay={editModuleTooltip}>
          <Button onClick={edit} className="admin-icons">
            <span className="assembl-icon-edit" />
          </Button>
        </OverlayTrigger>
      )}
      {!!remove && (
        <OverlayTrigger placement="top" overlay={removeModuleTooltip}>
          <Button onClick={remove} className="admin-icons">
            <span className="assembl-icon-delete" />
          </Button>
        </OverlayTrigger>
      )}
    </span>
  </div>
);

ModuleBlock.defaultProps = {
  edit: null,
  remove: null,
  withArrows: false
};

export default ModuleBlock;