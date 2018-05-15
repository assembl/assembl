// @flow
import React from 'react';
import { Button, FormGroup, FormControl, OverlayTrigger } from 'react-bootstrap';

import {
  deleteTextFieldTooltip,
  upTooltip,
  downTooltip,
  textFieldToggleOptionalTooltip,
  textFieldToggleRequiredTooltip
} from '../../common/tooltips';
import SwitchButton from '../../common/switchButton';

type Props = {
  deleteField: Function,
  fieldType: string,
  id: string,
  identifier: string,
  isFirst: boolean,
  isLast: boolean,
  moveDown: Function,
  moveUp: Function,
  title: string,
  required: boolean,
  toggleRequired: Function,
  updateTitle: Function
};

const undeletableFieldTypes = ['EMAIL', 'PASSWORD'];

const TextField = ({
  deleteField,
  fieldType,
  id,
  identifier,
  isFirst,
  isLast,
  moveDown,
  moveUp,
  title,
  required,
  toggleRequired,
  updateTitle
}: Props) => (
  <FormGroup bsClass="flex profile-options-field margin-s">
    <FormControl type="text" onChange={e => updateTitle(e.target.value)} value={title} />
    {identifier === 'CUSTOM' && (
      <OverlayTrigger placement="top" overlay={required ? textFieldToggleOptionalTooltip : textFieldToggleRequiredTooltip}>
        {/* overlaytrigger does not seem to work with SwitchButton so we add a span... */}
        <span>
          <SwitchButton name={`required-switch-${id}`} checked={required} onChange={toggleRequired} />
        </span>
      </OverlayTrigger>
    )}
    <div className="flex">
      {!isLast ? (
        <OverlayTrigger placement="top" overlay={downTooltip}>
          <Button onClick={() => moveDown(id)} className={isFirst ? 'admin-icons end-items' : 'admin-icons'}>
            <span className="assembl-icon-down-small grey" />
          </Button>
        </OverlayTrigger>
      ) : null}
      {!isFirst ? (
        <OverlayTrigger placement="top" overlay={upTooltip}>
          <Button onClick={() => moveUp(id)} className={isLast ? 'admin-icons end-items' : 'admin-icons'}>
            <span className="assembl-icon-up-small grey" />
          </Button>
        </OverlayTrigger>
      ) : null}
      {identifier === 'CUSTOM' && (
        <OverlayTrigger placement="top" overlay={deleteTextFieldTooltip}>
          <Button onClick={deleteField} className="admin-icons" disabled={undeletableFieldTypes.includes(fieldType)}>
            <span className="assembl-icon-delete grey" />
          </Button>
        </OverlayTrigger>
      )}
    </div>
  </FormGroup>
);

export default TextField;