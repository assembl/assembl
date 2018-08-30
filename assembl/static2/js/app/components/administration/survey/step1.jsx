// @flow
import React from 'react';
import { Field } from 'react-final-form';
import { I18n } from 'react-redux-i18n';
import { type ApolloClient, withApollo } from 'react-apollo';

import FieldArrayWithActions from '../../form/fieldArrayWithActions';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import { addThematicTooltip, deleteThematicTooltip } from '../../common/tooltips';
import { removeMenuItem, addMenuItem } from '../thematicsMenu';
import { PHASES } from '../../../constants';

type Props = {
  editLocale: string,
  client: ApolloClient
};

const Step1 = ({ editLocale, client }: Props) => (
  <FieldArrayWithActions
    isTree
    name="themes"
    subFieldName="children"
    minItems={1}
    // maxLevel={1}
    onRemove={id => removeMenuItem(id, client, PHASES.survey)}
    onAdd={(id, parentId, order) => addMenuItem(id, parentId, order, client, PHASES.survey)}
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
      deleteTooltip: deleteThematicTooltip
    }}
    confirmDeletionMessages={{
      confirmDeletionTitle: ({ index }) => (
        <Translate value="administration.tableOfThematics.confirmDeletionTitle" title={index} />
      ),
      confirmDeletionBody: ({ index }) => <Translate value="administration.tableOfThematics.confirmDeletionBody" title={index} />
    }}
  />
);

export default withApollo(Step1);