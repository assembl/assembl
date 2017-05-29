import React from 'react';
import { withApollo } from 'react-apollo';
import { Translate, I18n } from 'react-redux-i18n';
import { FormGroup, FormControl, Checkbox } from 'react-bootstrap';

const VideoForm = ({ selectedLocale }) => {

  const titlePh = `${I18n.t('administration.ph.title')} ${selectedLocale.toUpperCase()}`;
  const quotePh = `${I18n.t('administration.ph.quote')} ${selectedLocale.toUpperCase()}`;
  const videoLinkPh = `${I18n.t('administration.ph.videoLink')} ${selectedLocale.toUpperCase()}`;
  
  const handleCheckboxChange = () => {

  };
  const handleTitleChange = () => {

  };
  const handleDescriptionChange = () => {

  };
  const handleUrlChange = () => {

  };
  return (
    <div className="form-container">
      <div className="margin-xl">
        <FormGroup>
          <Checkbox onChange={handleCheckboxChange}>
            <Translate value="administration.videoModule" />
          </Checkbox>
        </FormGroup>
        <div className="video-form">
          <FormGroup>
            <FormControl
              type="text"
              placeholder={titlePh}
              onChange={handleTitleChange}
            />
          </FormGroup>
          <FormGroup>
            <FormControl
              componentClass="textarea"
              className="text-area"
              placeholder={quotePh}
              onChange={handleDescriptionChange}
            />
          </FormGroup>
          <FormGroup>
            <FormControl
              type="text"
              placeholder={videoLinkPh}
              onChange={handleUrlChange}
            />
          </FormGroup>
          <div className="separator" />
        </div>
      </div>
    </div>
  );
};

export default withApollo(VideoForm);