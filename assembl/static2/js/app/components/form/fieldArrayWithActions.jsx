// @flow
import * as React from 'react';
import { Button, OverlayTrigger } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { FieldArray, type FieldArrayRenderProps } from 'react-final-form-arrays';
import classNames from 'classnames';
import range from 'lodash/range';

import { displayModal, closeModal } from '../../utils/utilityManager';
import { upTooltip, downTooltip } from '../common/tooltips';
import { createRandomId } from '../../utils/globalFunctions';
import { MAX_TREE_FORM_LEVEL } from '../../constants';

type ConfirmationMessageType = {
  field: Object,
  index: string
};

type Props = {
  renderFields: Function,
  titleMsgId?: string, // eslint-disable-line react/require-default-props
  tooltips: {
    addTooltip: (props: { level: number }) => React.Node,
    deleteTooltip: () => React.Node,
    deleteDisabled?: () => React.Node
  },
  withSeparators: boolean,
  subFieldName?: string,
  isTree: boolean,
  level: number,
  maxLevel: number,
  minItems: number,
  parents: Array<number>,
  parentId: string,
  confirmDeletion: boolean,
  confirmDeletionMessages: {
    confirmDeletionTitle: (props: ConfirmationMessageType) => React.Node,
    confirmDeletionBody: (props: ConfirmationMessageType) => React.Node
  }
};

type FieldsProps = {
  fields: FieldArrayRenderProps,
  onAdd?: (id: string, parentId: string, index: number) => void,
  onRemove?: (id: string) => void,
  onUp?: (id: string, parentId: string, index: number, targetIndex: number) => void,
  onDown?: (id: string, parentId: string, index: number, targetIndex: number) => void
} & Props;

type FieldArrayProps = {
  name: string
} & Props;

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

export class Fields extends React.PureComponent<FieldsProps> {
  constructor(props: FieldsProps) {
    super(props);
    this.initialize();
  }

  initialize = () => {
    const { fields, minItems, level, onAdd, parentId } = this.props;
    const fieldsLength = fields.value ? fields.value.length : 0;
    if (level === 0 && fieldsLength < minItems) {
      range(0, minItems - fieldsLength).forEach(() => {
        const id = createRandomId();
        if (onAdd) {
          const index = (fields.length || 0) + 1;
          setTimeout(() => onAdd(id, parentId, index), 2000);
        }
        fields.push({ id: id });
      });
    }
  };

  down = (index: number) => {
    const { fields, onDown, parentId } = this.props;
    if (onDown) {
      onDown(fields.value[index].id, parentId, index, index + 1);
    }
    fields.swap(index, index + 1);
  };

  up = (index: number) => {
    const { fields, onUp, parentId } = this.props;
    if (onUp) {
      onUp(fields.value[index].id, parentId, index, index - 1);
    }
    fields.swap(index, index - 1);
  };

  remove = (index: number) => {
    const { fields, onRemove, isTree, subFieldName } = this.props;
    const fieldValue = fields.value[index];
    const children = subFieldName && isTree && fieldValue[subFieldName];
    if (!children || children.length === 0) {
      if (onRemove) {
        onRemove(fieldValue.id);
      }
      fields.remove(index);
    }
  };

  add = () => {
    const { fields, onAdd, parentId } = this.props;
    const id = createRandomId();
    if (onAdd) {
      onAdd(id, parentId, fields.length || 0);
    }
    fields.push({ id: id });
  };

  render() {
    const {
      fields,
      renderFields,
      titleMsgId,
      isTree,
      level,
      subFieldName,
      maxLevel,
      minItems,
      withSeparators,
      confirmDeletion,
      parents,
      tooltips: { addTooltip, deleteTooltip, deleteDisabled },
      confirmDeletionMessages: { confirmDeletionTitle, confirmDeletionBody },
      onAdd,
      onRemove,
      onUp,
      onDown
    } = this.props;
    const isRoot = level === 0;
    const className = level > 0 ? 'form-branch' : 'form-tree';
    const addBtnTop = isTree && !isRoot;
    const displayAddBtn = !isTree || (isTree && level < maxLevel);
    const addBtn = displayAddBtn ? (
      <OverlayTrigger placement="top" overlay={addTooltip({ level: level + 1 })}>
        <div onClick={this.add} className={classNames('plus margin-l', { 'form-tree-item': isTree })}>
          +
        </div>
      </OverlayTrigger>
    ) : null;
    return (
      <div className={classNames({ [className]: isTree })}>
        {addBtnTop ? addBtn : null}
        {fields.map((fieldname, idx) => {
          const fieldValue = fields.value[idx];
          const hasChildren = fieldValue.children && fieldValue.children.length;
          const enableDeleteBtn = fields.length > minItems && ((isTree && !hasChildren) || !isTree);
          const hideDeleteBtn = isRoot && !enableDeleteBtn;
          const displaySeparator = withSeparators && (!isTree || (isRoot && idx === fields.length - 1));
          const indexes = [...parents, idx + 1];
          const fieldIndex = indexes.join('.');
          const removeField = () => this.remove(idx);
          const removeConfirmationData = { field: fieldValue, index: fieldIndex };
          const removeWithConfirmation = confirmDeletion
            ? () =>
              confirmDeletionModal(
                confirmDeletionTitle(removeConfirmationData),
                confirmDeletionBody(removeConfirmationData),
                removeField
              )
            : removeField;
          return (
            <div className="form-container" key={fieldname}>
              {titleMsgId ? (
                <div className="title left">
                  <Translate value={titleMsgId} index={idx + 1} />
                </div>
              ) : null}
              <div className="pointer right">
                <div className="inline">
                  {idx < fields.length - 1 ? (
                    <OverlayTrigger placement="top" overlay={downTooltip}>
                      <Button onClick={() => this.down(idx)} className="admin-icons">
                        <span className="assembl-icon-down-bold grey" />
                      </Button>
                    </OverlayTrigger>
                  ) : null}
                  {idx > 0 ? (
                    <OverlayTrigger placement="top" overlay={upTooltip}>
                      <Button onClick={() => this.up(idx)} className="admin-icons">
                        <span className="assembl-icon-up-bold grey" />
                      </Button>
                    </OverlayTrigger>
                  ) : null}
                  {!hideDeleteBtn ? (
                    <OverlayTrigger
                      placement="top"
                      overlay={!enableDeleteBtn && deleteDisabled ? deleteDisabled() : deleteTooltip()}
                    >
                      <Button disabled={!enableDeleteBtn} onClick={removeWithConfirmation} className="admin-icons">
                        <span className="assembl-icon-delete grey" />
                      </Button>
                    </OverlayTrigger>
                  ) : null}
                </div>
              </div>
              <div className="clear" />
              <div className={classNames({ 'form-tree-item': isTree })}>
                {renderFields({ name: fieldname, idx: idx, fieldIndex: fieldIndex })}
                {isTree && subFieldName ? (
                  <FieldArrayWithActions
                    isTree
                    name={`${fieldname}.${subFieldName}`}
                    subFieldName={subFieldName}
                    renderFields={renderFields}
                    titleMsgId={titleMsgId}
                    tooltips={{
                      addTooltip: addTooltip,
                      deleteTooltip: deleteTooltip,
                      deleteDisabled: deleteDisabled
                    }}
                    withSeparators={withSeparators}
                    level={level + 1}
                    maxLevel={maxLevel}
                    parentId={fieldValue.id}
                    parents={indexes}
                    confirmDeletion={confirmDeletion}
                    confirmDeletionMessages={{
                      confirmDeletionTitle: confirmDeletionTitle,
                      confirmDeletionBody: confirmDeletionBody
                    }}
                    onAdd={onAdd}
                    onRemove={onRemove}
                    onUp={onUp}
                    onDown={onDown}
                  />
                ) : null}
              </div>
              {displaySeparator ? <div className="separator" /> : null}
            </div>
          );
        })}
        {!addBtnTop ? addBtn : null}
      </div>
    );
  }
}

const FieldArrayWithActions = (props: FieldArrayProps) => {
  const { name, ...fieldsProps } = props;
  // $FlowFixMe
  return <FieldArray name={name}>{({ fields }) => <Fields fields={fields} {...fieldsProps} />}</FieldArray>;
};

FieldArrayWithActions.defaultProps = {
  withSeparators: true,
  subFieldName: '',
  isTree: false,
  level: 0,
  minItems: -1,
  maxLevel: MAX_TREE_FORM_LEVEL,
  parents: [],
  parentId: '',
  confirmDeletion: false,
  confirmDeletionMessages: {
    confirmDeletionTitle: () => <Translate value="deleteConfirmation.confirmDeletionTitle" />,
    confirmDeletionBody: () => <Translate value="deleteConfirmation.confirmDeletionBody" />
  }
};

export default FieldArrayWithActions;