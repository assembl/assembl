import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { FormGroup, FormControl, Checkbox } from 'react-bootstrap';

import { toggleVideo, updateVideoHtmlCode, updateVideoDescription, updateVideoTitle } from '../../../actions/adminActions';

const VideoForm = ({ description, hasVideo, htmlCode, selectedLocale, title, toggle, updateDescription, updateTitle, updateHtmlCode }) => {
  const titlePh = `${I18n.t('administration.ph.title')} ${selectedLocale.toUpperCase()}`;
  const quotePh = `${I18n.t('administration.ph.quote')} ${selectedLocale.toUpperCase()}`;
  const videoLinkPh = `${I18n.t('administration.ph.videoLink')} ${selectedLocale.toUpperCase()}`;
  return (
    <div className="form-container">
      <div className="margin-xl">
        <FormGroup>
          <Checkbox checked={hasVideo} onChange={toggle}>
            <Translate value="administration.videoModule" />
          </Checkbox>
        </FormGroup>
        {hasVideo
          ? <div className="video-form">
            <FormGroup>
              <FormControl
                type="text"
                placeholder={titlePh}
                value={title}
                onChange={(e) => {
                  return updateTitle(e.target.value);
                }}
              />
            </FormGroup>
            <FormGroup>
              <FormControl
                componentClass="textarea"
                className="text-area"
                placeholder={quotePh}
                value={description}
                onChange={(e) => {
                  return updateDescription(e.target.value);
                }}
              />
            </FormGroup>
            <FormGroup>
              <FormControl
                type="text"
                placeholder={videoLinkPh}
                value={htmlCode}
                onChange={(e) => {
                  return updateHtmlCode(e.target.value);
                }}
              />
            </FormGroup>
            <div className="separator" />
          </div>
          : null}
      </div>
    </div>
  );
};

const getEntryValueForLocale = (entries, locale) => {
  const entry = entries.find((e) => {
    return e.get('localeCode') === locale;
  });

  return entry ? entry.get('value') : '';
};

export const mapStateToProps = ({ admin: { thematicsById } }, { thematicId, selectedLocale }) => {
  const video = thematicsById.getIn([thematicId, 'video']);
  const hasVideo = video !== null;
  let description = '';
  let htmlCode = '';
  let title = '';
  if (hasVideo) {
    description = getEntryValueForLocale(video.get('descriptionEntries'), selectedLocale);
    htmlCode = video.get('htmlCode', '');
    title = getEntryValueForLocale(video.get('titleEntries'), selectedLocale);
  }
  return {
    description: description,
    hasVideo: hasVideo,
    htmlCode: htmlCode,
    title: title
  };
};

export const mapDispatchToProps = (dispatch, { selectedLocale, thematicId }) => {
  return {
    toggle: () => {
      return dispatch(toggleVideo(thematicId));
    },
    updateHtmlCode: (value) => {
      return dispatch(updateVideoHtmlCode(thematicId, value));
    },
    updateDescription: (value) => {
      return dispatch(updateVideoDescription(thematicId, selectedLocale, value));
    },
    updateTitle: (value) => {
      return dispatch(updateVideoTitle(thematicId, selectedLocale, value));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(VideoForm);