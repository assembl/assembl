// @flow
import React from 'react';
import { I18n, Translate } from 'react-redux-i18n';
import { Field } from 'react-final-form';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import { getDiscussionSlug } from '../../../utils/globalFunctions';
import { get, goTo } from '../../../utils/routeMap';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import MultilingualRichTextFieldAdapter from '../../form/multilingualRichTextFieldAdapter';
import FileUploaderFieldAdapter from '../../form/fileUploaderFieldAdapter';
import SelectFieldAdapter from '../../form/selectFieldAdapter';
import { deleteThematicImageTooltip } from '../../common/tooltips';
import Helper from '../../common/helper';
import type { ThemesAdminValues, ThemeValue, ThemesValue } from './types.flow';
import { IMG_HELPER_BM, IMG_HELPER1, MESSAGE_VIEW, modulesTranslationKeys } from '../../../constants';
import SurveyFields from './surveyFields';
import MultiColumnsFields from './multiColumnsFields';

type Props = {
  pristine: boolean,
  editLocale: string,
  phaseIdentifier: string,
  thematicId: string,
  slug: string,
  values: ?ThemesAdminValues
};

export function getFieldData(themeId: string, values: ThemesValue, fieldName: string): { name: string, value: ?ThemeValue } {
  let result = { name: '', value: null };
  let index = 0;
  let value = values[index];
  while (!result.name && value) {
    if (value.id === themeId) {
      result = { name: `${fieldName}[${index}]`, value: value };
    } else if (value.children) {
      const childrenResult = getFieldData(themeId, value.children, 'children');
      if (childrenResult.name) {
        result = { name: `${fieldName}[${index}].${childrenResult.name}`, value: childrenResult.value };
      }
    }
    index += 1;
    value = values[index];
  }
  return result;
}

class ConfigureThematicForm extends React.PureComponent<Props> {
  getName = () => {
    const { values, phaseIdentifier, thematicId, slug } = this.props;
    const fieldData = getFieldData(thematicId, values ? values.themes : [], 'themes');
    if (!fieldData.name) {
      goTo(get('administration', { slug: slug, id: phaseIdentifier }, { section: 1 }));
    }
    return fieldData;
  };

  addVoteModuleLink = (theme: ThemeValue) => {
    if (!(theme && theme.messageViewOverride && theme.messageViewOverride.value === MESSAGE_VIEW.voteSession)) {
      return null;
    }
    const { phaseIdentifier, thematicId } = this.props;
    const slug = getDiscussionSlug();
    const voteModuleLink = (
      <p>
        <Link
          to={get(
            'voteSessionAdmin',
            { slug: slug },
            { section: '1', thematicId: thematicId, goBackPhaseIdentifier: phaseIdentifier }
          )}
          className="button-link button-dark"
        >
          <Translate value="administration.configureVoteSessionButton" />
        </Link>
      </p>
    );
    if (thematicId.startsWith('-') || !this.props.pristine) {
      return (
        <p className="warning-message" role="alert">
          <Translate value="administration.saveBeforeConfigureVoteSession" />
        </p>
      );
    }
    return voteModuleLink;
  };

  render() {
    const { editLocale } = this.props;
    const { name, value: theme } = this.getName();
    const upperCaseLocale = editLocale.toUpperCase();
    const titleName = `${name}.title`;
    const descriptionName = `${name}.description`;
    const imageName = `${name}.img`;
    const messageViewOverrideName = `${name}.messageViewOverride`;
    const announcementTitleName = `${name}.announcement.title`;
    const announcementBodyName = `${name}.announcement.body`;
    const announcementSummaryName = `${name}.announcement.summary`;
    const checkedForm =
      theme &&
      theme.multiColumns &&
      theme.multiColumns.radioButtons &&
      theme.multiColumns.radioButtons.find(button => button.isChecked);
    const nbColumnsInForm = checkedForm ? checkedForm.size : 2;
    return (
      <div className="form-container" key={name}>
        <Helper
          label={I18n.t('administration.headerTitle')}
          helperUrl={IMG_HELPER1}
          helperText={I18n.t('administration.tableOfThematics.bannerHeader')}
          classname="title"
        />
        <Field
          required
          editLocale={editLocale}
          name={titleName}
          component={MultilingualTextFieldAdapter}
          label={`${I18n.t('administration.tableOfThematics.thematicTitle')} ${upperCaseLocale}`}
        />
        <Field
          key={`${descriptionName}-${editLocale}`}
          editLocale={editLocale}
          name={descriptionName}
          component={MultilingualTextFieldAdapter}
          label={`${I18n.t('administration.tableOfThematics.bannerSubtitleLabel')} ${upperCaseLocale}`}
        />
        <Field
          deleteTooltip={deleteThematicImageTooltip}
          name={imageName}
          component={FileUploaderFieldAdapter}
          label={I18n.t('administration.tableOfThematics.bannerImagePickerLabel')}
        />
        <div className="label-indication">
          <Translate value="administration.landingPage.header.headerDescription" />
        </div>
        <div className="title">{I18n.t('administration.tableOfThematics.moduleTypeLabel')}</div>
        <Field
          name={messageViewOverrideName}
          component={SelectFieldAdapter}
          isSearchable={false}
          // label={I18n.t('administration.tableOfThematics.moduleTypeLabel')}
          options={modulesTranslationKeys.map(key => ({ value: key, label: I18n.t(`administration.modules.${key}`) }))}
        />
        {theme &&
          theme.numPosts > 0 && (
            <p className="warning-message" role="alert">
              <Translate value="administration.postsExistsWarning" />
            </p>
          )}
        {theme && theme.messageViewOverride && theme.messageViewOverride.value !== MESSAGE_VIEW.noModule ? (
          <React.Fragment>
            <div className="margin-l" />
            <Helper
              label={I18n.t('administration.instructions')}
              helperUrl={IMG_HELPER_BM}
              helperText={I18n.t('administration.tableOfThematics.instructionHeader')}
              classname="title"
            />
            <Field
              key={`${announcementTitleName}-${editLocale}`}
              editLocale={editLocale}
              name={announcementTitleName}
              label={`${I18n.t('administration.tableOfThematics.sectionTitleLabel')} ${upperCaseLocale}`}
              component={MultilingualTextFieldAdapter}
              required
            />
            <Field
              key={`${announcementBodyName}-${editLocale}`}
              editLocale={editLocale}
              name={announcementBodyName}
              label={`${I18n.t('administration.tableOfThematics.instructionLabel')} ${upperCaseLocale}`}
              withAttachmentButton
              component={MultilingualRichTextFieldAdapter}
            />
            {theme && theme.messageViewOverride && theme.messageViewOverride.value !== MESSAGE_VIEW.voteSession ? (
              <React.Fragment>
                <div className="margin-l" />
                <Helper
                  label={I18n.t('administration.summary')}
                  helperUrl={IMG_HELPER_BM}
                  helperText={I18n.t('administration.tableOfThematics.summaryHeader')}
                  classname="title"
                />
                <Field
                  key={`${announcementSummaryName}-${editLocale}`}
                  editLocale={editLocale}
                  name={announcementSummaryName}
                  label={`${I18n.t('administration.tableOfThematics.summaryLabel')} ${upperCaseLocale}`}
                  withAttachmentButton
                  component={MultilingualRichTextFieldAdapter}
                />
              </React.Fragment>
            ) : null}
          </React.Fragment>
        ) : null}
        {theme ? this.addVoteModuleLink(theme) : null}
        {theme && theme.messageViewOverride && theme.messageViewOverride.value === MESSAGE_VIEW.survey ? (
          <SurveyFields editLocale={editLocale} fieldPrefix={name} />
        ) : null}
        {theme && theme.messageViewOverride && theme.messageViewOverride.value === MESSAGE_VIEW.messageColumns ? (
          <MultiColumnsFields editLocale={editLocale} fieldPrefix={name} nbColumnsInForm={nbColumnsInForm} />
        ) : null}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  slug: state.debate.debateData.slug
});

export default connect(mapStateToProps)(ConfigureThematicForm);