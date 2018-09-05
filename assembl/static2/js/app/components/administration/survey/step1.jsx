// @flow
import React from 'react';
import { Field } from 'react-final-form';
import { I18n } from 'react-redux-i18n';
import { type ApolloClient, withApollo } from 'react-apollo';

import FieldArrayWithActions from '../../form/fieldArrayWithActions';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import { addThematicTooltip, deleteThematicTooltip, deleteSubThematicDisabledTooltip } from '../../common/tooltips';
import { removeMenuItem, addMenuItem, swapMenuItem } from '../thematicsMenu';
import { PHASES } from '../../../constants';

type Props = {
  editLocale: string,
  locale: string,
  client: ApolloClient
};

const Step1 = ({ editLocale, locale, client }: Props) => {
  const queryVariables = { identifier: PHASES.survey, lang: locale };
  return (
    <React.Fragment>
      <div className="form-title">{I18n.t('administration.survey.1')}</div>
      <FieldArrayWithActions
        isTree
        name="themes"
        subFieldName="children"
        minItems={1}
        maxLevel={1}
        onRemove={id => removeMenuItem(id, client, queryVariables)}
        onAdd={(id, parentId, index) => addMenuItem(id, parentId, index, client, queryVariables)}
        onUp={(id, parentId, index, targetIndex) => swapMenuItem(id, parentId, index, targetIndex, client, queryVariables)}
        onDown={(id, parentId, index, targetIndex) => swapMenuItem(id, parentId, index, targetIndex, client, queryVariables)}
        renderFields={({ name, fieldIndex }) => (
          <Field
            required
            editLocale={editLocale}
            name={`${name}.title`}
            component={MultilingualTextFieldAdapter}
            label={`${I18n.t('administration.tableOfThematics.thematicTitle')} ${fieldIndex} ${editLocale.toUpperCase()}`}
          />
        )}
        tooltips={{
          addTooltip: addThematicTooltip,
          deleteTooltip: deleteThematicTooltip,
          deleteDisabled: deleteSubThematicDisabledTooltip
        }}
      />
    </React.Fragment>
  );
};
export default withApollo(Step1);