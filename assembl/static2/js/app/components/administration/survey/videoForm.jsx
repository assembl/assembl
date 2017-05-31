import React from 'react';
import { gql, withApollo } from 'react-apollo';
import { Translate, I18n } from 'react-redux-i18n';
import { FormGroup, FormControl, Checkbox } from 'react-bootstrap';

const GetThematics = gql`
{
  thematics(identifier:"survey") {
    id,
    titleEntries {
      localeCode,
      value
    },
    imgUrl,
    video {
      title,
      description,
      htmlCode
    },
    questions {
      titleEntries {
        localeCode,
        value
      }
    }
  }
}
`;

const VideoForm = ({ client, thematicId, selectedLocale }) => {
  
  const thematicsData = client.readQuery({ query: GetThematics });
  const findThematic = thematicsData.thematics.find((t) => {
    return String(t.id) === thematicId;
  });
  const thematicIndex = thematicsData.thematics.findIndex((t) => {
    return String(t.id) === thematicId;
  });

  const thematic = findThematic || [];
  const video = thematic.video || {};
  const isVideo = video.htmlCode !== null && video.htmlCode !== undefined;
  const titlePh = `${I18n.t('administration.ph.title')} ${selectedLocale.toUpperCase()}`;
  const quotePh = `${I18n.t('administration.ph.quote')} ${selectedLocale.toUpperCase()}`;
  const videoLinkPh = `${I18n.t('administration.ph.videoLink')} ${selectedLocale.toUpperCase()}`;
  const title = video.title || '';
  const description = video.description || '';
  const htmlCode = video.htmlCode || '';

  const addVideo = () => {
    thematicsData.thematics[thematicIndex].video = {
      title: "",
      description: "",
      htmlCode: "",
      __typename: "Video"
    }
    client.writeQuery({
      query: GetThematics,
      data: thematicsData
    });
  };
  
  const removeVideo = () => {
    thematicsData.thematics[thematicIndex].video = {
      title: null,
      description: null,
      htmlCode: null,
      __typename: "Video"
    }
    client.writeQuery({
      query: GetThematics,
      data: thematicsData
    });
  };
  
  const updateText = (fieldName, value) => {
    thematicsData.thematics[thematicIndex].video[fieldName] = value;
    client.writeQuery({
      query: GetThematics,
      data: thematicsData
    });
  };
  
  const handleCheckboxChange = (e) => {
    if (e.target.checked) {
      addVideo();
    } else {
      removeVideo();
    }
  };
  const handleTitleChange = (e) => {
    updateText('title', e.target.value);
  };
  const handleDescriptionChange = (e) => {
    updateText('description', e.target.value);
  };
  const handleUrlChange = (e) => {
    updateText('htmlCode', e.target.value);
  };
  return (
    <div className={findThematic ? 'form-container' : 'hidden' }>
      <div className="margin-xl">
        <FormGroup>
          <Checkbox checked={isVideo} onChange={handleCheckboxChange}>
            <Translate value="administration.videoModule" />
          </Checkbox>
        </FormGroup>
        <div className={isVideo ? 'video-form' : 'hidden'}>
          <FormGroup>
            <FormControl
              type="text"
              placeholder={titlePh}
              value={title}
              onChange={handleTitleChange}
            />
          </FormGroup>
          <FormGroup>
            <FormControl
              componentClass="textarea"
              className="text-area"
              placeholder={quotePh}
              value={description}
              onChange={handleDescriptionChange}
            />
          </FormGroup>
          <FormGroup>
            <FormControl
              type="text"
              placeholder={videoLinkPh}
              value={htmlCode}
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