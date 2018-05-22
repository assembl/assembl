// @flow
import React from 'react';
import { OverlayTrigger, Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';

import { createRandomId } from '../../../utils/globalFunctions';
import { getEntryValueForLocale } from '../../../utils/i18n';
import { addSelectFieldOptionTooltip } from '../../common/tooltips';
import * as actions from '../../../actions/adminActions/profileOptions';
import { displayModal, closeModal } from '../../../utils/utilityManager';

import SelectFieldOption from './selectFieldOption';

type Props = {
  editLocale: string,
  fieldId: string,
  options: Array<any>,
  addOption: Function,
  deleteSelectFieldOption: Function,
  updateLabel: Function,
  moveOptionDown: Function,
  moveOptionUp: Function
};

const SelectFieldOptions = ({
  addOption,
  deleteSelectFieldOption,
  updateLabel,
  moveOptionDown,
  moveOptionUp,
  editLocale,
  fieldId,
  options
}: Props) => {
  const confirmOptionDeletion = (id) => {
    const modalTitle = <Translate value="administration.confirmSelectFieldOptionDeletionTitle" />;
    const body = <Translate value="administration.confirmSelectFieldOptionDeletion" />;
    const footer = [
      <Button key="cancel" onClick={closeModal} className="button-cancel button-dark">
        <Translate value="debate.confirmDeletionButtonCancel" />
      </Button>,
      <Button
        key="delete"
        onClick={() => {
          deleteSelectFieldOption(fieldId, id);
        }}
        className="button-submit button-dark"
      >
        <Translate value="debate.confirmDeletionButtonDelete" />
      </Button>
    ];
    const includeFooter = true;
    return displayModal(modalTitle, body, includeFooter, footer);
  };
  return (
    <div style={{ paddingLeft: '20px' }}>
      {options.map((option, idx) => (
        <SelectFieldOption
          key={option.get('id')}
          deleteOption={() => confirmOptionDeletion(option.get('id'))}
          id={option.get('id')}
          fieldId={fieldId}
          isFirst={idx === 0}
          // $FlowFixMe options is typed as Array, not immutable List
          isLast={idx === options.size - 1}
          moveDown={moveOptionDown}
          moveUp={moveOptionUp}
          label={getEntryValueForLocale(option.get('labelEntries'), editLocale, '')}
          updateLabel={value => updateLabel(fieldId, option.get('id'), editLocale, value)}
        />
      ))}
      <OverlayTrigger placement="top" overlay={addSelectFieldOptionTooltip}>
        <div onClick={() => addOption(fieldId)} className="plus margin-l">
          +
        </div>
      </OverlayTrigger>
    </div>
  );
};

const mapStateToProps = ({ admin: { editLocale, profileOptions: { textFieldsById } } }, ownProps) => {
  const options = textFieldsById
    .getIn([ownProps.fieldId, 'options'])
    .sortBy(field => field.get('order'))
    .toList();
  return {
    editLocale: editLocale,
    options: options
  };
};

const mapDispatchToProps = dispatch => ({
  addOption: fieldId => dispatch(actions.addSelectFieldOption(fieldId, createRandomId())),
  deleteSelectFieldOption: (fieldId, id) => {
    closeModal();
    dispatch(actions.deleteSelectFieldOption(fieldId, id));
  },
  updateLabel: (fieldId, id, locale, value) => dispatch(actions.updateSelectFieldOptionLabel(fieldId, id, locale, value)),
  moveOptionDown: (fieldId, id) => dispatch(actions.moveSelectFieldOptionDown(fieldId, id)),
  moveOptionUp: (fieldId, id) => dispatch(actions.moveSelectFieldOptionUp(fieldId, id))
});

export default connect(mapStateToProps, mapDispatchToProps)(SelectFieldOptions);