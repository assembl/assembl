// @flow
import React from 'react';
import { Field } from 'react-final-form';
import range from 'lodash/range';
import { I18n } from 'react-redux-i18n';

import Helper from '../../common/helper';
import RadioButtonsFieldAdapter from '../../form/radioButtonsFieldAdapter';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import ColorPickerFieldAdapter from '../../form/colorPickerFieldAdapter';

type Props = {
  editLocale: string,
  fieldPrefix: string,
  nbColumnsInForm: number
};

const MultiColumnsFields = ({ editLocale, nbColumnsInForm, fieldPrefix }: Props) => (
  <React.Fragment>
    <Helper
      label={I18n.t('administration.tableOfThematics.columnsConfiguration')}
      helperUrl="/static2/img/helpers/helper_multicol.png"
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
      </div>
    ))}
  </React.Fragment>
);

export default MultiColumnsFields;