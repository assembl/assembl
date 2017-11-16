import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { Button, FormGroup, OverlayTrigger } from 'react-bootstrap';

import { deleteThematic, updateThematicImgUrl, updateThematicTitle } from '../../../actions/adminActions';
import FormControlWithLabel from '../../common/formControlWithLabel';
import FileUploader from '../../common/fileUploader';
import { deleteThematicTooltip } from '../../common/tooltips';
import { getEntryValueForLocale } from '../../../utils/i18n';

export const DumbThemeCreationForm = ({
  imgMimeType,
  imgUrl,
  index,
  markAsToDelete,
  selectedLocale,
  title,
  toDelete,
  updateImgUrl,
  updateTitle
}) => {
  if (toDelete) {
    return null;
  }

  const handleTitleChange = (e) => {
    return updateTitle(selectedLocale, e.target.value);
  };

  const handleImageChange = (file) => {
    updateImgUrl(file);
  };

  const trsl = I18n.t('administration.ph.title');
  const ph = `${trsl} ${selectedLocale.toUpperCase()}`;
  const num = (Number(index) + 1).toString();
  return (
    <div className="form-container">
      <div className="title">
        <Translate value="administration.themeNum" index={num} />
      </div>
      <FormControlWithLabel label={ph} onChange={handleTitleChange} required type="text" value={title} />
      <FormGroup>
        <FileUploader fileOrUrl={imgUrl} handleChange={handleImageChange} mimeType={imgMimeType} />
      </FormGroup>
      <div className="pointer right">
        <OverlayTrigger placement="top" overlay={deleteThematicTooltip}>
          <Button onClick={markAsToDelete}>
            <span className="assembl-icon-delete grey" />
          </Button>
        </OverlayTrigger>
      </div>
      <div className="separator" />
    </div>
  );
};

DumbThemeCreationForm.defaultProps = {
  title: ''
};

const mapStateToProps = ({ admin: { thematicsById } }, { id, selectedLocale }) => {
  const thematic = thematicsById.get(id);
  return {
    imgMimeType: thematic.getIn(['img', 'mimeType']),
    imgUrl: thematic.getIn(['img', 'externalUrl']),
    title: getEntryValueForLocale(thematic.get('titleEntries'), selectedLocale, ''),
    toDelete: thematic.get('toDelete', false)
  };
};

const mapDispatchToProps = (dispatch, { id }) => {
  return {
    markAsToDelete: () => {
      dispatch(deleteThematic(id));
    },
    updateImgUrl: (value) => {
      dispatch(updateThematicImgUrl(id, value));
    },
    updateTitle: (locale, value) => {
      dispatch(updateThematicTitle(id, locale, value));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DumbThemeCreationForm);