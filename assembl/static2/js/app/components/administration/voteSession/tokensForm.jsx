// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { Checkbox, SplitButton, MenuItem } from 'react-bootstrap';
import range from 'lodash/range';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { getEntryValueForLocale } from '../../../utils/i18n';
import Helper from '../../common/helper';
import TokenCategoryForm from './tokenCategoryForm';
import {
  updateTokenVoteInstructions,
  createTokenVoteCategory,
  deleteTokenVoteCategory,
  updateTokenVoteExclusiveCategory,
  markAllDependenciesAsChanged
} from '../../../actions/adminActions/voteSession';

type TokensFormProps = {
  id: string,
  instructions: string,
  exclusiveCategories: boolean,
  tokenCategoryNumber: number,
  tokenCategories: Object,
  editLocale: string,
  handleInstructionsChange: Function,
  handleTokenVoteCategoryNumberChange: Function,
  handleExclusiveCategoriesCheckboxChange: Function
};

const DumbTokensForm = ({
  id,
  instructions,
  exclusiveCategories,
  tokenCategoryNumber,
  tokenCategories,
  editLocale,
  handleInstructionsChange,
  handleTokenVoteCategoryNumberChange,
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
        <label htmlFor="input-dropdown-addon">{I18n.t('administration.tokenCategoryNumber')}</label>
        <Helper helperUrl="/static2/img/helpers/helper2.png" helperText={I18n.t('administration.helpers.tokenCategoryNumber')} />
      </div>
      <SplitButton
        title={tokenCategoryNumber}
        onSelect={(e) => {
          handleTokenVoteCategoryNumberChange(e, tokenCategoryNumber);
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
      {tokenCategoryNumber > 0 ? (
        <div>
          <div className="separator" />
          {tokenCategories.map((categoryId, index) => (
            <TokenCategoryForm key={`token-type-${index}`} id={categoryId} editLocale={editLocale} index={index} moduleId={id} />
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
    tokenCategoryNumber: module.get('tokenCategories').size,
    tokenCategories: module.get('tokenCategories'),
    editLocale: editLocale
  };
};

const mapDispatchToProps = (dispatch, { id, editLocale }) => ({
  handleInstructionsChange: (e) => {
    dispatch(updateTokenVoteInstructions(id, editLocale, e.target.value));
    dispatch(markAllDependenciesAsChanged(id));
  },
  handleTokenVoteCategoryNumberChange: (value, tokenCategoryNumber) => {
    const newTokenCategoryNumber = value - tokenCategoryNumber;
    if (value > tokenCategoryNumber) {
      for (let i = 0; i < newTokenCategoryNumber; i += 1) {
        const newId = Math.round(Math.random() * -1000000).toString();
        dispatch(createTokenVoteCategory(newId, id));
      }
    } else {
      const nbTokenCategoryToDelete = tokenCategoryNumber - value;
      for (let i = 0; i < nbTokenCategoryToDelete; i += 1) {
        dispatch(deleteTokenVoteCategory(id, tokenCategoryNumber - 1 - i));
      }
    }
  },
  handleExclusiveCategoriesCheckboxChange: (checked) => {
    dispatch(updateTokenVoteExclusiveCategory(id, !checked));
    dispatch(markAllDependenciesAsChanged(id));
  }
});

export { DumbTokensForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbTokensForm);