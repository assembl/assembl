// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { Checkbox, DropdownButton, MenuItem } from 'react-bootstrap';
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
        <div className="flex">
          <Checkbox checked={exclusive} onChange={handleExclusiveCheckboxChange}>
            <TextWithHelper
              text="Exclusif" // TODO ajouter une key dans le fichier de trad
              helperUrl="/static2/img/helpers/helper1.png" // TODO ajouter le preview
              helperText="Les différents types de jetons sont-ils exclusifs les uns des autres" // TODO ajouter une key dans le fichier de trad
              classname="inline"
            />
          </Checkbox>
        </div>
        <div className="flex">
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
        <div className="flex">
          <label htmlFor="input-dropdown-addon">{I18n.t('administration.voteSession.tokenTypeNumber')}</label>
          <TextWithHelper
            helperUrl="/static2/img/helpers/helper2.png" // TODO ajouter le preview
            helperText="Instructions sur le champs 'type de jetons'" // TODO ajouter une key dans le fichier de trad
          />
        </div>
        <DropdownButton title={tokenTypeNumber} onSelect={handleTokenVoteTypeNumberChange} id="input-dropdown-addon" required>
          <MenuItem eventKey="1">1</MenuItem>
          <MenuItem eventKey="2">2</MenuItem>
          <MenuItem eventKey="3">3</MenuItem>
          <MenuItem eventKey="4">4</MenuItem>
        </DropdownButton>
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

const mapDispatchToProps = (dispatch, { id, editLocale, tokenTypesNumber, toDelete }) => ({
  handleInstructionsChange: e => dispatch(updateTokenVoteInstructions(id, editLocale, e.target.value)),
  handleTokenVoteTypeNumberChange: (value) => {
    const newTokenTypesNumber = value - tokenTypesNumber;
    if (value > tokenTypesNumber) {
      for (let i = 0; i < newTokenTypesNumber; i += 1) {
        const newId = Math.round(Math.random() * -1000000).toString();
        dispatch(createTokenVoteType(newId));
      }
    } else {
      dispatch(deleteTokenVoteType(value));
    }
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(TokensForm);