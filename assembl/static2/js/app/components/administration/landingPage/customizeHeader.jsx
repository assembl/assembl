// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { FormGroup } from 'react-bootstrap';
import SectionTitle from '../../administration/sectionTitle';
import FormControlWithLabel from '../../common/formControlWithLabel';
import FileUploader from '../../common/fileUploader';
import {
  updateLandingPageHeaderTitle,
  updateLandingPageHeaderSubtitle,
  updateLandingPageHeaderButtonLabel,
  updateLandingPageHeaderImage,
  updateLandingPageHeaderLogo
} from '../../../actions/adminActions/landingPage';

type Props = {
  header: Object,
  handleTitleChange: Function,
  handleSubtitleChange: Function,
  handleButtonLabelChange: Function,
  handleImageChange: Function,
  handleLogoChange: Function
};

const DumbCustomizeHeader = ({
  header,
  handleTitleChange,
  handleSubtitleChange,
  handleButtonLabelChange,
  handleImageChange,
  handleLogoChange
}: Props) => {
  const {
    title,
    subtitle,
    buttonLabel,
    headerImgMimeType,
    headerImgUrl,
    headerImgTitle,
    logoImgMimeType,
    logoImgUrl,
    logoImgTitle
  } = header;
  const titlePh = I18n.t('administration.landingPage.header.titleLabel');
  const subtitlePh = I18n.t('administration.landingPage.header.subtitleLabel');
  const buttonLabelPh = I18n.t('administration.landingPage.header.buttonLabel');
  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.landingPage.header.title')} annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <div className="form-container">
          <p className="admin-paragraph">
            <Translate value="administration.landingPage.header.helper" />
          </p>
          <div className="margin-l" />
          <FormControlWithLabel label={titlePh} onChange={handleTitleChange} required type="text" value={title} />
          <FormControlWithLabel label={subtitlePh} onChange={handleSubtitleChange} required type="rich-text" value={subtitle} />
          <FormGroup>
            <label htmlFor="landing-page-img-header">
              <Translate value="administration.landingPage.header.headerImage" />
            </label>
            <FileUploader
              fileOrUrl={headerImgUrl}
              imgTitle={headerImgTitle}
              handleChange={handleImageChange}
              mimeType={headerImgMimeType}
              name="landing-page-img-header"
              isAdminUploader
              onDeleteClick={() => handleImageChange('TO_DELETE')}
            />
            <div className="description-block">
              <Translate value="administration.landingPage.header.headerDescription" />
            </div>
          </FormGroup>
          <FormControlWithLabel
            label={buttonLabelPh}
            onChange={handleButtonLabelChange}
            required
            type="text"
            value={buttonLabel}
          />
          <FormGroup>
            <label htmlFor="landing-page-img-logo">
              <Translate value="administration.landingPage.header.logoImage" />
            </label>
            <FileUploader
              fileOrUrl={logoImgUrl}
              imgTitle={logoImgTitle}
              handleChange={handleLogoChange}
              mimeType={logoImgMimeType}
              name="landing-page-img-logo"
              isAdminUploader
              onDeleteClick={() => handleLogoChange('TO_DELETE')}
            />
            <div className="description-block">
              <Translate value="administration.landingPage.header.logoDescription" />
            </div>
          </FormGroup>
        </div>
      </div>
    </div>
  );
};

const mapDispatchToProps = (dispatch, { editLocale }) => ({
  handleTitleChange: e => dispatch(updateLandingPageHeaderTitle(editLocale, e.target.value)),
  handleSubtitleChange: value => dispatch(updateLandingPageHeaderSubtitle(editLocale, value)),
  handleButtonLabelChange: e => dispatch(updateLandingPageHeaderButtonLabel(editLocale, e.target.value)),
  handleImageChange: value => dispatch(updateLandingPageHeaderImage(value)),
  handleLogoChange: value => dispatch(updateLandingPageHeaderLogo(value))
});

export { DumbCustomizeHeader };

export default connect(null, mapDispatchToProps)(DumbCustomizeHeader);