// @flow
import * as React from 'react';
import { Button, OverlayTrigger } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { FieldArray } from 'react-final-form-arrays';

import { upTooltip, downTooltip } from '../common/tooltips';
import { createRandomId } from '../../utils/globalFunctions';

type Props = {
  name: string,
  renderFields: Function,
  titleMsgId?: string, // eslint-disable-line react/require-default-props
  tooltips: {
    addTooltip: React.Node,
    deleteTooltip: React.Node
  },
  withSeparators: boolean
};

const FieldArrayWithActions = ({
  name,
  renderFields,
  titleMsgId,
  tooltips: { addTooltip, deleteTooltip },
  withSeparators
}: Props) => (
  <FieldArray name={name}>
    {({ fields }) => (
      <div>
        {fields.map((fieldname, idx) => (
          <div className="form-container" key={fieldname}>
            {titleMsgId && (
              <div className="title left">
                <Translate value={titleMsgId} index={idx + 1} />
              </div>
            )}

            <div className="pointer right">
              <div className="inline">
                {idx < fields.length - 1 ? (
                  <OverlayTrigger placement="top" overlay={downTooltip}>
                    <Button onClick={() => fields.swap(idx, idx + 1)} className="admin-icons">
                      <span className="assembl-icon-down-bold grey" />
                    </Button>
                  </OverlayTrigger>
                ) : null}
                {idx > 0 ? (
                  <OverlayTrigger placement="top" overlay={upTooltip}>
                    <Button onClick={() => fields.swap(idx, idx - 1)} className="admin-icons">
                      <span className="assembl-icon-up-bold grey" />
                    </Button>
                  </OverlayTrigger>
                ) : null}
                <OverlayTrigger placement="top" overlay={deleteTooltip}>
                  <Button onClick={() => fields.remove(idx)} className="admin-icons">
                    <span className="assembl-icon-delete grey" />
                  </Button>
                </OverlayTrigger>
              </div>
            </div>
            <div className="clear" />
            {renderFields({ name: fieldname, idx: idx })}
            {withSeparators && <div className="separator" />}
          </div>
        ))}

        <OverlayTrigger placement="top" overlay={addTooltip}>
          <div onClick={() => fields.push({ id: createRandomId() })} className="plus margin-l">
            +
          </div>
        </OverlayTrigger>
      </div>
    )}
  </FieldArray>
);

FieldArrayWithActions.defaultProps = {
  withSeparators: true
};

export default FieldArrayWithActions;