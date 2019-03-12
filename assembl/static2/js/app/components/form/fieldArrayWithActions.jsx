// @flow
import * as React from 'react';
import { Button, OverlayTrigger } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { FieldArray, type FieldArrayRenderProps } from 'react-final-form-arrays';
import classNames from 'classnames';
import range from 'lodash/range';

import { displayModal, closeModal } from '../../utils/utilityManager';
import { upTooltip, downTooltip } from '../common/tooltips';
import { createRandomId, getDomElementOffset } from '../../utils/globalFunctions';
import { MAX_TREE_FORM_LEVEL } from '../../constants';

type ConfirmationMessageType = {
  field: Object,
  index: string
};

type Props = {
  usePanels: boolean,
  renderFields: Function,
  titleMsgId?: string,
  renderTitleMsg: ({ titleMsgId: string, idx: number, fieldValue: mixed }) => React.Node,
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

type State = {
  activePanel: number | null
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

export function confirmDeletionModal(title: React.Node, body: React.Node, remove: () => void) {
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

export class Fields extends React.PureComponent<FieldsProps, State> {
  constructor(props: FieldsProps) {
    super(props);
    this.initialize();
  }

  state = { activePanel: null };

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

  // removedIndex: ?number = null;

  remove = (index: number) => {
    const { fields, onRemove, isTree, subFieldName } = this.props;
    const fieldValue = fields.value[index];
    const children = subFieldName && isTree && fieldValue[subFieldName];
    if (!children || children.length === 0) {
      // this.removedIndex = index;
      if (onRemove) {
        onRemove(fieldValue.id);
      }
      fields.remove(index);
    }
  };

  add = () => {
    const { fields, onAdd, parentId } = this.props;
    const id = createRandomId();
    const idx = fields.length || 0;
    if (onAdd) {
      onAdd(id, parentId, idx);
    }
    fields.push({ id: id });
    this.setActivePanel(idx);
  };

  setActivePanel = (idx: number) => {
    this.setState(
      prevState => ({ activePanel: prevState.activePanel === idx ? null : idx }),
      () => {
        setTimeout(() => {
          const panel = document.getElementById(`panel${idx}`);
          const scrollY = panel ? getDomElementOffset(panel).top : 0;
          window.scrollTo({ top: scrollY - 170, left: 0, behavior: 'smooth' });
        }, 20);
      }
    );
  };

  render() {
    const {
      fields,
      renderFields,
      titleMsgId,
      renderTitleMsg,
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
      onDown,
      usePanels
    } = this.props;
    // /* Hack to fix issue with richtext field:
    // when clicking on delete action, the value of richtext field becomes '' and so
    // new EditorState.createEmpty() is created triggering onChange event on first render of the field)
    // preventing the whole block to be removed */
    // // console.log(fields.length);
    // const removedIndex = this.removedIndex;
    // if (this.removedIndex) {
    //   setTimeout(() => {
    //     this.removedIndex = null;
    //   }, 2000);
    // }
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
          // if (idx === removedIndex) {
          //   return null;
          // }
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
            <div
              className={classNames('form-container', { 'panel panel-default': usePanels })}
              id={usePanels ? `panel${idx}` : undefined}
              key={fieldname}
            >
              {titleMsgId ? (
                <div
                  className={classNames({ title: !usePanels, 'panel-heading pointer': usePanels, left: true })}
                  onClick={usePanels ? () => this.setActivePanel(idx) : undefined}
                >
                  {renderTitleMsg({ titleMsgId: titleMsgId, idx: idx, fieldValue: fieldValue })}
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
              <div
                className={classNames({
                  'form-tree-item': isTree,
                  'panel-body': usePanels,
                  hidden: usePanels && idx !== this.state.activePanel
                })}
              >
                {renderFields({ name: fieldname, idx: idx, fieldIndex: fieldIndex })}
                {isTree && subFieldName ? (
                  <FieldArrayWithActions
                    isTree
                    name={`${fieldname}.${subFieldName}`}
                    subFieldName={subFieldName}
                    renderFields={renderFields}
                    titleMsgId={titleMsgId}
                    renderTitleMsg={renderTitleMsg}
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
  usePanels: false,
  renderTitleMsg: ({ titleMsgId, idx }) => <Translate value={titleMsgId} count={idx + 1} />,
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