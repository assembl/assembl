// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Field } from 'react-final-form';

import FieldArrayWithActions from '../../form/fieldArrayWithActions';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import MultilingualRichTextFieldAdapter from '../../form/multilingualRichTextFieldAdapter';
import { addQuestionTooltip, deleteQuestionTooltip } from '../../common/tooltips';
import Helper from '../../common/helper';
import { IMG_HELPER_SURVEY } from '../../../constants';

type Props = {
  editLocale: string,
  fieldPrefix: string
};

const SurveyFields = ({ editLocale, fieldPrefix }: Props) => {
  const upperCaseLocale = editLocale.toUpperCase();
  const announcementQuoteName = `${fieldPrefix}.announcement.quote`;
  return (
    <React.Fragment>
      <Field
        key={`${announcementQuoteName}-${editLocale}`}
        editLocale={editLocale}
        name={announcementQuoteName}
        label={`${I18n.t('administration.tableOfThematics.quote')} ${upperCaseLocale}`}
        component={MultilingualRichTextFieldAdapter}
      />
      <Helper
        label={I18n.t('administration.tableOfThematics.questionsHeader')}
        helperUrl={IMG_HELPER_SURVEY}
        helperText={I18n.t('administration.helpers.surveyQuestion')}
        classname="title"
      />
      <FieldArrayWithActions
        name={`${fieldPrefix}.questions`}
        renderFields={({ idx: qIdx, name }) => (
          <Field
            required
            editLocale={editLocale}
            label={`${I18n.t('administration.question_label')} ${qIdx + 1} ${editLocale.toUpperCase()}`}
            name={`${name}.title`}
            component={MultilingualTextFieldAdapter}
            componentClass="textarea"
          />
        )}
        tooltips={{
          addTooltip: addQuestionTooltip,
          deleteTooltip: deleteQuestionTooltip
        }}
        withSeparators={false}
      />
    </React.Fragment>
  );
};

export default SurveyFields;