// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { I18n, Translate } from 'react-redux-i18n';
import { BlockPicker as ColorPicker } from 'react-color';
import { getEntryValueForLocale } from '../../../utils/i18n';
import FormControlWithLabel from '../../common/formControlWithLabel';
import {
  updateTokenVoteCategoryTitle,
  updateTokenVoteCategoryColor,
  updateTokenTotalNumber
} from '../../../actions/adminActions/voteSession';
import { pickerColors } from '../../../constants';

type TokenCategoryFormProps = {
  title: string,
  color: string,
  totalNumber: number,
  index: number,
  handleTitleChange: Function,
  handleColorChange: Function,
  handleNumberChange: Function,
  tokenCategoryNumber: number
};

const DumbTokenCategoryForm = ({
  title,
  color,
  totalNumber,
  index,
  handleTitleChange,
  handleColorChange,
  handleNumberChange,
  tokenCategoryNumber
}: TokenCategoryFormProps) => (
  <div className="token-type-form" id={`type-form-${index}`}>
    <Translate value="administration.token" number={index + 1} />
    <div className="margin-m">
      <FormControlWithLabel
        id={`token-title-${index}`}
        label={I18n.t('administration.tokenTitle')}
        required
        type="text"
        onChange={handleTitleChange}
        value={title}
      />
      <FormControlWithLabel
        id={`token-number-${index}`}
        label={I18n.t('administration.tokenNumber')}
        required
        type="number"
        onChange={e => handleNumberChange(parseInt(e.target.value, 10))}
        value={totalNumber.toString()}
        formControlProps={{
          min: '1'
        }}
      />
      <label htmlFor={`color-picker-${index}`}>{I18n.t('administration.tokenColor')}</label>
      <ColorPicker
        colors={pickerColors}
        onChange={handleColorChange}
        color={color}
        width="100%"
        id={`color-picker-${index}`}
        triangle="hide"
        className="no-box-shadow no-border-radius"
      />
    </div>
    {index + 1 !== tokenCategoryNumber && <div className="separator" />}
  </div>
);

const mapStateToProps = (state, { id, editLocale }) => {
  const { tokenCategoriesById } = state.admin.voteSession;
  const tokenCategory = tokenCategoriesById.get(id);
  const title = getEntryValueForLocale(tokenCategory.get('titleEntries'), editLocale);
  return {
    title: title,
    color: tokenCategory.get('color'),
    totalNumber: tokenCategory.get('totalNumber')
  };
};

const mapDispatchToProps = (dispatch, { moduleId, id, editLocale }) => ({
  handleTitleChange: e => dispatch(updateTokenVoteCategoryTitle(id, editLocale, e.target.value, moduleId)),
  handleNumberChange: (value) => {
    if (value > 0) {
      dispatch(updateTokenTotalNumber(id, value, moduleId));
    }
  },
  handleColorChange: color => dispatch(updateTokenVoteCategoryColor(id, color.hex, moduleId))
});

export { DumbTokenCategoryForm };

export default connect(mapStateToProps, mapDispatchToProps)(DumbTokenCategoryForm);