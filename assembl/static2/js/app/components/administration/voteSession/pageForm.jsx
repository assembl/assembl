// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { I18n, Translate } from 'react-redux-i18n';
import { FormGroup } from 'react-bootstrap';
import { type EditorState } from 'draft-js';

import SectionTitle from '../sectionTitle';
import FormControlWithLabel from '../../common/formControlWithLabel';
import FileUploader from '../../common/fileUploader';
import Helper from '../../common/helper';
import { getEntryValueForLocale } from '../../../utils/i18n';
import {
  updateVoteSessionPageTitle,
  updateVoteSessionPageSubtitle,
  updateVoteSessionHeaderImage,
  updateVoteSessionPageInstructionsTitle,
  updateVoteSessionPageInstructionsContent,
  updateVoteSessionPagePropositionsTitle
} from '../../../actions/adminActions/voteSession';
import { getDiscussionSlug } from '../../../utils/globalFunctions';
import { get } from '../../../utils/routeMap';

type Props = {
  headerTitle: string,
  headerSubtitle: string,
  headerImgUrl: string,
  headerImgMimeType: string,
  instructionsTitle: string,
  instructionsContent: EditorState,
  propositionSectionTitle: string,
  editLocale: string,
  handleHeaderTitleChange: Function,
  handleHeaderSubtitleChange: Function,
  handleHeaderImageChange: Function,
  handleInstructionsTitleChange: Function,
  handleInstructionsContentChange: Function,
  handlePropositionSectionTitleChange: Function
};

const DumbPageForm = ({
  headerTitle,
  headerSubtitle,
  headerImgUrl,
  headerImgMimeType,
  instructionsTitle,
  instructionsContent,
  propositionSectionTitle,
  editLocale,
  handleHeaderTitleChange,
  handleHeaderSubtitleChange,
  handleHeaderImageChange,
  handleInstructionsTitleChange,
  handleInstructionsContentChange,
  handlePropositionSectionTitleChange
}: Props) => {
  const editLocaleInUppercase = editLocale.toUpperCase();
  const headerTitlePh = `${I18n.t('administration.tableOfThematics.thematicTitle')} ${editLocaleInUppercase}`;
  const headerSubtitlePh = `${I18n.t('administration.tableOfThematics.bannerSubtitleLabel')} ${editLocaleInUppercase}`;
  const instructionsTitlePh = `${I18n.t('administration.tableOfThematics.sectionTitleLabel')} ${editLocaleInUppercase}`;
  const instructionsContentPh = `${I18n.t('administration.tableOfThematics.instructionLabel')} ${editLocaleInUppercase}`;
  const propositionSectionTitlePh = `${I18n.t('administration.ph.propositionSectionTitle')} ${editLocaleInUppercase}`;
  const headerImageFieldName = 'header-image';
  const slug = { slug: getDiscussionSlug() };
  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.voteSession.0')} annotation={I18n.t('administration.annotation')} />
      <div className="intro-text">
        <Translate className="bold" value="administration.voteModulesIntroText1" />
        <div className="inline">
          <Translate value="administration.voteModulesIntroText2" />
          <Link to={get('oldTimeline', slug)} className="timeline-link" target="_blank">
            <Translate value="administration.timeline" />
          </Link>.
        </div>
      </div>
      <div className="admin-content">
        <div className="form-container">
          <form>
            <Helper
              label={I18n.t('administration.headerTitle')}
              helperUrl="/static2/img/helpers/helper1.png"
              helperText={I18n.t('administration.helpers.voteSessionHeader')}
              classname="title"
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
              <label htmlFor={headerImageFieldName}>
                <Translate value="administration.voteSessionHeaderLabel" /> *
              </label>
              <FileUploader
                mimeType={headerImgMimeType}
                name={headerImageFieldName}
                fileOrUrl={headerImgUrl}
                handleChange={handleHeaderImageChange}
                withPreview
              />
              <Translate value="administration.imageRequirements" className="file-uploader-warning" />
            </FormGroup>
          </form>
          <div className="separator" />
          <Helper
            label={I18n.t('administration.instructions')}
            helperUrl="/static2/img/helpers/helper2.jpg"
            helperText={I18n.t('administration.helpers.voteSessionInstructions')}
            classname="title"
          />
          <FormControlWithLabel
            label={instructionsTitlePh}
            onChange={handleInstructionsTitleChange}
            type="text"
            value={instructionsTitle}
            required
          />
          <FormControlWithLabel
            key={`instructions-${editLocale}`}
            label={instructionsContentPh}
            onChange={handleInstructionsContentChange}
            type="rich-text"
            value={instructionsContent}
            required
          />
          <div className="separator" />
          <Helper
            label={I18n.t('administration.proposalSectionTitle')}
            helperUrl="/static2/img/helpers/helper3.png"
            helperText={I18n.t('administration.helpers.voteSessionProposalSection')}
            classname="title"
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

const mapStateToProps = (state, { editLocale }) => {
  const voteSession = state.admin.voteSession.page;
  const instructionsContent = getEntryValueForLocale(voteSession.get('instructionsSectionContentEntries'), editLocale);
  return {
    headerTitle: getEntryValueForLocale(voteSession.get('titleEntries'), editLocale),
    headerSubtitle: getEntryValueForLocale(voteSession.get('subTitleEntries'), editLocale),
    instructionsTitle: getEntryValueForLocale(voteSession.get('instructionsSectionTitleEntries'), editLocale),
    instructionsContent: instructionsContent,
    propositionSectionTitle: getEntryValueForLocale(voteSession.get('propositionsSectionTitleEntries'), editLocale),
    headerImgUrl: voteSession.getIn(['headerImage', 'externalUrl']),
    headerImgMimeType: voteSession.getIn(['headerImage', 'mimeType'])
  };
};

const mapDispatchToProps = (dispatch, { editLocale }) => ({
  handleHeaderTitleChange: e => dispatch(updateVoteSessionPageTitle(editLocale, e.target.value)),
  handleHeaderSubtitleChange: e => dispatch(updateVoteSessionPageSubtitle(editLocale, e.target.value)),
  handleHeaderImageChange: value => dispatch(updateVoteSessionHeaderImage(value)),
  handleInstructionsTitleChange: e => dispatch(updateVoteSessionPageInstructionsTitle(editLocale, e.target.value)),
  handleInstructionsContentChange: value => dispatch(updateVoteSessionPageInstructionsContent(editLocale, value)),
  handlePropositionSectionTitleChange: e => dispatch(updateVoteSessionPagePropositionsTitle(editLocale, e.target.value))
});

export { DumbPageForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbPageForm);