// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Field } from 'react-final-form';
import { connect } from 'react-redux';

import { get, goTo } from '../../../utils/routeMap';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import FileUploaderFieldAdapter from '../../form/fileUploaderFieldAdapter';
import SelectFieldAdapter from '../../form/selectFieldAdapter';
import { deleteThematicImageTooltip } from '../../common/tooltips';
import type { SurveyAdminValues, ThemeValue, ThemesValue } from './types.flow';
import { PHASES, modulesTranslationKeys } from '../../../constants';

type Props = {
  editLocale: string,
  thematicId: string,
  slug: string,
  values: ?SurveyAdminValues
};

export function getFieldData(themeId: string, values: ThemesValue, fieldName: string): { name: string, value: ?ThemeValue } {
  let result = { name: '', value: null };
  let index = 0;
  let value = values[index];
  while (!result.name && value) {
    if (value.id === themeId) {
      result = { name: `${fieldName}[${index}]`, value: value };
    } else if (value.children) {
      const childrenResult = getFieldData(themeId, value.children, 'children');
      if (childrenResult.name) {
        result = { name: `${fieldName}[${index}].${childrenResult.name}`, value: value[childrenResult.name] };
      }
    }
    index += 1;
    value = values[index];
  }
  return result;
}

class ConfigureThematicForm extends React.PureComponent<Props> {
  getName = () => {
    const { values, thematicId, slug } = this.props;
    const fieldData = getFieldData(thematicId, values ? values.themes : [], 'themes');
    if (!fieldData.name) {
      goTo(get('administration', { slug: slug, id: PHASES.survey }, { section: 1 }));
    }
    return fieldData;
  };

  render() {
    const { editLocale } = this.props;
    const { name, value: theme } = this.getName();
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
          label={I18n.t('administration.tableOfThematics.headerLabel')}
        />
        <Field
          name={`${name}.messageViewOverride`}
          component={SelectFieldAdapter}
          isSearchable={false}
          label={I18n.t('administration.tableOfThematics.moduleTypeLabel')}
          options={modulesTranslationKeys.map(key => ({ value: key, label: I18n.t(`administration.modules.${key}`) }))}
        />
        <span>{theme ? theme.messageViewOverride.value : null}</span>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  slug: state.debate.debateData.slug
});

export default connect(mapStateToProps)(ConfigureThematicForm);