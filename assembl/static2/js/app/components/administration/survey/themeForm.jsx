import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { Button, FormGroup, Tooltip, OverlayTrigger } from 'react-bootstrap';

import { deleteThematic, updateThematicImgUrl, updateThematicTitle } from '../../../actions/adminActions';
import FormControlWithLabel from '../../common/formControlWithLabel';
import ImageUploader from '../../common/imageUploader';

const deleteTooltip = (
  <Tooltip id="plusTooltip">
    <Translate value="administration.deleteThematic" />
  </Tooltip>
);

export const DumbThemeCreationForm = ({ imgUrl, index, markAsToDelete, selectedLocale, title, toDelete, updateImgUrl, updateTitle }) => {
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
        <ImageUploader imgUrl={imgUrl} handleImageChange={handleImageChange} />
      </FormGroup>
      <div className="pointer right">
        <OverlayTrigger placement="top" overlay={deleteTooltip}>
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
  const titleEntry = thematic.get('titleEntries').find((entry) => {
    return entry.get('localeCode') === selectedLocale;
  });
  return {
    imgUrl: thematic.get('imgUrl', ''),
    title: titleEntry ? titleEntry.get('value', '') : '',
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