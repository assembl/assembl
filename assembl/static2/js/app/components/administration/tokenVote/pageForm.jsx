// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { FormGroup } from 'react-bootstrap';
import SectionTitle from '../sectionTitle';
import FormControlWithLabel from '../../common/formControlWithLabel';
import FileUploader from '../../common/fileUploader';
import TitleWithHelper from '../../common/titleWithHelper';
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
  const headerTitlePh = `${I18n.t('administration.ph.headerTitle')} ${selectedLocale.toUpperCase()}*`;
  const headerDescriptionPh = `${I18n.t('administration.ph.headerDescription')} ${selectedLocale.toUpperCase()}`;
  const instructionsTitlePh = `${I18n.t('administration.ph.instructionsTitle')} ${selectedLocale.toUpperCase()}*`;
  const instructionsContentPh = `${I18n.t('administration.ph.instructionsContent')} ${selectedLocale.toUpperCase()}*`;
  const proposalsSectionTitlePh = `${I18n.t('administration.ph.proposalsSectionTitle')} ${selectedLocale.toUpperCase()}*`;
  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.tokenVote.0')} annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <div className="form-container">
          <form>
            <TitleWithHelper
              title={I18n.t('administration.headerTitle')}
              previewUrl="/static2/img/helpers/helper1.png"
              txt={I18n.t('administration.helpers.tokenHeader')}
            />
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
              type="text"
              value={headerDescription}
            />
            <FormGroup>
              <FileUploader fileOrUrl={headerImgUrl} handleChange={handleHeaderImageChange} mimeType={headerImgMimeType} />
            </FormGroup>
          </form>
          <div className="separator" />
          <TitleWithHelper
            title={I18n.t('administration.instructions')}
            previewUrl="/static2/img/helpers/helper2.png"
            txt={I18n.t('administration.helpers.tokenInstructions')}
          />
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
          <TitleWithHelper
            title={I18n.t('administration.proposalsSectionTitle')}
            previewUrl="/static2/img/helpers/helper3.png"
            txt={I18n.t('administration.helpers.tokenProposalsSection')}
          />
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
    headerTitle: getEntryValueForLocale(tokenVote.get('titleEntries'), selectedLocale),
    headerDescription: getEntryValueForLocale(tokenVote.get('descriptionEntries'), selectedLocale),
    instructionsTitle: getEntryValueForLocale(tokenVote.get('instructionsTitleEntries'), selectedLocale),
    instructionsContent: '',
    proposalsSectionTitle: getEntryValueForLocale(tokenVote.get('proposalsTitleEntries'), selectedLocale),
    headerImgName: tokenVote.getIn(['headerImage', 'title']),
    headerImgMimeType: tokenVote.getIn(['headerImage', 'mimeType']),
    headerImgUrl: tokenVote.getIn(['headerImage', 'externalUrl'])
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