// @flow
import React from 'react';
import { Field } from 'react-final-form';
import { I18n, Translate } from 'react-redux-i18n';

import FieldArrayWithActions from '../../form/fieldArrayWithActions';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import { addThematicTooltip, deleteThematicTooltip } from '../../common/tooltips';

type Props = {
  editLocale: string,
  fieldName: string,
  isSubTree: boolean
};

const Step1 = ({ editLocale, fieldName, isSubTree }: Props) => (
  <FieldArrayWithActions
    className={isSubTree ? 'form-branche' : 'form-tree'}
    isTree
    isRoot={!isSubTree}
    name={fieldName}
    renderFields={({ name }) => (
      <div className="form-tree-item">
        <Field
          required
          editLocale={editLocale}
          name={`${name}.title`}
          component={MultilingualTextFieldAdapter}
          label={`${I18n.t('administration.ph.title')} ${editLocale.toUpperCase()}`}
        />
        <Step1 editLocale={editLocale} fieldName={`${name}.children`} isSubTree />
      </div>
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

Step1.defaultProps = {
  fieldName: 'themes',
  isSubTree: false
};

export default Step1;