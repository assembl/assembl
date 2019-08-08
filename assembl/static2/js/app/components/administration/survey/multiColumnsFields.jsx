// @flow
import React from 'react';
import { Field } from 'react-final-form';
import range from 'lodash/range';
import { I18n } from 'react-redux-i18n';

import Helper from '../../common/helper';
import RadioButtonsFieldAdapter from '../../form/radioButtonsFieldAdapter';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import MultilingualRichTextFieldAdapter from '../../form/multilingualRichTextFieldAdapter';
import ColorPickerFieldAdapter from '../../form/colorPickerFieldAdapter';
import { IMG_HELPER_MULTICOL } from '../../../constants';

type Props = {
  editLocale: string,
  fieldPrefix: string,
  nbColumnsInForm: number
};

const MultiColumnsFields = ({ editLocale, nbColumnsInForm, fieldPrefix }: Props) => (
  <React.Fragment>
    <div className="margin-l" />
    <Helper
      label={I18n.t('administration.tableOfThematics.columnsConfiguration')}
      helperUrl={IMG_HELPER_MULTICOL}
      helperText=""
      classname="title"
    />
    <Field required name={`${fieldPrefix}.multiColumns.radioButtons`} component={RadioButtonsFieldAdapter} />
    {range(0, nbColumnsInForm).map(index => (
      <div key={`formcol-${index}`}>
        <Field
          required
          editLocale={editLocale}
          name={`${fieldPrefix}.multiColumns.messageColumns[${index}].name`}
          component={MultilingualTextFieldAdapter}
          label={`${I18n.t('administration.tableOfThematics.columnTitle')} ${index + 1}`}
        />
        <Field
          required
          editLocale={editLocale}
          name={`${fieldPrefix}.multiColumns.messageColumns[${index}].title`}
          component={MultilingualTextFieldAdapter}
          label={`${I18n.t('administration.tableOfThematics.columnName')} ${index + 1}`}
        />
        <Field
          required
          name={`${fieldPrefix}.multiColumns.messageColumns[${index}].color`}
          component={ColorPickerFieldAdapter}
          label={`${I18n.t('administration.tableOfThematics.columnColor')} ${index + 1}`}
        />
        <Field
          editLocale={editLocale}
          name={`${fieldPrefix}.multiColumns.messageColumns[${index}].columnSynthesis.subject`}
          component={MultilingualTextFieldAdapter}
          label={`${I18n.t('administration.tableOfThematics.columnSynthesisSubject')} ${index + 1}`}
        />
        <Field
          editLocale={editLocale}
          name={`${fieldPrefix}.multiColumns.messageColumns[${index}].columnSynthesis.body`}
          component={MultilingualRichTextFieldAdapter}
          label={`${I18n.t('administration.tableOfThematics.columnSynthesisBody')} ${index + 1}`}
        />
      </div>
    ))}
  </React.Fragment>
);

export default MultiColumnsFields;