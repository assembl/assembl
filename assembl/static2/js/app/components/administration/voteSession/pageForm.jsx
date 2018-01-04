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
  updateVoteSessionPageTitle,
  updateVoteSessionPageSubtitle,
  updateVoteSessionHeaderImage,
  updateVoteSessionPageInstructionsTitle,
  updateVoteSessionPageInstructionsContent,
  updateVoteSessionPagePropositionsTitle
} from '../../../actions/adminActions/voteSession';

type PageFormProps = {
  headerTitle: string,
  headerSubtitle: string,
  headerImgUrl: string,
  headerImgMimeType: string,
  instructionsTitle: string,
  instructionsContent: string,
  propositionSectionTitle: string,
  selectedLocale: string,
  handleHeaderTitleChange: Function,
  handleHeaderSubtitleChange: Function,
  handleHeaderImageChange: Function,
  handleInstructionsTitleChange: Function,
  handleInstructionsContentChange: Function,
  handlePropositionSectionTitleChange: Function
};

const PageForm = ({
  headerTitle,
  headerSubtitle,
  headerImgUrl,
  headerImgMimeType,
  instructionsTitle,
  instructionsContent,
  propositionSectionTitle,
  selectedLocale,
  handleHeaderTitleChange,
  handleHeaderSubtitleChange,
  handleHeaderImageChange,
  handleInstructionsTitleChange,
  handleInstructionsContentChange,
  handlePropositionSectionTitleChange
}: PageFormProps) => {
  const headerTitlePh = `${I18n.t('administration.ph.headerTitle')} ${selectedLocale.toUpperCase()}*`;
  const headerSubtitlePh = `${I18n.t('administration.ph.headerSubtitle')} ${selectedLocale.toUpperCase()}`;
  const instructionsTitlePh = `${I18n.t('administration.ph.instructionsTitle')} ${selectedLocale.toUpperCase()}*`;
  const instructionsContentPh = `${I18n.t('administration.ph.instructionsContent')} ${selectedLocale.toUpperCase()}*`;
  const propositionSectionTitlePh = `${I18n.t('administration.ph.propositionSectionTitle')} ${selectedLocale.toUpperCase()}*`;
  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.voteSession.0')} annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <div className="form-container">
          <form>
            <TitleWithHelper
              title={I18n.t('administration.headerTitle')}
              previewUrl="/static2/img/helpers/helper1.png"
              txt={I18n.t('administration.helpers.voteSessionHeader')}
            />
            <FormControlWithLabel
              label={headerTitlePh}
              onChange={handleHeaderTitleChange}
              required
              type="text"
              value={headerTitle}
            />
            <FormControlWithLabel
              label={headerSubtitlePh}
              onChange={handleHeaderSubtitleChange}
              type="text"
              value={headerSubtitle}
            />
            <FormGroup>
              <FileUploader fileOrUrl={headerImgUrl} handleChange={handleHeaderImageChange} mimeType={headerImgMimeType} />
            </FormGroup>
          </form>
          <div className="separator" />
          <TitleWithHelper
            title={I18n.t('administration.instructions')}
            previewUrl="/static2/img/helpers/helper2.png"
            txt={I18n.t('administration.helpers.voteSessionInstructions')}
          />
          <FormControlWithLabel
            label={instructionsTitlePh}
            onChange={handleInstructionsTitleChange}
            required
            type="text"
            value={instructionsTitle}
          />
          <FormControlWithLabel
            key={`instructions-${selectedLocale}`}
            label={instructionsContentPh}
            onChange={handleInstructionsContentChange}
            required
            type="rich-text"
            value={instructionsContent}
          />
          <div className="separator" />
          <TitleWithHelper
            title={I18n.t('administration.propositionSectionTitle')}
            previewUrl="/static2/img/helpers/helper3.png"
            txt={I18n.t('administration.helpers.voteSessionPropositionSection')}
          />
          <FormControlWithLabel
            label={propositionSectionTitlePh}
            onChange={handlePropositionSectionTitleChange}
            required
            type="text"
            value={propositionSectionTitle}
          />
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state, { selectedLocale }) => {
  const voteSession = state.admin.voteSession;
  const instructionsContent = getEntryValueForLocale(voteSession.get('instructionsSectionContentEntries'), selectedLocale);
  return {
    headerTitle: getEntryValueForLocale(voteSession.get('titleEntries'), selectedLocale),
    headerSubtitle: getEntryValueForLocale(voteSession.get('subTitleEntries'), selectedLocale),
    instructionsTitle: getEntryValueForLocale(voteSession.get('instructionsSectionTitleEntries'), selectedLocale),
    instructionsContent: instructionsContent ? instructionsContent.toJS() : null,
    propositionSectionTitle: getEntryValueForLocale(voteSession.get('propositionsSectionTitleEntries'), selectedLocale),
    headerImgUrl: voteSession.get('headerImgUrl'),
    headerImgMimeType: 'image/jpeg'
  };
};

const mapDispatchToProps = (dispatch, { selectedLocale }) => ({
  handleHeaderTitleChange: e => dispatch(updateVoteSessionPageTitle(selectedLocale, e.target.value)),
  handleHeaderSubtitleChange: e => dispatch(updateVoteSessionPageSubtitle(selectedLocale, e.target.value)),
  handleHeaderImageChange: value => dispatch(updateVoteSessionHeaderImage(value)),
  handleInstructionsTitleChange: e => dispatch(updateVoteSessionPageInstructionsTitle(selectedLocale, e.target.value)),
  handleInstructionsContentChange: value => dispatch(updateVoteSessionPageInstructionsContent(selectedLocale, value)),
  handlePropositionSectionTitleChange: e => dispatch(updateVoteSessionPagePropositionsTitle(selectedLocale, e.target.value))
});

export default connect(mapStateToProps, mapDispatchToProps)(PageForm);