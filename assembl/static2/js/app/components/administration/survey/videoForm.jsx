import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { FormGroup, Checkbox } from 'react-bootstrap';

import {
  toggleVideo,
  updateVideoHtmlCode,
  updateVideoDescriptionTop,
  updateVideoDescriptionBottom,
  updateVideoDescriptionSide,
  updateVideoTitle
} from '../../../actions/adminActions';
import FormControlWithLabel from '../../common/formControlWithLabel';

const VideoForm = ({
  descriptionTop,
  descriptionBottom,
  descriptionSide,
  hasVideo,
  htmlCode,
  selectedLocale,
  title,
  toggle,
  updateDescriptionTop,
  updateDescriptionBottom,
  updateDescriptionSide,
  updateTitle,
  updateHtmlCode
}) => {
  const titlePh = `${I18n.t('administration.ph.title')} ${selectedLocale.toUpperCase()}`;
  const quotePh = `${I18n.t('administration.ph.quote')} ${selectedLocale.toUpperCase()}`;
  const descriptionTopPh = `${I18n.t('administration.ph.descriptionTop')} ${selectedLocale.toUpperCase()}`;
  const descriptionBottomPh = `${I18n.t('administration.ph.descriptionBottom')} ${selectedLocale.toUpperCase()}`;
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
              type="rich-text"
              label={descriptionTopPh}
              value={descriptionTop}
              labelAlwaysVisible
              onChange={updateDescriptionTop}
            />
            <FormControlWithLabel
              componentClass="textarea"
              id="video-description-bottom"
              type="rich-text"
              label={descriptionBottomPh}
              value={descriptionBottom}
              labelAlwaysVisible
              onChange={updateDescriptionBottom}
            />
            <FormControlWithLabel
              componentClass="textarea"
              id="video-description-side"
              type="rich-text"
              label={quotePh}
              value={descriptionSide}
              labelAlwaysVisible
              onChange={updateDescriptionSide}
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

const getEntryValueForLocale = (entries, locale, defaultValue = null) => {
  const entry = entries.find((e) => {
    return e.get('localeCode') === locale;
  });

  return entry ? entry.get('value') : defaultValue;
};

export const mapStateToProps = ({ admin: { thematicsById } }, { thematicId, selectedLocale }) => {
  const video = thematicsById.getIn([thematicId, 'video']);
  const hasVideo = video !== null;
  let descriptionTop;
  let descriptionBottom;
  let descriptionSide;
  let htmlCode = '';
  let title = '';
  if (hasVideo) {
    descriptionTop = getEntryValueForLocale(video.get('descriptionEntriesTop'), selectedLocale);
    descriptionBottom = getEntryValueForLocale(video.get('descriptionEntriesBottom'), selectedLocale);
    descriptionSide = getEntryValueForLocale(video.get('descriptionEntriesSide'), selectedLocale);
    htmlCode = video.get('htmlCode', '');
    title = getEntryValueForLocale(video.get('titleEntries'), selectedLocale, '');
  }
  return {
    descriptionTop: descriptionTop ? descriptionTop.toJS() : null,
    descriptionBottom: descriptionBottom ? descriptionBottom.toJS() : null,
    descriptionSide: descriptionSide ? descriptionSide.toJS() : null,
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
    updateDescriptionSide: (value) => {
      return dispatch(updateVideoDescriptionSide(thematicId, selectedLocale, value));
    },
    updateTitle: (value) => {
      return dispatch(updateVideoTitle(thematicId, selectedLocale, value));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(VideoForm);