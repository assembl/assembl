// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { BlockPicker as ColorPicker } from 'react-color';
import { getEntryValueForLocale } from '../../../utils/i18n';
import FormControlWithLabel from '../../common/formControlWithLabel';
import {
  updateTokenVoteCategorieTitle,
  updateTokenVoteCategorieColor,
  updateTokenTotalNumber
} from '../../../actions/adminActions/voteSession';
import { pickerColors } from '../../../constants';

type TokenCategorieFormProps = {
  title: string,
  color: string,
  totalNumber: number,
  index: number,
  handleTitleChange: Function,
  handleColorChange: Function,
  handleNumberChange: Function
};

const DumbTokenCategorieForm = ({
  title,
  color,
  totalNumber,
  index,
  handleTitleChange,
  handleColorChange,
  handleNumberChange
}: TokenCategorieFormProps) => (
  <div className="token-type-form">
    <FormControlWithLabel
      label={I18n.t('administration.tokenTitle')}
      required
      type="text"
      onChange={handleTitleChange}
      value={title}
    />
    <FormControlWithLabel
      label={I18n.t('administration.tokenNumber')}
      required
      type="number"
      onChange={handleNumberChange}
      value={totalNumber}
    />
    <label htmlFor="color-picker">{I18n.t('administration.tokenColor')}</label>
    <ColorPicker
      colors={pickerColors}
      onChange={handleColorChange}
      color={color || pickerColors[index]}
      width="400px"
      id="color-picker"
      triangle="hide"
    />
    <div className="separator" />
  </div>
);

const mapStateToProps = (state, { id, editLocale }) => {
  const { tokenCategoriesById } = state.admin.voteSession;
  const tokenCategorie = tokenCategoriesById.get(id);
  const title = getEntryValueForLocale(tokenCategorie.get('titleEntries'), editLocale);
  return {
    title: title,
    color: tokenCategorie.get('color'),
    totalNumber: tokenCategorie.get('totalNumber')
  };
};

const mapDispatchToProps = (dispatch, { id, editLocale }) => ({
  handleTitleChange: e => dispatch(updateTokenVoteCategorieTitle(id, editLocale, e.target.value)),
  handleNumberChange: e => dispatch(updateTokenTotalNumber(id, e.target.value)),
  handleColorChange: color => dispatch(updateTokenVoteCategorieColor(id, color.hex))
});

export { DumbTokenCategorieForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbTokenCategorieForm);