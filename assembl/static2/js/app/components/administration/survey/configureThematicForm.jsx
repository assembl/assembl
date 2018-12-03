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
import type { SurveyAdminValues, ThemesValue } from './types.flow';
import { PHASES, modulesTranslationKeys } from '../../../constants';

type Props = {
  editLocale: string,
  thematicId: string,
  slug: string,
  values: ?SurveyAdminValues
};

export function getFieldName(themeId: string, values: ThemesValue, fieldName: string): string {
  let result = '';
  let index = 0;
  let value = values[index];
  while (!result && value) {
    if (value.id === themeId) {
      result = `${fieldName}[${index}]`;
    } else if (value.children) {
      const childrenResult = getFieldName(themeId, value.children, 'children');
      if (childrenResult) {
        result = `${fieldName}[${index}].${childrenResult}`;
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
    const name = getFieldName(thematicId, values ? values.themes : [], 'themes');
    if (!name) {
      goTo(get('administration', { slug: slug, id: PHASES.survey }, { section: 1 }));
    }
    return name;
  };

  render() {
    const { editLocale } = this.props;
    const name = this.getName();
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
      </div>
    );
  }
}

const mapStateToProps = state => ({
  slug: state.debate.debateData.slug
});

export default connect(mapStateToProps)(ConfigureThematicForm);