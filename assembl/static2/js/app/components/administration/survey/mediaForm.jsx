import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { FormGroup, Checkbox } from 'react-bootstrap';

import {
  toggleMedia,
  updateMediaHtmlCode,
  updateMediaDescriptionTop,
  updateMediaDescriptionBottom,
  updateMediaDescriptionSide,
  updateMediaTitle
} from '../../../actions/adminActions';
import FormControlWithLabel from '../../common/formControlWithLabel';

const MediaForm = ({
  descriptionTop,
  descriptionBottom,
  descriptionSide,
  hasMedia,
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
  const mediaLinkPh = `${I18n.t('administration.ph.mediaLink')} ${selectedLocale.toUpperCase()}`;
  return (
    <div className="form-container">
      <div className="margin-xl">
        <FormGroup>
          <Checkbox checked={hasMedia} onChange={toggle}>
            <Translate value="administration.announcementModule" />
          </Checkbox>
        </FormGroup>
        {hasMedia
          ? <div className="media-form">
            <FormControlWithLabel
              id="media-title"
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
              id="media-description-top"
              type="rich-text"
              label={descriptionTopPh}
              value={descriptionTop}
              onChange={updateDescriptionTop}
            />
            <FormControlWithLabel
              componentClass="textarea"
              id="media-description-bottom"
              type="rich-text"
              label={descriptionBottomPh}
              value={descriptionBottom}
              onChange={updateDescriptionBottom}
            />
            <FormControlWithLabel
              componentClass="textarea"
              id="media-description-side"
              type="rich-text"
              label={quotePh}
              value={descriptionSide}
              onChange={updateDescriptionSide}
            />
            <FormControlWithLabel
              id="media-link"
              type="text"
              label={mediaLinkPh}
              value={htmlCode}
              onChange={(e) => {
                return updateHtmlCode(e.target.value);
              }}
            />
            <div className="admin-help">
              <Translate value="administration.mediaHelp" />
            </div>
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
  const media = thematicsById.getIn([thematicId, 'video']);
  const hasMedia = media && media !== null;
  let descriptionTop;
  let descriptionBottom;
  let descriptionSide;
  let htmlCode = '';
  let title = '';
  if (hasMedia) {
    descriptionTop = getEntryValueForLocale(media.get('descriptionEntriesTop'), selectedLocale);
    descriptionBottom = getEntryValueForLocale(media.get('descriptionEntriesBottom'), selectedLocale);
    descriptionSide = getEntryValueForLocale(media.get('descriptionEntriesSide'), selectedLocale);
    htmlCode = media.get('htmlCode', '');
    title = getEntryValueForLocale(media.get('titleEntries'), selectedLocale, '');
  }
  return {
    descriptionTop: descriptionTop ? descriptionTop.toJS() : null,
    descriptionBottom: descriptionBottom ? descriptionBottom.toJS() : null,
    descriptionSide: descriptionSide ? descriptionSide.toJS() : null,
    hasMedia: hasMedia,
    htmlCode: htmlCode,
    title: title
  };
};

export const mapDispatchToProps = (dispatch, { selectedLocale, thematicId }) => {
  return {
    toggle: () => {
      return dispatch(toggleMedia(thematicId));
    },
    updateHtmlCode: (value) => {
      return dispatch(updateMediaHtmlCode(thematicId, value));
    },
    updateDescriptionTop: (value) => {
      return dispatch(updateMediaDescriptionTop(thematicId, selectedLocale, value));
    },
    updateDescriptionBottom: (value) => {
      return dispatch(updateMediaDescriptionBottom(thematicId, selectedLocale, value));
    },
    updateDescriptionSide: (value) => {
      return dispatch(updateMediaDescriptionSide(thematicId, selectedLocale, value));
    },
    updateTitle: (value) => {
      return dispatch(updateMediaTitle(thematicId, selectedLocale, value));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(MediaForm);