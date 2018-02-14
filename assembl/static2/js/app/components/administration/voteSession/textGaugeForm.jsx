// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { getEntryValueForLocale } from '../../../utils/i18n';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { updateGaugeVoteChoiceLabel } from '../../../actions/adminActions/voteSession';

type TextGaugeFormProps = {
  index: number,
  title: string,
  handleGaugeChoiceLabelChange: Function
};

const DumbTextGaugeForm = ({ index, handleGaugeChoiceLabelChange, title }: TextGaugeFormProps) => (
  <div>
    <FormControlWithLabel
      value={title}
      onChange={handleGaugeChoiceLabelChange}
      label={`${I18n.t('administration.valueTitle')} ${index + 1}`}
      required
      type="text"
    />
  </div>
);

const mapStateToProps = (state, { id, editLocale }) => {
  const { gaugeChoicesById } = state.admin.voteSession;
  const gaugeChoice = gaugeChoicesById.get(id);
  const title = getEntryValueForLocale(gaugeChoice.get('labelEntries'), editLocale);
  return {
    title: title
  };
};

const mapDispatchToProps = (dispatch, { id, editLocale }) => ({
  handleGaugeChoiceLabelChange: e => dispatch(updateGaugeVoteChoiceLabel(id, editLocale, e.target.value))
});

export { DumbTextGaugeForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbTextGaugeForm);