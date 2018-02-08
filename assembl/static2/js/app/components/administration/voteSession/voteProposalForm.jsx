import React from 'react';
import { I18n } from 'react-redux-i18n';
import FormControlWithLabel from '../../common/formControlWithLabel';

const VoteProposalForm = () => (
  <div className="form-container">
    <form>
      <div clasName="title">Définir proposition</div>
      <FormControlWithLabel label="Titre de la proposition" onChange={() => {}} required type="text" />
      <FormControlWithLabel label="Description de la proposition" onChange={() => {}} type="rich-text" required />
    </form>
  </div>
);

export default VoteProposalForm;