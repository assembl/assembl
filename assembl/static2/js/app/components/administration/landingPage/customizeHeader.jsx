// @flow
import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { FormGroup } from 'react-bootstrap';
import SectionTitle from '../../administration/sectionTitle';
import FormControlWithLabel from '../../common/formControlWithLabel';
import FileUploader from '../../common/fileUploader';

type Props = { header: Object }; // TODO define the shape of the object

export const DumbCustomizeHeader = ({ header }: Props) => {
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
  const handleTitleChange = (): void => {};
  const handleSubtitleChange = (): void => {};
  const handleButtonLabelChange = (): void => {};
  const handleHeaderImageChange = (): void => {};
  const handleLogoImageChange = (): void => {};
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
              handleChange={handleHeaderImageChange}
              mimeType={headerImgMimeType}
              name="landing-page-img-header"
              isAdminUploader
              onDeleteClick={() => {}}
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
              handleChange={handleLogoImageChange}
              mimeType={logoImgMimeType}
              name="landing-page-img-logo"
              isAdminUploader
              onDeleteClick={() => {}}
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

export default DumbCustomizeHeader;