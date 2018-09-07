// @flow
import React from 'react';
import { Field } from 'react-final-form';
import { I18n, Translate } from 'react-redux-i18n';

import FieldArrayWithActions from '../../form/fieldArrayWithActions';
import FileUploaderFieldAdapter from '../../form/fileUploaderFieldAdapter';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import { addThematicTooltip, deleteThematicTooltip, deleteThematicImageTooltip } from '../../common/tooltips';

type Props = {
  editLocale: string
};

const Step1 = ({ editLocale }: Props) => (
  <FieldArrayWithActions
    confirmDeletion
    name="themes"
    renderFields={({ name }) => (
      <React.Fragment>
        <Field
          required
          editLocale={editLocale}
          name={`${name}.title`}
          component={MultilingualTextFieldAdapter}
          label={`${I18n.t('administration.ph.title')} ${editLocale.toUpperCase()}`}
        />
        <Field
          deleteTooltip={deleteThematicImageTooltip}
          name={`${name}.img`}
          component={FileUploaderFieldAdapter}
          label={I18n.t('administration.voteSessionHeaderLabel')}
        />
      </React.Fragment>
    )}
    titleMsgId="administration.themeNum"
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