// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Checkbox } from 'react-bootstrap';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { getEntryValueForLocale } from '../../../utils/i18n';
import TextWithHelper from '../../common/textWithHelper';
import TokenTypeForm from './tokenTypeForm';
import { updateTokenVoteInstructions, createTokenVoteType, deleteTokenVoteType } from '../../../actions/adminActions/voteSession';

type TokensFormProps = {
  instructions: string,
  exclusive: boolean,
  tokenTypeNumber: number,
  tokenTypes: Object,
  editLocale: string,
  handleInstructionsChange: Function,
  handleTokenVoteTypeNumberChange: Function
};

const TokensForm = ({
  instructions,
  exclusive,
  tokenTypeNumber,
  tokenTypes,
  editLocale,
  handleInstructionsChange,
  handleTokenVoteTypeNumberChange
}: TokensFormProps) => {
  const handleExclusiveCheckboxChange = () => {};
  return (
    <div className="token-vote-form">
      <form>
        <div style={{ display: 'flex' }} /* TODO: create css class instead */>
          <Checkbox checked={exclusive} onChange={handleExclusiveCheckboxChange}>
            <TextWithHelper
              text="Exclusif" // TODO ajouter une key dans le fichier de trad
              helperUrl="/static2/img/helpers/helper1.png" // TODO ajouter le preview
              helperText="Les différents types de jetons sont-ils exclusifs les uns des autres" // TODO ajouter une key dans le fichier de trad
              classname="inline"
            />
          </Checkbox>
        </div>
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
            onChange={handleTokenVoteTypeNumberChange}
            value={tokenTypeNumber}
          />
          <TextWithHelper
            helperUrl="/static2/img/helpers/helper2.png" // TODO ajouter le preview
            helperText="Instructions sur le champs 'type de jetons'" // TODO ajouter une key dans le fichier de trad
          />
        </div>
        {tokenTypeNumber > 0 ? (
          <div>
            <div className="separator" />
            {tokenTypes.map((id, index) => <TokenTypeForm key={`token-type-${index}`} id={id} editLocale={editLocale} />)}
          </div>
        ) : null}
      </form>
    </div>
  );
};

const mapStateToProps = (state, { id, editLocale }) => {
  const module = state.admin.voteSession.modulesById.get(id);
  const { tokenTypesInOrder } = state.admin.voteSession;
  const instructions = getEntryValueForLocale(module.get('instructionsEntries'), editLocale);
  return {
    instructions: instructions,
    exclusive: module.get('exclusive'),
    tokenTypeNumber: tokenTypesInOrder.size,
    tokenTypes: tokenTypesInOrder,
    editLocale: editLocale
  };
};

const mapDispatchToProps = (dispatch, { id, editLocale, tokenTypesNumber }) => ({
  handleInstructionsChange: e => dispatch(updateTokenVoteInstructions(id, editLocale, e.target.value)),
  handleTokenVoteTypeNumberChange: (e) => {
    const newTokenTypesNumber = e.target.value - tokenTypesNumber;
    if (e.target.value > tokenTypesNumber) {
      for (let i = 0; i < newTokenTypesNumber; i += 1) {
        const newId = Math.round(Math.random() * -1000000).toString();
        dispatch(createTokenVoteType(newId));
      }
    } else {
      dispatch(deleteTokenVoteType(e.target.value));
    }
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(TokensForm);