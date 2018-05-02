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
  id: string,
  isFirst: boolean,
  isLast: boolean,
  moveDown: Function,
  moveUp: Function,
  title: string,
  required: boolean,
  toggleRequired: Function,
  updateTitle: Function
};

const TextField = ({
  deleteField,
  id,
  isFirst,
  isLast,
  moveDown,
  moveUp,
  title,
  required,
  toggleRequired,
  updateTitle
}: Props) => (
  <FormGroup bsClass="flex">
    <FormControl type="text" onChange={e => updateTitle(e.target.value)} value={title} />
    <OverlayTrigger placement="top" overlay={required ? textFieldToggleOptionalTooltip : textFieldToggleRequiredTooltip}>
      {/* overlaytrigger does not seem to work with SwitchButton so we add a span... */}
      <span>
        <SwitchButton name={`required-switch-${id}`} checked={required} onChange={toggleRequired} />
      </span>
    </OverlayTrigger>
    {!isLast ? (
      <OverlayTrigger placement="top" overlay={downTooltip}>
        <Button onClick={() => moveDown(id)} className="admin-icons">
          <span className="assembl-icon-down-bold grey" />
        </Button>
      </OverlayTrigger>
    ) : null}
    {!isFirst ? (
      <OverlayTrigger placement="top" overlay={upTooltip}>
        <Button onClick={() => moveUp(id)} className="admin-icons">
          <span className="assembl-icon-up-bold grey" />
        </Button>
      </OverlayTrigger>
    ) : null}
    <OverlayTrigger placement="top" overlay={deleteTextFieldTooltip}>
      <Button onClick={deleteField} className="admin-icons">
        <span className="assembl-icon-delete grey" />
      </Button>
    </OverlayTrigger>
  </FormGroup>
);

export default TextField;