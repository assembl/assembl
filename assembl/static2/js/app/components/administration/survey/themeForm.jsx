import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { Button, FormGroup, OverlayTrigger } from 'react-bootstrap';

import {
  deleteThematic,
  moveThematicUp,
  moveThematicDown,
  updateThematicImgUrl,
  updateThematicTitle
} from '../../../actions/adminActions';
import FormControlWithLabel from '../../common/formControlWithLabel';
import FileUploader from '../../common/fileUploader';
import { deleteThematicTooltip, upTooltip, downTooltip } from '../../common/tooltips';
import { getEntryValueForLocale } from '../../../utils/i18n';
import { displayModal, closeModal } from '../../../utils/utilityManager';

export const DumbThemeCreationForm = ({
  imgMimeType,
  imgUrl,
  index,
  markAsToDelete,
  nbThematics,
  editLocale,
  handleUpClick,
  handleDownClick,
  title,
  _toDelete,
  updateImgUrl,
  updateTitle
}) => {
  if (_toDelete) {
    return null;
  }

  const handleTitleChange = e => updateTitle(editLocale, e.target.value);

  const handleImageChange = (file) => {
    updateImgUrl(file);
  };

  const trsl = I18n.t('administration.ph.title');
  const ph = `${trsl} ${editLocale.toUpperCase()}`;
  const headerImageFieldName = 'header-image';

  const confirmModal = () => {
    const modalTitle = <Translate value="administration.confirmDeleteThematicTitle" />;
    const body = <Translate value="administration.confirmDeleteThematic" />;
    const footer = [
      <Button key="cancel" onClick={closeModal} className="button-cancel button-dark">
        <Translate value="debate.confirmDeletionButtonCancel" />
      </Button>,
      <Button key="delete" onClick={markAsToDelete} className="button-submit button-dark">
        <Translate value="debate.confirmDeletionButtonDelete" />
      </Button>
    ];
    const includeFooter = true;
    return displayModal(modalTitle, body, includeFooter, footer);
  };
  return (
    <div className="form-container">
      <div>
        <div className="title left">
          <Translate value="administration.themeNum" index={index} />
        </div>
        <div className="pointer right">
          <div className="inline">
            {index < nbThematics ? (
              <OverlayTrigger placement="top" overlay={downTooltip}>
                <Button onClick={handleDownClick} className="admin-icons">
                  <span className="assembl-icon-down-bold grey" />
                </Button>
              </OverlayTrigger>
            ) : null}
            {index > 1 ? (
              <OverlayTrigger placement="top" overlay={upTooltip}>
                <Button onClick={handleUpClick} className="admin-icons">
                  <span className="assembl-icon-up-bold grey" />
                </Button>
              </OverlayTrigger>
            ) : null}
            <OverlayTrigger placement="top" overlay={deleteThematicTooltip}>
              <Button onClick={confirmModal} className="admin-icons">
                <span className="assembl-icon-delete grey" />
              </Button>
            </OverlayTrigger>
          </div>
        </div>
      </div>
      <div className="clear" />
      <FormControlWithLabel label={ph} onChange={handleTitleChange} required type="text" value={title} />
      <FormGroup>
        <label htmlFor={headerImageFieldName}>
          <Translate value="administration.voteSessionHeaderLabel" />
        </label>
        <FileUploader fileOrUrl={imgUrl} handleChange={handleImageChange} mimeType={imgMimeType} name={headerImageFieldName} />
      </FormGroup>
      <div className="separator" />
    </div>
  );
};

DumbThemeCreationForm.defaultProps = {
  title: ''
};

const mapStateToProps = ({ admin: { thematicsById }, i18n }, { id, editLocale }) => {
  const thematic = thematicsById.get(id);
  return {
    imgMimeType: thematic.getIn(['img', 'mimeType']),
    imgUrl: thematic.getIn(['img', 'externalUrl']),
    locale: i18n.locale, // for I18n.t()
    title: getEntryValueForLocale(thematic.get('titleEntries'), editLocale, ''),
    _toDelete: thematic.get('_toDelete', false)
  };
};

const mapDispatchToProps = (dispatch, { id }) => ({
  markAsToDelete: () => {
    dispatch(deleteThematic(id));
    closeModal();
  },
  handleUpClick: () => dispatch(moveThematicUp(id)),
  handleDownClick: () => dispatch(moveThematicDown(id)),
  updateImgUrl: (value) => {
    dispatch(updateThematicImgUrl(id, value));
  },
  updateTitle: (locale, value) => {
    dispatch(updateThematicTitle(id, locale, value));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbThemeCreationForm);