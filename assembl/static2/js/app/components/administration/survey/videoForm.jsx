import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { FormGroup, Checkbox } from 'react-bootstrap';

import {
  toggleVideo,
  updateVideoHtmlCode,
  updateVideoDescriptionTop,
  updateVideoDescriptionBottom,
  updateVideoTitle
} from '../../../actions/adminActions';
import FormControlWithLabel from '../../common/formControlWithLabel';

const VideoForm = ({
  descriptionTop,
  descriptionBottom,
  hasVideo,
  htmlCode,
  selectedLocale,
  title,
  toggle,
  updateDescriptionTop,
  updateDescriptionBottom,
  updateTitle,
  updateHtmlCode
}) => {
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
            <FormControlWithLabel
              id="video-title"
              label={titlePh}
              required
              type="text"
              value={title}
              onChange={(e) => {
                return updateTitle(e.target.value);
              }}
            />
            <FormControlWithLabel
              componentClass="textarea"
              id="video-description-top"
              type="text-area"
              label={quotePh}
              value={descriptionTop}
              onChange={(e) => {
                return updateDescriptionTop(e.target.value);
              }}
            />
            <FormControlWithLabel
              componentClass="textarea"
              id="video-description-bottom"
              type="text-area"
              label={quotePh}
              value={descriptionBottom}
              onChange={(e) => {
                return updateDescriptionBottom(e.target.value);
              }}
            />
            <FormControlWithLabel
              id="video-link"
              required
              type="text"
              label={videoLinkPh}
              value={htmlCode}
              onChange={(e) => {
                return updateHtmlCode(e.target.value);
              }}
            />
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
  let descriptionTop = '';
  let descriptionBottom = '';
  let htmlCode = '';
  let title = '';
  if (hasVideo) {
    descriptionTop = getEntryValueForLocale(video.get('descriptionEntriesTop'), selectedLocale);
    descriptionBottom = getEntryValueForLocale(video.get('descriptionEntriesBottom'), selectedLocale);
    htmlCode = video.get('htmlCode', '');
    title = getEntryValueForLocale(video.get('titleEntries'), selectedLocale);
  }
  return {
    descriptionTop: descriptionTop,
    descriptionBottom: descriptionBottom,
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
    updateDescriptionTop: (value) => {
      return dispatch(updateVideoDescriptionTop(thematicId, selectedLocale, value));
    },
    updateDescriptionBottom: (value) => {
      return dispatch(updateVideoDescriptionBottom(thematicId, selectedLocale, value));
    },
    updateTitle: (value) => {
      return dispatch(updateVideoTitle(thematicId, selectedLocale, value));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(VideoForm);