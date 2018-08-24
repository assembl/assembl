// @flow
import * as React from 'react';
import { Button, OverlayTrigger } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { FieldArray } from 'react-final-form-arrays';
import classNames from 'classnames';

import { displayModal, closeModal } from '../../utils/utilityManager';
import { upTooltip, downTooltip } from '../common/tooltips';
import { createRandomId } from '../../utils/globalFunctions';
import { MAX_TREE_FORM_LEVEL } from '../../constants';

type ConfirmationMessageType = {
  field: Object,
  index: string
};

type Props = {
  name: string,
  renderFields: Function,
  titleMsgId?: string, // eslint-disable-line react/require-default-props
  tooltips: {
    addTooltip: React.Node,
    deleteTooltip: React.Node
  },
  withSeparators: boolean,
  subFieldName?: string,
  isTree: boolean,
  level: number,
  maxLevel: number
};

function confirmDeletionModal(title: React.Node, body: React.Node, remove: () => void) {
  const footer = [
    <Button key="cancel" onClick={closeModal} className="button-cancel button-dark">
      <Translate value="cancel" />
    </Button>,
    <Button
      key="delete"
      onClick={() => {
        remove();
        closeModal();
      }}
      className="button-submit button-dark"
    >
      <Translate value="delete" />
    </Button>
  ];
  return displayModal(title, body, true, footer);
}

const FieldArrayWithActions = ({
  name,
  subFieldName,
  renderFields,
  titleMsgId,
  tooltips: { addTooltip, deleteTooltip },
  withSeparators,
  isTree,
  level,
  maxLevel
}: Props) => (
  <FieldArray name={name}>
    {({ fields }) => {
      const addBtn =
        !isTree ||
        (isTree &&
          level < maxLevel && (
            <OverlayTrigger placement="top" overlay={addTooltip}>
              <div
                onClick={() => fields.push({ id: createRandomId() })}
                className={classNames('plus margin-l', { 'form-tree-item': isTree })}
              >
                +
              </div>
            </OverlayTrigger>
          ));
      const isRoot = level === 0;
      const addBtnTop = isTree && !isRoot;
      const className = level > 0 ? 'form-branch' : 'form-tree';
      return (
        <div className={classNames({ [className]: isTree })}>
          {addBtnTop && addBtn}
          {fields.map((fieldname, idx) => {
            const displaySeparator = !isTree || (isRoot && idx === fields.length - 1);
            return (
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
                <div className={classNames({ 'form-tree-item': isTree })}>
                  {renderFields({ name: fieldname, idx: idx })}
                  {isTree &&
                    subFieldName && (
                      <FieldArrayWithActions
                        isTree
                        name={`${fieldname}.${subFieldName}`}
                        subFieldName={subFieldName}
                        renderFields={renderFields}
                        titleMsgId={titleMsgId}
                        tooltips={{ addTooltip: addTooltip, deleteTooltip: deleteTooltip }}
                        withSeparators={withSeparators}
                        level={level + 1}
                        maxLevel={maxLevel}
                      />
                    )}
                </div>
                {displaySeparator && withSeparators && <div className="separator" />}
              </div>
            );
          })}
          {!addBtnTop && addBtn}
        </div>
      );
    }}
  </FieldArray>
);

FieldArrayWithActions.defaultProps = {
  withSeparators: true,
  subFieldName: '',
  isTree: false,
  level: 0,
  maxLevel: MAX_TREE_FORM_LEVEL
};

export default FieldArrayWithActions;