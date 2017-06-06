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
      titleEntries {
        localeCode,
        value
      },
      descriptionEntries {
        localeCode,
        value
      },
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
  const titleEntry = video.titleEntries ? video.titleEntries.find((entry) => {
    return entry.localeCode === selectedLocale;
  }) : {};
  const titleEntryIndex = video.titleEntries ? video.titleEntries.indexOf(titleEntry) : -1;
  const title = titleEntry ? titleEntry.value : '';
  const descriptionEntry = video.descriptionEntries ? video.descriptionEntries.find((entry) => {
    return entry.localeCode === selectedLocale;
  }) : {};
  const descriptionEntryIndex = video.descriptionEntries ? video.descriptionEntries.indexOf(descriptionEntry) : -1;
  const description = descriptionEntry ? descriptionEntry.value : '';
  const htmlCode = video.htmlCode || '';

  const addVideo = () => {
    thematicsData.thematics[thematicIndex].video = {
      titleEntries: [],
      descriptionEntries: [],
      htmlCode: '',
      __typename: 'Video'
    };
    client.writeQuery({
      query: GetThematics,
      data: thematicsData
    });
  };

  const removeVideo = () => {
    thematicsData.thematics[thematicIndex].video = {
      titleEntries: null,
      descriptionEntries: null,
      htmlCode: null,
      __typename: 'Video'
    };
    client.writeQuery({
      query: GetThematics,
      data: thematicsData
    });
  };

  const updateText = (fieldName, value, entryIndex) => {
    const newEntries = {
      localeCode: selectedLocale,
      value: value,
      __typename: 'LangStringEntry'
    };
    if (entryIndex === -1) {
      thematicsData.thematics[thematicIndex].video[fieldName].push(newEntries);
    } else {
      thematicsData.thematics[thematicIndex].video[fieldName].splice(entryIndex, 1, newEntries);
    }
    client.writeQuery({
      query: GetThematics,
      data: thematicsData
    });
  };

  const updateUrl = (value) => {
    thematicsData.thematics[thematicIndex].video.htmlCode = value;
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
    updateText('titleEntries', e.target.value, titleEntryIndex);
  };
  const handleDescriptionChange = (e) => {
    updateText('descriptionEntries', e.target.value, descriptionEntryIndex);
  };
  const handleUrlChange = (e) => {
    updateUrl(e.target.value);
  };
  return (
    <div className={findThematic ? 'form-container' : 'hidden'}>
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