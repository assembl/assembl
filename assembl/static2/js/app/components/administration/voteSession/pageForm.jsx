// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import SectionTitle from '../sectionTitle';
import FormControlWithLabel from '../../common/formControlWithLabel';
import Helper from '../../common/helper';
import { getEntryValueForLocale } from '../../../utils/i18n';
import { updateVoteSessionPagePropositionsTitle } from '../../../actions/adminActions/voteSession';
import { IMG_HELPER3 } from '../../../constants';

type Props = {
  propositionSectionTitle: string,
  editLocale: string,
  handlePropositionSectionTitleChange: Function
};

const DumbPageForm = ({ propositionSectionTitle, editLocale, handlePropositionSectionTitleChange }: Props) => {
  const editLocaleInUppercase = editLocale.toUpperCase();
  const propositionSectionTitlePh = `${I18n.t('administration.ph.propositionSectionTitle')} ${editLocaleInUppercase}`;
  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.voteSession.0')} annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <div className="form-container">
          <Helper
            label={I18n.t('administration.proposalSectionTitle')}
            helperUrl={IMG_HELPER3}
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