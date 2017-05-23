import React from 'react';
import { withApollo } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import { FormGroup, FormControl, Checkbox } from 'react-bootstrap';

const VideoForm = () => {
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
      <FormGroup>
        <Checkbox onChange={handleCheckboxChange}>
          <Translate value="administration.videoModule" />
        </Checkbox>
      </FormGroup>
      <div className="video-form">
        <FormGroup>
          <FormControl
            type="text"
            onChange={handleTitleChange}
          />
        </FormGroup>
        <FormGroup>
          <FormControl
            componentClass="textarea"
            className="text-area"
            onChange={handleDescriptionChange}
          />
        </FormGroup>
        <FormGroup>
          <FormControl
            type="text"
            onChange={handleUrlChange}
          />
        </FormGroup>
        <div className="separator" />
      </div>
    </div>
  );
};

export default withApollo(VideoForm);