// @flow
import React from 'react';
import { Map, List } from 'immutable';
import { OverlayTrigger, Row, Button, Checkbox } from 'react-bootstrap';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';

import SectionTitle from '../sectionTitle';
import TextField from './textField';
import { createRandomId } from '../../../utils/globalFunctions';
import { getEntryValueForLocale, type LangstringEntriesList } from '../../../utils/i18n';
import { addTextFieldTooltip, hideTextFieldTooltip } from '../../common/tooltips';
import * as actions from '../../../actions/adminActions/profileOptions';
import { displayModal, closeModal } from '../../../utils/utilityManager';

type TextFieldProps = {
  id: string,
  identifier: string,
  _toDelete: boolean,
  order: number,
  fieldType: string,
  titleEntries: LangstringEntriesList
};

type Props = {
  editLocale: string,
  textFields: List<Map<TextFieldProps>>,
  addSelectField: () => void,
  addTextField: () => void,
  deleteTextField: string => void,
  moveTextFieldDown: () => void,
  moveTextFieldUp: () => void,
  toggleTextFieldRequired: string => void,
  toggleTextFieldHidden: string => void,
  updateTextFieldTitle: (string, string, string) => void
};

const ManageProfileOptionsForm = ({
  addSelectField,
  addTextField,
  deleteTextField,
  editLocale,
  moveTextFieldDown,
  moveTextFieldUp,
  textFields,
  toggleTextFieldRequired,
  toggleTextFieldHidden,
  updateTextFieldTitle
}: Props) => {
  const confirmTextFieldDeletion = (id: string) => {
    const modalTitle = <Translate value="administration.confirmTextFieldDeletionTitle" />;
    const body = <Translate value="administration.confirmTextFieldDeletion" />;
    const footer = [
      <Button key="cancel" onClick={closeModal} className="button-cancel button-dark">
        <Translate value="debate.confirmDeletionButtonCancel" />
      </Button>,
      <Button
        key="delete"
        onClick={() => {
          deleteTextField(id);
        }}
        className="button-submit button-dark"
      >
        <Translate value="debate.confirmDeletionButtonDelete" />
      </Button>
    ];
    const includeFooter = true;
    return displayModal(modalTitle, body, includeFooter, footer);
  };

  const showAddFieldModal = () => {
    // const modalTitle = <Translate value="administration.profileOptions.addTextField" />;
    const modalTitle = '';
    // const body = <Translate value="administration.confirmTextFieldDeletion" />;
    const body = (
      <div>
        <Translate value="administration.profileOptions.createNewFieldModalBody" />
      </div>
    );
    const footer = [
      <Button
        key="textField"
        className="button-cancel button-generic"
        onClick={() => {
          closeModal();
          addTextField();
        }}
      >
        <Translate value="administration.profileOptions.choiceTextField" />
      </Button>,
      <Button
        key="selectField"
        className="button-cancel button-generic"
        onClick={() => {
          closeModal();
          addSelectField();
        }}
      >
        <Translate value="administration.profileOptions.choiceSelectField" />
      </Button>
    ];
    const includeFooter = true;
    return displayModal(modalTitle, body, includeFooter, footer);
  };

  const isNotHideable = (textField) => {
    switch (textField.get('identifier')) {
    case 'FULLNAME':
    case 'EMAIL':
    case 'PASSWORD':
    case 'PASSWORD2':
      return true;
    default:
      return false;
    }
  };

  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.discussion.3')} annotation={I18n.t('administration.annotation')} />
      <div className="intro-text">
        <Translate value="administration.profileOptions.introText" />
      </div>
      <div className="admin-content">
        <Row>
          <div className="form-container profile-options">
            <form>
              {textFields.map((tf, idx) => (
                <div className="flex" key={tf.get('id')}>
                  <OverlayTrigger placement="top" overlay={hideTextFieldTooltip}>
                    <Checkbox
                      className="textfield-checkbox"
                      checked={tf.get('hidden')}
                      disabled={isNotHideable(tf)}
                      onChange={() => toggleTextFieldHidden(tf.get('id'))}
                    />
                  </OverlayTrigger>
                  <TextField
                    deleteField={() => confirmTextFieldDeletion(tf.get('id'))}
                    fieldType={tf.get('fieldType')}
                    id={tf.get('id')}
                    identifier={tf.get('identifier')}
                    isFirst={idx === 0}
                    isLast={idx === textFields.size - 1}
                    moveDown={moveTextFieldDown}
                    moveUp={moveTextFieldUp}
                    required={tf.get('required')}
                    title={getEntryValueForLocale(tf.get('titleEntries'), editLocale, '') || ''}
                    toggleRequired={() => {
                      toggleTextFieldRequired(tf.get('id'));
                    }}
                    updateTitle={value => updateTextFieldTitle(tf.get('id'), editLocale, value)}
                    isSelectField={!!tf.get('options')}
                  />
                </div>
              ))}
              <OverlayTrigger placement="top" overlay={addTextFieldTooltip}>
                <div onClick={showAddFieldModal} className="plus margin-l">
                  +
                </div>
              </OverlayTrigger>
            </form>
          </div>
        </Row>
      </div>
    </div>
  );
};

const mapStateToProps = ({ admin: { editLocale, profileOptions: { textFieldsById } } }) => ({
  editLocale: editLocale,
  textFields: textFieldsById
    .filter(tf => !tf.get('_toDelete'))
    .sortBy(tf => tf.get('order'))
    .toList()
});

const mapDispatchToProps = dispatch => ({
  addSelectField: () => {
    const fieldId = createRandomId();
    dispatch(actions.addTextField(fieldId, 'select'));
    dispatch(actions.addSelectFieldOption(fieldId, createRandomId()));
    dispatch(actions.addSelectFieldOption(fieldId, createRandomId()));
    dispatch(actions.addSelectFieldOption(fieldId, createRandomId()));
  },
  addTextField: () => dispatch(actions.addTextField(createRandomId(), 'text')),
  deleteTextField: (id) => {
    closeModal();
    dispatch(actions.deleteTextField(id));
  },
  updateTextFieldTitle: (id, locale, value) => dispatch(actions.updateTextFieldTitle(id, locale, value)),
  toggleTextFieldRequired: id => dispatch(actions.toggleTextFieldRequired(id)),
  toggleTextFieldHidden: id => dispatch(actions.toggleTextFieldHidden(id)),
  moveTextFieldDown: id => dispatch(actions.moveTextFieldDown(id)),
  moveTextFieldUp: id => dispatch(actions.moveTextFieldUp(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(ManageProfileOptionsForm);