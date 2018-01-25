// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { Checkbox, SplitButton, MenuItem } from 'react-bootstrap';
import range from 'lodash/range';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { getEntryValueForLocale } from '../../../utils/i18n';
import Helper from '../../common/helper';
import TokenCategorieForm from './tokenCategorieForm';
import {
  updateTokenVoteInstructions,
  createTokenVoteCategorie,
  deleteTokenVoteCategorie,
  updateTokenVoteExclusiveCategorie
} from '../../../actions/adminActions/voteSession';

type TokensFormProps = {
  instructions: string,
  exclusiveCategories: boolean,
  tokenCategorieNumber: number,
  tokenCategories: Object,
  editLocale: string,
  handleInstructionsChange: Function,
  handleTokenVoteCategorieNumberChange: Function,
  handleExclusiveCategoriesCheckboxChange: Function
};

const DumbTokensForm = ({
  instructions,
  exclusiveCategories,
  tokenCategorieNumber,
  tokenCategories,
  editLocale,
  handleInstructionsChange,
  handleTokenVoteCategorieNumberChange,
  handleExclusiveCategoriesCheckboxChange
}: TokensFormProps) => (
  <div className="token-vote-form">
    <form>
      <div className="flex">
        <Checkbox
          checked={exclusiveCategories}
          onChange={() => {
            handleExclusiveCategoriesCheckboxChange(exclusiveCategories);
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
        <label htmlFor="input-dropdown-addon">{I18n.t('administration.tokenCategorieNumber')}</label>
        <Helper helperUrl="/static2/img/helpers/helper2.png" helperText={I18n.t('administration.helpers.tokenCategorieNumber')} />
      </div>
      <SplitButton
        title={tokenCategorieNumber}
        onSelect={(e) => {
          handleTokenVoteCategorieNumberChange(e, tokenCategorieNumber);
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
      {tokenCategorieNumber > 0 ? (
        <div>
          <div className="separator" />
          {tokenCategories.map((id, index) => (
            <TokenCategorieForm key={`token-type-${index}`} id={id} editLocale={editLocale} index={index} />
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
    exclusiveCategories: module.get('exclusiveCategories'),
    tokenCategorieNumber: module.get('tokenCategories').size,
    tokenCategories: module.get('tokenCategories'),
    editLocale: editLocale
  };
};

const mapDispatchToProps = (dispatch, { id, editLocale }) => ({
  handleInstructionsChange: e => dispatch(updateTokenVoteInstructions(id, editLocale, e.target.value)),
  handleTokenVoteCategorieNumberChange: (value, tokenCategorieNumber) => {
    const newTokenCategorieNumber = value - tokenCategorieNumber;
    if (value > tokenCategorieNumber) {
      for (let i = 0; i < newTokenCategorieNumber; i += 1) {
        const newId = Math.round(Math.random() * -1000000).toString();
        dispatch(createTokenVoteCategorie(newId, id));
      }
    } else {
      dispatch(deleteTokenVoteCategorie(value, id));
    }
  },
  handleExclusiveCategoriesCheckboxChange: checked => dispatch(updateTokenVoteExclusiveCategorie(id, !checked))
});

export { DumbTokensForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbTokensForm);