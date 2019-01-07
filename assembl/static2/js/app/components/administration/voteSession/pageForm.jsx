// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { I18n, Translate } from 'react-redux-i18n';

import SectionTitle from '../sectionTitle';
import FormControlWithLabel from '../../common/formControlWithLabel';
import Helper from '../../common/helper';
import { getEntryValueForLocale } from '../../../utils/i18n';
import { updateVoteSessionPagePropositionsTitle } from '../../../actions/adminActions/voteSession';
import { getDiscussionSlug } from '../../../utils/globalFunctions';
import { get } from '../../../utils/routeMap';

type Props = {
  propositionSectionTitle: string,
  editLocale: string,
  handlePropositionSectionTitleChange: Function
};

const DumbPageForm = ({ propositionSectionTitle, editLocale, handlePropositionSectionTitleChange }: Props) => {
  const editLocaleInUppercase = editLocale.toUpperCase();
  const propositionSectionTitlePh = `${I18n.t('administration.ph.propositionSectionTitle')} ${editLocaleInUppercase}`;
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
  return {
    propositionSectionTitle: getEntryValueForLocale(voteSession.get('propositionsSectionTitleEntries'), editLocale)
  };
};

const mapDispatchToProps = (dispatch, { editLocale }) => ({
  handlePropositionSectionTitleChange: e => dispatch(updateVoteSessionPagePropositionsTitle(editLocale, e.target.value))
});

export { DumbPageForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbPageForm);