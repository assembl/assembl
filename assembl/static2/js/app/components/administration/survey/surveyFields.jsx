// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Field } from 'react-final-form';

import FieldArrayWithActions from '../../form/fieldArrayWithActions';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import MultilingualRichTextFieldAdapter from '../../form/multilingualRichTextFieldAdapter';
import TextOrFileFieldAdapter from '../../form/textOrFileFieldAdapter';
import { addQuestionTooltip, deleteQuestionTooltip } from '../../common/tooltips';

type Props = {
  editLocale: string,
  fieldPrefix: string
};

const SurveyFields = ({ editLocale, fieldPrefix }: Props) => {
  const upperCaseLocale = editLocale.toUpperCase();
  const titlePh = `${I18n.t('administration.ph.title')} ${upperCaseLocale}`;
  const descriptionSidePh = `${I18n.t('administration.ph.quote')} ${upperCaseLocale}`;
  const descriptionTopPh = `${I18n.t('administration.ph.descriptionTop')} ${upperCaseLocale}`;
  const descriptionBottomPh = `${I18n.t('administration.ph.descriptionBottom')} ${upperCaseLocale}`;
  const mediaLinkPh = I18n.t('administration.ph.mediaLink');
  const descriptionTopName = `${fieldPrefix}.video.descriptionTop`;
  const descriptionSideName = `${fieldPrefix}.video.descriptionSide`;
  const descriptionBottomName = `${fieldPrefix}.video.descriptionBottom`;
  return (
    <React.Fragment>
      <div className="video-fields">
        <Field
          editLocale={editLocale}
          label={titlePh}
          name={`${fieldPrefix}.video.title`}
          component={MultilingualTextFieldAdapter}
        />
        <Field
          key={`${descriptionTopName}-${editLocale}`}
          editLocale={editLocale}
          label={descriptionTopPh}
          name={descriptionTopName}
          component={MultilingualRichTextFieldAdapter}
        />
        <Field
          key={`${descriptionSideName}-${editLocale}`}
          editLocale={editLocale}
          label={descriptionSidePh}
          name={descriptionSideName}
          component={MultilingualRichTextFieldAdapter}
        />
        <Field
          key={`${descriptionBottomName}-${editLocale}`}
          editLocale={editLocale}
          label={descriptionBottomPh}
          name={descriptionBottomName}
          component={MultilingualRichTextFieldAdapter}
        />
        <Field
          label={mediaLinkPh}
          fileFieldLabel={I18n.t('administration.ph.orAttachPicture')}
          name={`${fieldPrefix}.video.media`}
          component={TextOrFileFieldAdapter}
        />
      </div>
      <div className="separator" />
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
};

export default SurveyFields;