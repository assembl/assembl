import React from 'react';
import { gql, graphql, withApollo } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import { FormGroup, FormControl, Checkbox } from 'react-bootstrap';

const GetThematics = gql`
{
  thematics(identifier:"survey") {
    id,
    titleEntries {
      localeCode,
      value
    },
    video {
      title,
      description,
      htmlCode
    }
  }
}
`;

const addVideo = (client) => {
  const thematicsData = client.readQuery({ query: GetThematics });
  thematicsData.thematics.forEach((thematic) => {
    thematic.video = {
      title: null,
      description: null,
      htmlCode: null,
      __typename: 'Video'
    };
  });
  return client.writeQuery({
    query: GetThematics,
    data: thematicsData
  });
};

const updateText = (client, field, value) => {
  const thematicsData = client.readQuery({ query: GetThematics });
  thematicsData.thematics.forEach((thematic) => {
    thematic.video[field] = value;
  });
  return client.writeQuery({
    query: GetThematics,
    data: thematicsData
  });
};

const VideoForm = ({ client }) => {

  const handleCheckboxChange = (e) => {
    addVideo(client);
  };
  const handleTitleChange = (e) => {
    updateText(client, 'title', e.target.value);
  };
  const handleDescriptionChange = (e) => {
    updateText(client, 'description', e.target.value);
  };
  const handleUrlChange = (e) => {
    updateText(client, 'htmlCode', e.target.value);
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
  )
};

export default withApollo(VideoForm);