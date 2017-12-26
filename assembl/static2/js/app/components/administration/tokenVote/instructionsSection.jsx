// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { FormGroup } from 'react-bootstrap';
import SectionTitle from '../sectionTitle';
import FormControlWithLabel from '../../common/formControlWithLabel';
import FileUploader from '../../common/fileUploader';

type InstructionsSectionProps = {
  headerTitle: string,
  headerSubTitle: string,
  headerImgUrl: string,
  headerImgMimeType: string,
  instructionsTitle: string,
  instructionsText: string,
  sectionTitle: string,
  selectedLocale: string
};

const InstructionsSection = ({
  headerTitle,
  headerSubTitle,
  headerImgUrl,
  headerImgMimeType,
  instructionsTitle,
  instructionsText,
  sectionTitle,
  selectedLocale
}: InstructionsSectionProps) => {
  const handleHeaderTitleChange = () => {};
  const handleHeaderSubTitleChange = () => {};
  const handleHeaderImageChange = () => {};
  const handleInstructionsTitleChange = () => {};
  const handleInstructionsTextChange = () => {};
  const handleSectionTitleChange = () => {};
  const headerTitlePh = `${I18n.t('administration.ph.headerTitle')}* ${selectedLocale.toUpperCase()}`;
  const headerSubTitlePh = `${I18n.t('administration.ph.headerSubTitle')}* ${selectedLocale.toUpperCase()}`;
  const instructionsTitlePh = `${I18n.t('administration.ph.instructionsTitle')}* ${selectedLocale.toUpperCase()}`;
  const instructionsTextPh = `${I18n.t('administration.ph.instructionsText')}* ${selectedLocale.toUpperCase()}`;
  const sectionTitlePh = `${I18n.t('administration.ph.sectionTitle')}* ${selectedLocale.toUpperCase()}`;
  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.tokenVote.0')} annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <div className="form-container">
          <form>
            <div className="title">
              <Translate value="administration.headerTitle" />
            </div>
            <FormControlWithLabel
              label={headerTitlePh}
              onChange={handleHeaderTitleChange}
              required
              type="text"
              value={headerTitle}
            />
            <FormControlWithLabel
              label={headerSubTitlePh}
              onChange={handleHeaderSubTitleChange}
              required
              type="text"
              value={headerSubTitle}
            />
            <FormGroup>
              <FileUploader fileOrUrl={headerImgUrl} handleChange={handleHeaderImageChange} mimeType={headerImgMimeType} />
            </FormGroup>
          </form>
          <div className="separator" />
          <div className="title">
            <Translate value="administration.instructions" />
          </div>
          <FormControlWithLabel
            label={instructionsTitlePh}
            onChange={handleInstructionsTitleChange}
            required
            type="text"
            value={instructionsTitle}
          />
          <FormControlWithLabel
            label={instructionsTextPh}
            onChange={handleInstructionsTextChange}
            required
            type="rich-text"
            value={instructionsText}
          />
          <div className="separator" />
          <div className="title">
            <Translate value="administration.sectionTitle" />
          </div>
          <FormControlWithLabel
            label={sectionTitlePh}
            onChange={handleSectionTitleChange}
            required
            type="text"
            value={sectionTitle}
          />
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  selectedLocale: state.admin.selectedLocale,
  headerTitle: '',
  headerSubTitle: '',
  headerImgUrl: '',
  headerImgMimeType: '',
  instructionsTitle: '',
  instructionsText: '',
  sectionTitle: ''
});

export default connect(mapStateToProps)(InstructionsSection);