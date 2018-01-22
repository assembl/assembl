// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { Checkbox, SplitButton, MenuItem } from 'react-bootstrap';
import range from 'lodash/range';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { getEntryValueForLocale } from '../../../utils/i18n';
import Helper from '../../common/helper';
import TokenTypeForm from './tokenTypeForm';
import {
  updateTokenVoteInstructions,
  createTokenVoteType,
  deleteTokenVoteType,
  updateTokenVoteExclusive
} from '../../../actions/adminActions/voteSession';

type TokensFormProps = {
  instructions: string,
  exclusive: boolean,
  tokenTypeNumber: number,
  tokenTypes: Object,
  editLocale: string,
  handleInstructionsChange: Function,
  handleTokenVoteTypeNumberChange: Function,
  handleExclusiveCheckboxChange: Function
};

const DumbTokensForm = ({
  instructions,
  exclusive,
  tokenTypeNumber,
  tokenTypes,
  editLocale,
  handleInstructionsChange,
  handleTokenVoteTypeNumberChange,
  handleExclusiveCheckboxChange
}: TokensFormProps) => (
  <div className="token-vote-form">
    <form>
      <div className="flex">
        <Checkbox
          checked={exclusive}
          onChange={() => {
            handleExclusiveCheckboxChange(exclusive);
          }}
        >
          <Helper
            label={I18n.t('administration.exclusive')}
            helperText={I18n.t('administration.helpers.exclusive')}
            classname="inline"
            additionalTextClasses="helper-text-only"
          />
        </Checkbox>
      </div>
      <div className="flex">
        <FormControlWithLabel
          label={I18n.t('administration.tokenVoteInstructions')}
          required
          type="text"
          onChange={handleInstructionsChange}
          value={instructions}
        />
        <Helper
          helperUrl="/static2/img/helpers/helper5.png"
          helperText={I18n.t('administration.helpers.tokenVoteInstructions')}
          additionalTextClasses="helper-text-only"
        />
      </div>
      <div className="flex">
        <label htmlFor="input-dropdown-addon">{I18n.t('administration.tokenTypeNumber')}</label>
        <Helper helperUrl="/static2/img/helpers/helper2.png" helperText={I18n.t('administration.helpers.tokenTypeNumber')} />
      </div>
      <SplitButton
        title={tokenTypeNumber}
        onSelect={(e) => {
          handleTokenVoteTypeNumberChange(e, tokenTypeNumber);
        }}
        id="input-dropdown-addon"
        required
      >
        {range(11).map(value => (
          <MenuItem key={`item-${value}`} eventKey={value}>
            {value}
          </MenuItem>
        ))}
      </SplitButton>
      {tokenTypeNumber > 0 ? (
        <div>
          <div className="separator" />
          {tokenTypes.map((id, index) => (
            <TokenTypeForm key={`token-type-${index}`} id={id} editLocale={editLocale} index={index} />
          ))}
        </div>
      ) : null}
    </form>
  </div>
);

const mapStateToProps = (state, { id, editLocale }) => {
  const module = state.admin.voteSession.modulesById.get(id);
  const instructions = getEntryValueForLocale(module.get('instructionsEntries'), editLocale);
  return {
    instructions: instructions,
    exclusive: module.get('exclusive'),
    tokenTypeNumber: module.get('tokenTypes').size,
    tokenTypes: module.get('tokenTypes'),
    editLocale: editLocale
  };
};

const mapDispatchToProps = (dispatch, { id, editLocale }) => ({
  handleInstructionsChange: e => dispatch(updateTokenVoteInstructions(id, editLocale, e.target.value)),
  handleTokenVoteTypeNumberChange: (value, tokenTypeNumber) => {
    const newTokenTypeNumber = value - tokenTypeNumber;
    if (value > tokenTypeNumber) {
      for (let i = 0; i < newTokenTypeNumber; i += 1) {
        const newId = Math.round(Math.random() * -1000000).toString();
        dispatch(createTokenVoteType(newId, id));
      }
    } else {
      dispatch(deleteTokenVoteType(value, id));
    }
  },
  handleExclusiveCheckboxChange: checked => dispatch(updateTokenVoteExclusive(id, !checked))
});

export { DumbTokensForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbTokensForm);