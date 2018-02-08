// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import FormControlWithLabel from '../../common/formControlWithLabel';

type TextGaugeFormProps = {
  choices: Object
};

const DumbTextGaugeForm = ({ choices }: TextGaugeFormProps) => (
  <div>
    {choices.map((choice, index) => (
      <FormControlWithLabel
        label={`${I18n.t('administration.valueTitle')} ${index + 1}`}
        key={`value-title-${index}`}
        required
        type="text"
      />
    ))}
  </div>
);

const mapStateToProps = (state, { id }) => {
  const module = state.admin.voteSession.modulesById.get(id);
  return {
    choices: module.get('choices')
  };
};

export { DumbTextGaugeForm };

export default connect(mapStateToProps)(DumbTextGaugeForm);