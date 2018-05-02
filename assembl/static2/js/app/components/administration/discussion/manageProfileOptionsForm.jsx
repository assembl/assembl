import React from 'react';
import { OverlayTrigger, Row } from 'react-bootstrap';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';

import SectionTitle from '../sectionTitle';
import TextField from './textField';
import { createRandomId } from '../../../utils/globalFunctions';
import { getEntryValueForLocale } from '../../../utils/i18n';
import { addTextFieldTooltip } from '../../common/tooltips';
import * as actions from '../../../actions/adminActions/profileOptions';

const ManageProfileOptionsForm = ({ addTextField, deleteTextField, editLocale, textFields, updateTextFieldTitle }) => (
  <div className="admin-box">
    <SectionTitle title={I18n.t('administration.discussion.3')} annotation={I18n.t('administration.annotation')} />
    <div className="intro-text">
      <Translate value="administration.profileOptions.introText" />
    </div>
    <div className="admin-content">
      <Row>
        <div className="form-container">
          <form>
            {textFields.map((tf, idx) => (
              <TextField
                key={tf.get('id')}
                deleteField={() => deleteTextField(tf.get('id'))}
                id={tf.get('id')}
                isFirst={idx === 0}
                isLast={idx === textFields.size - 1}
                required={tf.get('required')}
                title={getEntryValueForLocale(tf.get('titleEntries'), editLocale, '')}
                updateTitle={value => updateTextFieldTitle(tf.get('id'), editLocale, value)}
              />
            ))}
            <OverlayTrigger placement="top" overlay={addTextFieldTooltip}>
              <div onClick={addTextField} className="plus margin-l">
                +
              </div>
            </OverlayTrigger>
          </form>
        </div>
      </Row>
    </div>
  </div>
);

const mapStateToProps = ({ admin: { editLocale, profileOptions: { textFieldsById } } }) => ({
  editLocale: editLocale,
  textFields: textFieldsById
    .filter(tf => !tf.get('_toDelete'))
    .sortBy(tf => tf.get('order'))
    .toList()
});

const mapDispatchToProps = dispatch => ({
  addTextField: () => dispatch(actions.addTextField(createRandomId())),
  deleteTextField: id => dispatch(actions.deleteTextField(id)),
  updateTextFieldTitle: (id, locale, value) => dispatch(actions.updateTextFieldTitle(id, locale, value))
});

export default connect(mapStateToProps, mapDispatchToProps)(ManageProfileOptionsForm);