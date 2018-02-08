// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { getEntryValueForLocale } from '../../../utils/i18n';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { updateGaugeVoteChoiceLabel } from '../../../actions/adminActions/voteSession';

type TextGaugeFormProps = {
  title: string,
  handleGaugeChoiceLabelChange: Function
};

const DumbTextGaugeForm = ({ index, handleGaugeChoiceLabelChange, title }: TextGaugeFormProps) => {
  console.log('title', title);
  return (
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
};

const mapStateToProps = (state, { choice, editLocale }) => {
  const title = getEntryValueForLocale(choice.get('labelEntries'), editLocale);
  return {
    title: title
  };
};

const mapDispatchToProps = (dispatch, { parentId, choice, editLocale }) => ({
  handleGaugeChoiceLabelChange: e => dispatch(updateGaugeVoteChoiceLabel(parentId, choice.get('id'), editLocale, e.target.value))
});

export { DumbTextGaugeForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbTextGaugeForm);