// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Field } from 'react-final-form';

import FieldArrayWithActions from '../../form/fieldArrayWithActions';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
// import MultilingualRichTextFieldAdapter from '../../form/multilingualRichTextFieldAdapter';
import { addQuestionTooltip, deleteQuestionTooltip } from '../../common/tooltips';
import Helper from '../../common/helper';

type Props = {
  editLocale: string,
  fieldPrefix: string
};

const SurveyFields = ({ editLocale, fieldPrefix }: Props) => (
  // const upperCaseLocale = editLocale.toUpperCase();
  // const descriptionSidePh = `${I18n.t('administration.tableOfThematics.quote')} ${upperCaseLocale}`;
  // const descriptionSideName = `${fieldPrefix}.video.descriptionSide`;
  <React.Fragment>
    <div className="video-fields">
      {/* TODO replace this descriptionSide field by a quote field in announcement */}
      {/* <Field
          key={`${descriptionSideName}-${editLocale}`}
          editLocale={editLocale}
          label={descriptionSidePh}
          name={descriptionSideName}
          component={MultilingualRichTextFieldAdapter}
        /> */}
    </div>
    <Helper
      label={I18n.t('administration.tableOfThematics.questionsHeader')}
      // helperUrl="/static2/img/helpers/helper1.png"  // TODO
      helperText="" // TODO
      classname="title"
    />
    <FieldArrayWithActions
      name={`${fieldPrefix}.questions`}
      renderFields={({ idx: qIdx, name }) => (
        <Field
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

export default SurveyFields;