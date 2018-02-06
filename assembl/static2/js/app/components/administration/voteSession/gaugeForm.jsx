import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import Helper from '../../common/helper';
import { getEntryValueForLocale } from '../../../utils/i18n';
import FormControlWithLabel from '../../common/formControlWithLabel';

const DumbGaugeForm = () => (
  <div className="gauges-vote-form">
    <div className="flex">
      <FormControlWithLabel label={I18n.t('administration.gaugeVoteInstructions')} required type="text" />
      <Helper
        helperUrl="/static2/img/helpers/helper6.png"
        helperText={I18n.t('administration.helpers.gaugeVoteInstructions')}
        additionalTextClasses="helper-text-only"
      />
    </div>
    <div className="separator" />
  </div>
);

const mapStateToProps = (state, { id, editLocale }) => {
  const module = state.admin.voteSession.modulesById.get(id);
  const instructions = getEntryValueForLocale(module.get('instructionsEntries'), editLocale);
  return {
    instructions: instructions
  };
};

export { DumbGaugeForm };

export default connect(mapStateToProps)(DumbGaugeForm);