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
  editLocale,
  title,
  toDelete,
  updateImgUrl,
  updateTitle
}) => {
  if (toDelete) {
    return null;
  }

  const handleTitleChange = e => updateTitle(editLocale, e.target.value);

  const handleImageChange = (file) => {
    updateImgUrl(file);
  };

  const trsl = I18n.t('administration.ph.title');
  const ph = `${trsl} ${editLocale.toUpperCase()}`;
  const num = (Number(index) + 1).toString();
  return (
    <div className="form-container">
      <div>
        <div className="title left">
          <Translate value="administration.themeNum" index={num} />
        </div>
        <div className="pointer right">
          <div className="inline">
            <OverlayTrigger placement="top" overlay={deleteThematicTooltip}>
              <Button onClick={markAsToDelete} className="admin-icons">
                <span className="assembl-icon-delete grey" />
              </Button>
            </OverlayTrigger>
          </div>
        </div>
      </div>
      <div className="clear" />
      <FormControlWithLabel label={ph} onChange={handleTitleChange} required type="text" value={title} />
      <FormGroup>
        <FileUploader fileOrUrl={imgUrl} handleChange={handleImageChange} mimeType={imgMimeType} />
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
    toDelete: thematic.get('toDelete', false)
  };
};

const mapDispatchToProps = (dispatch, { id }) => ({
  markAsToDelete: () => {
    dispatch(deleteThematic(id));
  },
  updateImgUrl: (value) => {
    dispatch(updateThematicImgUrl(id, value));
  },
  updateTitle: (locale, value) => {
    dispatch(updateThematicTitle(id, locale, value));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbThemeCreationForm);