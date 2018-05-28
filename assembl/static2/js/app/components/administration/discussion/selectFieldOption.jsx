// @flow
import React from 'react';
import { Button, FormGroup, FormControl, OverlayTrigger } from 'react-bootstrap';

import { deleteSelectFieldOptionTooltip, upTooltip, downTooltip } from '../../common/tooltips';

type Props = {
  deleteOption: Function,
  fieldId: string,
  id: string,
  isFirst: boolean,
  isLast: boolean,
  moveDown: Function,
  moveUp: Function,
  label: ?string,
  updateLabel: Function
};

const SelectFieldOption = ({ deleteOption, fieldId, id, isFirst, isLast, moveDown, moveUp, label, updateLabel }: Props) => (
  <FormGroup bsClass="flex margin-s">
    <FormControl type="text" onChange={e => updateLabel(e.target.value)} value={label} placeholder="item" />
    <div className="flex">
      {!isLast ? (
        <OverlayTrigger placement="top" overlay={downTooltip}>
          <Button onClick={() => moveDown(fieldId, id)} className={isFirst ? 'admin-icons end-items' : 'admin-icons'}>
            <span className="assembl-icon-down-small grey" />
          </Button>
        </OverlayTrigger>
      ) : null}
      {!isFirst ? (
        <OverlayTrigger placement="top" overlay={upTooltip}>
          <Button onClick={() => moveUp(fieldId, id)} className={isLast ? 'admin-icons end-items' : 'admin-icons'}>
            <span className="assembl-icon-up-small grey" />
          </Button>
        </OverlayTrigger>
      ) : null}
      <OverlayTrigger placement="top" overlay={deleteSelectFieldOptionTooltip}>
        <Button onClick={deleteOption} className="admin-icons">
          <span className="assembl-icon-delete grey" />
        </Button>
      </OverlayTrigger>
    </div>
  </FormGroup>
);

export default SelectFieldOption;