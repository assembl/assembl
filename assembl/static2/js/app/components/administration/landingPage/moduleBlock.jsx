// @flow
import * as React from 'react';
import { Button, OverlayTrigger } from 'react-bootstrap';
import classNames from 'classnames';
import { Map } from 'immutable';
import { I18n } from 'react-redux-i18n';

import {
  disableModuleTooltip,
  downTooltip,
  editModuleTooltip,
  enableModuleTooltip,
  removeModuleTooltip,
  upTooltip
} from '../../common/tooltips';

type Props = {
  edit?: (() => void) | null,
  isOrdering: boolean,
  module: Map<string, any>,
  moveUp: Function,
  moveDown: Function,
  remove?: (() => void) | null,
  updateEnabled?: ((enabled: boolean) => void) | null
};

export function getModuleTitle(module: Map<string, any>) {
  const moduleTitle = module.get('title');
  const moduleTypeTitle = module.getIn(['moduleType', 'title']);
  return (
    (moduleTitle ? `${moduleTypeTitle} : ${moduleTitle}` : moduleTypeTitle) ||
    I18n.t('administration.landingPage.manageModules.textAndMultimedia')
  );
}

const ModuleBlock = ({ edit, isOrdering, module, moveDown, moveUp, remove, updateEnabled }: Props) => {
  const type = module.getIn(['moduleType', 'identifier']);
  const haveOrder = module.getIn(['moduleType', 'editableOrder']);
  const title = getModuleTitle(module);
  const enabled = module.get('enabled');
  const required = module.getIn(['moduleType', 'required']);
  return (
    <div className={classNames(['module-block', `module-${type.toLowerCase()}`, `module-${enabled ? 'enabled' : 'disabled'}`])}>
      <span>{title}</span>
      <span>
        {haveOrder && (
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
            <Button onClick={isOrdering ? () => false : edit} className="admin-icons" disabled={isOrdering}>
              <span className="assembl-icon-edit" />
            </Button>
          </OverlayTrigger>
        )}
        {!required &&
          !!updateEnabled && (
            <span>
              {enabled && (
                <OverlayTrigger placement="top" overlay={disableModuleTooltip}>
                  <Button
                    onClick={isOrdering ? () => false : () => updateEnabled(false)}
                    className="admin-icons"
                    disabled={isOrdering}
                  >
                    <span className="assembl-icon-hide" />
                  </Button>
                </OverlayTrigger>
              )}
              {!enabled && (
                <OverlayTrigger placement="top" overlay={enableModuleTooltip}>
                  <Button
                    onClick={isOrdering ? () => false : () => updateEnabled(true)}
                    className="admin-icons"
                    disabled={isOrdering}
                  >
                    <span className="assembl-icon-show" />
                  </Button>
                </OverlayTrigger>
              )}
            </span>
          )}
        {!required && (
          <span>
            <OverlayTrigger placement="top" overlay={removeModuleTooltip}>
              <Button onClick={isOrdering ? () => false : remove} className="admin-icons" disabled={isOrdering}>
                <span className="assembl-icon-delete" />
              </Button>
            </OverlayTrigger>
          </span>
        )}
      </span>
    </div>
  );
};

ModuleBlock.defaultProps = {
  edit: null,
  remove: null,
  updateEnabled: null
};

export default ModuleBlock;