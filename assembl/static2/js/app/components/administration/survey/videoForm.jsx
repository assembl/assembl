import React from 'react';
import { FormGroup, FormControl, Checkbox } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

  
const VideoForm = ({  }) => {
  return (
    <div className="margin-xl">
      <FormGroup>
        <Checkbox>
          <Translate value="administration.videoModule" />
        </Checkbox>
      </FormGroup>
      <div>
        <FormGroup>
          <FormControl type="text" />
        </FormGroup>
        <FormGroup>
          <FormControl className="text-area" componentClass="textarea" />
        </FormGroup>
        <FormGroup>
          <FormControl type="text" />
        </FormGroup>
        <div className="separator" />
      </div>
    </div>
  )
};

 export default VideoForm;



