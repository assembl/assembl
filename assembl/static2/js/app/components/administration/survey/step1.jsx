// @flow
import React from 'react';
import { Field } from 'react-final-form';
import { I18n, Translate } from 'react-redux-i18n';

import FieldArrayWithActions from '../../form/fieldArrayWithActions';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import { addThematicTooltip, deleteThematicTooltip } from '../../common/tooltips';

type Props = {
  editLocale: string
};

const Step1 = ({ editLocale }: Props) => (
  <FieldArrayWithActions
    isTree
    name="themes"
    subFieldName="children"
    minItems={1}
    maxLevel={1}
    onRemove={() => {
      // @TODO
      // console.log(`Remove the menu item (update the ThematicsDataQuery): ${index}`);
    }}
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

export default Step1;