// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { SplitButton, MenuItem } from 'react-bootstrap';
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
import { createRandomId } from '../../../utils/globalFunctions';
import { IMG_HELPER2, IMG_HELPER5 } from '../../../constants';

type TokensFormProps = {
  id: string,
  instructions: string,
  exclusiveCategories: boolean,
  tokenCategoryNumber: number,
  tokenCategories: Object,
  editLocale: string,
  handleInstructionsChange: Function,
  handleTokenVoteCategoryNumberChange: Function,
  handleExclusiveCategoriesDropdownChange: Function
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
  handleExclusiveCategoriesDropdownChange
}: TokensFormProps) => (
  <div className="token-vote-form">
    <form>
      <FormControlWithLabel
        label={I18n.t('administration.tokenVoteInstructions')}
        required
        type="text"
        onChange={handleInstructionsChange}
        value={instructions}
        helperUrl={IMG_HELPER5}
        helperText={I18n.t('administration.helpers.tokenVoteInstructions')}
      />
      <label htmlFor="input-dropdown-addon">{I18n.t('administration.tokenCategoryNumber')}</label>
      <div className="inline">
        <Helper helperUrl={IMG_HELPER2} helperText={I18n.t('administration.helpers.tokenCategoryNumber')} />
      </div>
      <div>
        <SplitButton
          title={tokenCategoryNumber}
          onSelect={(e) => {
            handleTokenVoteCategoryNumberChange(e, tokenCategoryNumber);
          }}
          id="input-dropdown-addon"
          required
          className="admin-dropdown"
        >
          {range(1, 11).map(value => (
            <MenuItem key={`item-${value}`} eventKey={value}>
              {value}
            </MenuItem>
          ))}
        </SplitButton>
      </div>
      {tokenCategoryNumber >= 2 && (
        <div style={{ marginTop: '25px' }}>
          <label htmlFor="input-dropdown-exclusive">{I18n.t('administration.exclusive')}</label>
          <Helper
            helperText={I18n.t('administration.helpers.exclusive')}
            classname="inline"
            additionalTextClasses="helper-text-only"
          />
          <SplitButton
            title={exclusiveCategories ? I18n.t('administration.exclusive') : I18n.t('administration.notExclusive')}
            onSelect={(e) => {
              handleExclusiveCategoriesDropdownChange(e);
            }}
            id="input-dropdown-exclusive"
            className="admin-dropdown"
          >
            <MenuItem eventKey={exclusiveCategories}>
              <Translate value="administration.exclusive" />
            </MenuItem>
            <MenuItem eventKey={exclusiveCategories}>
              <Translate value="administration.notExclusive" />
            </MenuItem>
          </SplitButton>
        </div>
      )}

      {tokenCategoryNumber > 0 ? (
        <div>
          <div className="separator" />
          {tokenCategories.map((categoryId, index) => (
            <TokenCategoryForm
              key={`token-type-${index}`}
              id={categoryId}
              editLocale={editLocale}
              index={index}
              moduleId={id}
              tokenCategoryNumber={tokenCategoryNumber}
            />
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
    tokenCategories: module.get('tokenCategories')
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
        const newId = createRandomId();
        dispatch(createTokenVoteCategory(newId, id));
      }
    } else {
      const nbTokenCategoryToDelete = tokenCategoryNumber - value;
      for (let i = 0; i < nbTokenCategoryToDelete; i += 1) {
        dispatch(deleteTokenVoteCategory(id, tokenCategoryNumber - 1 - i));
      }
    }
  },
  handleExclusiveCategoriesDropdownChange: (isExclusive) => {
    dispatch(updateTokenVoteExclusiveCategory(id, !isExclusive));
    dispatch(markAllDependenciesAsChanged(id));
  }
});

export { DumbTokensForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbTokensForm);