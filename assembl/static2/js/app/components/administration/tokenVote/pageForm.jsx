// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { FormGroup } from 'react-bootstrap';
import SectionTitle from '../sectionTitle';
import FormControlWithLabel from '../../common/formControlWithLabel';
import FileUploader from '../../common/fileUploader';
import { getEntryValueForLocale } from '../../../utils/i18n';
import {
  updateTokenVotePageTitle,
  updateTokenVotePageDescription,
  updateTokenVoteHeaderImage,
  updateTokenVotePageInstructionsTitle,
  updateTokenVotePageInstructionsDescription,
  updateTokenVotePageProposalsTitle
} from '../../../actions/adminActions/tokenVote';

type PageFormProps = {
  headerTitle: string,
  headerDescription: string,
  headerImgUrl: string,
  headerImgMimeType: string,
  instructionsTitle: string,
  instructionsContent: string,
  proposalsSectionTitle: string,
  selectedLocale: string,
  handleHeaderTitleChange: Function,
  handleHeaderDescriptionChange: Function,
  handleHeaderImageChange: Function,
  handleInstructionsTitleChange: Function,
  handleInstructionsContentChange: Function,
  handleProposalsSectionTitleChange: Function
};

const PageForm = ({
  headerTitle,
  headerDescription,
  headerImgUrl,
  headerImgMimeType,
  instructionsTitle,
  instructionsContent,
  proposalsSectionTitle,
  selectedLocale,
  handleHeaderTitleChange,
  handleHeaderDescriptionChange,
  handleHeaderImageChange,
  handleInstructionsTitleChange,
  handleInstructionsContentChange,
  handleProposalsSectionTitleChange
}: PageFormProps) => {
  const headerTitlePh = `${I18n.t('administration.ph.headerTitle')}* ${selectedLocale.toUpperCase()}`;
  const headerDescriptionPh = `${I18n.t('administration.ph.headerDescription')}* ${selectedLocale.toUpperCase()}`;
  const instructionsTitlePh = `${I18n.t('administration.ph.instructionsTitle')}* ${selectedLocale.toUpperCase()}`;
  const instructionsContentPh = `${I18n.t('administration.ph.headerDescription')}* ${selectedLocale.toUpperCase()}`;
  const proposalsSectionTitlePh = `${I18n.t('administration.ph.proposalsSectionTitle')}* ${selectedLocale.toUpperCase()}`;
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
              label={headerDescriptionPh}
              onChange={handleHeaderDescriptionChange}
              required
              type="text"
              value={headerDescription}
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
            key="instructions-content"
            label={instructionsContentPh}
            onChange={handleInstructionsContentChange}
            required
            type="rich-text"
            value={instructionsContent}
          />
          <div className="separator" />
          <div className="title">
            <Translate value="administration.proposalsSectionTitle" />
          </div>
          <FormControlWithLabel
            label={proposalsSectionTitlePh}
            onChange={handleProposalsSectionTitleChange}
            required
            type="text"
            value={proposalsSectionTitle}
          />
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state, { selectedLocale }) => {
  const tokenVote = state.admin.tokenVote;
  return {
    selectedLocale: selectedLocale,
    headerTitle: getEntryValueForLocale(tokenVote.get('titleEntries'), selectedLocale),
    headerDescription: getEntryValueForLocale(tokenVote.get('descriptionEntries'), selectedLocale),
    instructionsTitle: getEntryValueForLocale(tokenVote.get('instructionsTitleEntries'), selectedLocale),
    instructionsContent: '',
    proposalsSectionTitle: getEntryValueForLocale(tokenVote.get('proposalsTitleEntries'), selectedLocale),
    headerImgName: tokenVote.getIn(['headerImage', 'externalUrl']),
    headerImgMimeType: tokenVote.getIn(['headerImage', 'mimeType']),
    headerImgUrl: tokenVote.getIn(['headerImage', 'title'])
  };
};

const mapDispatchToProps = (dispatch, { selectedLocale }) => ({
  handleHeaderTitleChange: e => dispatch(updateTokenVotePageTitle(selectedLocale, e.target.value)),
  handleHeaderDescriptionChange: e => dispatch(updateTokenVotePageDescription(selectedLocale, e.target.value)),
  handleHeaderImageChange: value => dispatch(updateTokenVoteHeaderImage(value)),
  handleInstructionsTitleChange: e => dispatch(updateTokenVotePageInstructionsTitle(selectedLocale, e.target.value)),
  handleInstructionsContentChange: value => dispatch(updateTokenVotePageInstructionsDescription(selectedLocale, value)),
  handleProposalsSectionTitleChange: e => dispatch(updateTokenVotePageProposalsTitle(selectedLocale, e.target.value))
});

export default connect(mapStateToProps, mapDispatchToProps)(PageForm);