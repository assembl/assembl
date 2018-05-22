import React from 'react';
import { OverlayTrigger, Row, Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';

import SectionTitle from '../sectionTitle';
import TextField from './textField';
import { createRandomId } from '../../../utils/globalFunctions';
import { getEntryValueForLocale } from '../../../utils/i18n';
import { addTextFieldTooltip, addSelectFieldTooltip } from '../../common/tooltips';
import * as actions from '../../../actions/adminActions/profileOptions';
import { displayModal, closeModal } from '../../../utils/utilityManager';

const ManageProfileOptionsForm = ({
  addSelectField,
  addTextField,
  deleteTextField,
  editLocale,
  moveTextFieldDown,
  moveTextFieldUp,
  textFields,
  toggleTextFieldRequired,
  updateTextFieldTitle
}) => {
  const confirmTextFieldDeletion = (id) => {
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
                <TextField
                  key={tf.get('id')}
                  deleteField={() => confirmTextFieldDeletion(tf.get('id'))}
                  fieldType={tf.get('fieldType')}
                  id={tf.get('id')}
                  identifier={tf.get('identifier')}
                  isFirst={idx === 0}
                  isLast={idx === textFields.size - 1}
                  moveDown={moveTextFieldDown}
                  moveUp={moveTextFieldUp}
                  required={tf.get('required')}
                  title={getEntryValueForLocale(tf.get('titleEntries'), editLocale, '')}
                  toggleRequired={() => {
                    toggleTextFieldRequired(tf.get('id'));
                  }}
                  updateTitle={value => updateTextFieldTitle(tf.get('id'), editLocale, value)}
                  isSelectField={!!tf.get('options')}
                />
              ))}
              <OverlayTrigger placement="top" overlay={addTextFieldTooltip}>
                <div onClick={addTextField} className="plus margin-l">
                  +
                </div>
              </OverlayTrigger>
              <OverlayTrigger placement="top" overlay={addSelectFieldTooltip}>
                <div onClick={addSelectField} className="plus margin-l">
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
  addSelectField: () => dispatch(actions.addTextField(createRandomId(), 'select')),
  addTextField: () => dispatch(actions.addTextField(createRandomId(), 'text')),
  deleteTextField: (id) => {
    closeModal();
    dispatch(actions.deleteTextField(id));
  },
  updateTextFieldTitle: (id, locale, value) => dispatch(actions.updateTextFieldTitle(id, locale, value)),
  toggleTextFieldRequired: id => dispatch(actions.toggleTextFieldRequired(id)),
  moveTextFieldDown: id => dispatch(actions.moveTextFieldDown(id)),
  moveTextFieldUp: id => dispatch(actions.moveTextFieldUp(id))
});

export default connect(mapStateToProps, mapDispatchToProps)(ManageProfileOptionsForm);