// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Checkbox } from 'react-bootstrap';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { getEntryValueForLocale } from '../../../utils/i18n';
import TextWithHelper from '../../common/textWithHelper';
import {
  updateTokenVoteInstructions,
  updateTokenVoteTypeNumber,
  updateTokenVoteTypeExclusivity
} from '../../../actions/adminActions/voteSession';

const TokensForm = ({
  instructions,
  exclusive,
  tokenTypeNumber,
  handleExclusiveCheckboxChange,
  handleTypesNumberChange,
  handleInstructionsChange
}) => (
  <div className="token-vote-form">
    <form>
      <div style={{ display: 'flex' }}>
        <FormControlWithLabel
          label="Consigne du vote par jeton" // TODO ajouter une key dans le fichier de trad
          required
          type="text"
          onChange={handleInstructionsChange}
          value={instructions}
        />
        <TextWithHelper
          helperUrl="/static2/img/helpers/helper1.png" // TODO ajouter le preview
          helperText="Instructions sur le champs consigne" // TODO ajouter une key dans le fichier de trad
        />
      </div>
      <div style={{ display: 'flex' }}>
        <FormControlWithLabel
          label="Nombre de types de jetons" // TODO ajouter une key dans le fichier de trad
          required
          type="text"
          onChange={handleTypesNumberChange}
          value={tokenTypeNumber}
        />
        <TextWithHelper
          helperUrl="/static2/img/helpers/helper2.png" // TODO ajouter le preview
          helperText="Instructions sur le champs 'type de jetons'" // TODO ajouter une key dans le fichier de trad
        />
      </div>
      <div style={{ display: 'flex' }}>
        <Checkbox checked={exclusive} onChange={handleExclusiveCheckboxChange}>
          <TextWithHelper
            text="Exclusif" // TODO ajouter une key dans le fichier de trad
            helperUrl="/static2/img/helpers/helper1.png" // TODO ajouter le preview
            helperText="Les différents types de jetons sont-ils exclusifs les uns des autres" // TODO ajouter une key dans le fichier de trad
            classname="inline"
          />
        </Checkbox>
      </div>
    </form>
  </div>
);

const mapStateToProps = (state, { id, editLocale }) => {
  const module = state.admin.voteSession.modulesById.get(id);
  const instructions = getEntryValueForLocale(module.get('instructionsEntries'), editLocale);
  return {
    instructions: instructions,
    exclusive: module.get('exclusive'),
    tokenTypeNumber: module.get('tokenTypes').length
  };
};

const mapDispatchToProps = (dispatch, { id, editLocale }) => ({
  handleInstructionsChange: e => dispatch(updateTokenVoteInstructions(id, editLocale, e.target.value)),
  handleTypesNumberChange: e => dispatch(updateTokenVoteTypeNumber(id, e.target.value)),
  handleExclusiveCheckboxChange: e => dispatch(updateTokenVoteTypeExclusivity(id, e.target.value))
});

export default connect(mapStateToProps, mapDispatchToProps)(TokensForm);