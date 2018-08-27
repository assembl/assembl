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
    addTooltip: (props: any) => React.Node,
    deleteTooltip: (props: any) => React.Node
  },
  withSeparators: boolean,
  subFieldName?: string,
  isTree: boolean,
  level: number,
  maxLevel: number,
  minItems: number,
  parents: Array<number>
};

type FieldsProps = {
  fields: FieldArrayRenderProps
} & Props;

type FieldArrayProps = {
  name: string
} & Props;

export class Fields extends React.PureComponent<FieldsProps> {
  constructor(props: FieldsProps) {
    super(props);
    this.initialize();
  }

  initialize = () => {
    const { fields, minItems, level } = this.props;
    const fieldsLength = fields.initial ? fields.initial.length : 0;
    if (level === 0 && fieldsLength < minItems) {
      range(0, minItems - fieldsLength).forEach(() => fields.push({ id: createRandomId() }));
    }
  };

  render() {
    const {
      fields,
      subFieldName,
      renderFields,
      titleMsgId,
      tooltips: { addTooltip, deleteTooltip },
      withSeparators,
      isTree,
      level,
      maxLevel,
      minItems,
      parents
    } = this.props;
    const isRoot = level === 0;
    const className = level > 0 ? 'form-branch' : 'form-tree';
    const addBtnTop = isTree && !isRoot;
    const displayAddBtn = !isTree || (isTree && level < maxLevel);
    const addBtn = displayAddBtn ? (
      <OverlayTrigger placement="top" overlay={addTooltip({ level: level + 1 })}>
        <div
          onClick={() => fields.push({ id: createRandomId() })}
          className={classNames('plus margin-l', { 'form-tree-item': isTree })}
        >
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
          const displayDeleteBtn = fields.length > minItems && ((isTree && !hasChildren) || !isTree);
          const displaySeparator = withSeparators && (!isTree || (isRoot && idx === fields.length - 1));
          const indexes = [...parents];
          indexes.push(idx + 1);
          const fieldIndex = indexes.join('.');
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
                  {displayDeleteBtn ? (
                    <OverlayTrigger placement="top" overlay={deleteTooltip()}>
                      <Button onClick={() => fields.remove(idx)} className="admin-icons">
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
                      deleteTooltip: deleteTooltip
                    }}
                    withSeparators={withSeparators}
                    level={level + 1}
                    maxLevel={maxLevel}
                    parents={indexes}
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
  parents: []
};

export default FieldArrayWithActions;