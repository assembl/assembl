// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Field } from 'react-final-form';

import FieldArrayWithActions from '../../form/fieldArrayWithActions';
import TabbedContent, { type Tab } from '../../common/tabbedContent';

import CheckboxFieldAdapter from '../../form/checkboxFieldAdapter';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import MultilingualRichTextFieldAdapter from '../../form/multilingualRichTextFieldAdapter';
import TextOrFileFieldAdapter from '../../form/textOrFileFieldAdapter';
import { addQuestionTooltip, deleteQuestionTooltip } from '../../common/tooltips';
import type { SurveyAdminValues, ThemesValue } from './types.flow';

export function getTabsFromThemes(themes: ThemesValue, editLocale: string): Array<Tab> {
  return themes
    ? themes.map(t => ({
      id: t.id,
      title: t.title[editLocale]
    }))
    : [];
}

type Props = {
  editLocale: string,
  values: ?SurveyAdminValues
};

const Step2 = ({ editLocale, values }: Props) => (
  <TabbedContent
    bodyRowClassName="margin-xl"
    tabs={values && values.themes ? getTabsFromThemes(values.themes, editLocale) : []}
    renderBody={(tab, idx) => {
      const upperCaseLocale = editLocale.toUpperCase();
      const titlePh = `${I18n.t('administration.ph.title')} ${upperCaseLocale}`;
      const descriptionSidePh = `${I18n.t('administration.ph.quote')} ${upperCaseLocale}`;
      const descriptionTopPh = `${I18n.t('administration.ph.descriptionTop')} ${upperCaseLocale}`;
      const descriptionBottomPh = `${I18n.t('administration.ph.descriptionBottom')} ${upperCaseLocale}`;
      const mediaLinkPh = I18n.t('administration.ph.mediaLink');
      const descriptionTopName = `themes[${idx}].video.descriptionTop`;
      const descriptionSideName = `themes[${idx}].video.descriptionSide`;
      const descriptionBottomName = `themes[${idx}].video.descriptionBottom`;
      return (
        <div className="form-container">
          <Field
            name={`themes[${idx}].video.present`}
            label={I18n.t('administration.announcementModule')}
            component={CheckboxFieldAdapter}
            type="checkbox"
          />
          {values &&
            values.themes[idx].video.present && (
              <div className="box video-fields">
                <Field
                  editLocale={editLocale}
                  label={titlePh}
                  name={`themes[${idx}].video.title`}
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
                  name={`themes[${idx}].video.media`}
                  component={TextOrFileFieldAdapter}
                />
              </div>
            )}
          <div className="separator" />
          <FieldArrayWithActions
            name={`themes[${idx}].questions`}
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
        </div>
      );
    }}
  />
);

export default Step2;