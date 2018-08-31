// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Field } from 'react-final-form';

import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import FileUploaderFieldAdapter from '../../form/fileUploaderFieldAdapter';
import { deleteThematicImageTooltip } from '../../common/tooltips';
import type { SurveyAdminValues, ThemesValue } from './types.flow';

type Props = {
  editLocale: string,
  thematicId: string,
  values: ?SurveyAdminValues
};

export function getFieldName(themeId: string, values: ThemesValue, fieldName: string): string {
  let result = '';
  values.some((value, index) => {
    if (value.id === themeId) {
      result = `${fieldName}[${index}]`;
    } else if (value.children) {
      const childrenResult = getFieldName(themeId, value.children, 'children');
      if (childrenResult) {
        result = `${fieldName}[${index}].${childrenResult}`;
      }
    }
    return result;
  });
  return result;
}

const ConfigureThematicForm = ({ editLocale, values, thematicId }: Props) => {
  const name = getFieldName(thematicId, values ? values.themes : [], 'themes');
  return (
    <div className="form-container">
      <Field
        required
        editLocale={editLocale}
        name={`${name}.title`}
        component={MultilingualTextFieldAdapter}
        label={`${I18n.t('administration.tableOfThematics.thematicTitle')} ${editLocale.toUpperCase()}`}
      />
      <Field
        deleteTooltip={deleteThematicImageTooltip}
        name={`${name}.img`}
        component={FileUploaderFieldAdapter}
        label={I18n.t('administration.voteSessionHeaderLabel')}
      />
    </div>
  );
};

export default ConfigureThematicForm;