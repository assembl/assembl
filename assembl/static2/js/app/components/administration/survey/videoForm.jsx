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
      htmlCode,
      title,
      description
    }
  }
}
`;

export const updateTitle = (client, id, selectedLocale, value) => {
  const thematicsData = client.readQuery({ query: GetThematics });
  thematicsData.thematics.forEach((thematic) => {
    if (thematic.id === id) {
      thematic.video.title = value;
    }
  });
  client.writeQuery({
    query: GetThematics,
    data: thematicsData
  });
};

const VideoForm = ({ client, video, id, selectedLocale }) => {
  
  const title = video.title || '';
  
  const handleCheckboxChange = () => {};
  const handleTitleChange = (e) => {
    updateTitle(client, id, selectedLocale, e.target.value);
  };
  const handleDescriptionChange = () => {};
  const handleUrlChange = () => {};
  return (
    <div className="form-container">
      <FormGroup>
        <Checkbox checked={video.htmlCode ? true : false} onChange={handleCheckboxChange}>
          <Translate value="administration.videoModule" />
        </Checkbox>
      </FormGroup>
      <div className={video.htmlCode ? 'video-form' : 'hidden'}>
        <FormGroup>
          <FormControl
            type="text"
            value={title}
            onChange={handleTitleChange}
          />
        </FormGroup>
        <FormGroup>
          <FormControl
            componentClass="textarea"
            className="text-area"
            value={video.description || ''}
            onChange={handleDescriptionChange}
          />
        </FormGroup>
        <FormGroup>
          <FormControl
            type="text"
            value={video.htmlCode || ''}
            onChange={handleUrlChange}
          />
        </FormGroup>
        <div className="separator" />
      </div>
    </div>
  )
};

export default withApollo(VideoForm);