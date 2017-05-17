import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { Button, FormGroup, FormControl } from 'react-bootstrap';

import ImageUploader from '../../common/imageUploader';

export const DumbThemeCreationForm = ({ image, index, selectedLocale, titleEntries }) => {
  const trsl = I18n.t('administration.ph.title');
  const ph = `${trsl} ${selectedLocale.toUpperCase()}`;
  const num = (Number(index) + 1).toString();
  const titleEntry = titleEntries.find((entry) => {
    return entry.localeCode === selectedLocale;
  });
  const title = titleEntry ? titleEntry.value : '';
  const remove = () => {}; // TODO
  const updateImage = () => {}; // TODO
  const updateTitle = () => {}; // TODO

  return (
    <div className="form-container">
      <div className="title">
        <Translate value="administration.themeNum" index={num} />
      </div>
      <FormGroup>
        <FormControl
          type="text"
          placeholder={ph}
          value={title}
          onChange={(e) => {
            return updateTitle(e.target.value);
          }}
        />
      </FormGroup>
      <FormGroup>
        <ImageUploader
          file={image}
          handleChange={(e) => {
            return updateImage(e.target.files);
          }}
        />
      </FormGroup>
      <div className="pointer right">
        <Button onClick={remove}>
          <span className="assembl-icon-delete grey" />
        </Button>
      </div>
      <div className="separator" />
    </div>
  );
};

DumbThemeCreationForm.defaultProps = {
  title: ''
};

export default DumbThemeCreationForm;