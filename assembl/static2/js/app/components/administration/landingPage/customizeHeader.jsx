// @flow
import React from 'react';
import { connect } from 'react-redux';
import { type ApolloClient, graphql, compose, withApollo } from 'react-apollo';
import { I18n } from 'react-redux-i18n';
import { Field } from 'react-final-form';
import setFieldTouched from 'final-form-set-field-touched'
import SectionTitle from '../../administration/sectionTitle';
import Helper from '../../common/helper';
import { load, postLoadFormat } from './header/load';
import { save, createMutationsPromises } from './header/save';
import LoadSaveReinitializeForm from '../../form/LoadSaveReinitializeForm';
import FileUploaderFieldAdapter from '../../form/fileUploaderFieldAdapter';
import DatePickerFieldAdapter from '../../form/datePickerFieldAdapter';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import MultilingualRichTextFieldAdapter from '../../form/multilingualRichTextFieldAdapter';
import AdminForm from '../../form/adminForm';
import Loader from '../../common/loader';
import { type DateTime } from '../../form/types.flow';
import { validStartDate, validEndDate, validateDatePicker } from './header/validate';
import DiscussionQuery from '../../../graphql/DiscussionQuery.graphql';
import { convertISO8601StringToDate } from '../../../utils/globalFunctions';
import manageErrorAndLoading from '../../common/manageErrorAndLoading'; 

type Props = {
  client: ApolloClient,
  editLocale: string,
  lang: string,
  data: {
    discussion: {
      startDate: string,
      endDate: string
    }
  }
};

type State = {
  startDate: DateTime,
  endDate: DateTime,
  startDateConflict: boolean,
  endDateConflict: boolean
};

const loading = <Loader />;

export const DumbCustomizeHeader = ({ client, editLocale, lang, data: { discussion: { startDate, endDate } } }: Props) => {

  const state: State = {
    startDate: convertISO8601StringToDate(startDate),
    endDate: convertISO8601StringToDate(endDate),
    startDateConflict: false,
    endDateConflict: false
  };

  const onStartChange = (e: DateTime): void => {
    state.startDate = e;
    if (!validStartDate(state.startDate, state.endDate)) {
      state.startDateConflict = true;
    }
    else {
      state.startDateConflict = false;
    }
  };

  const onEndChange = (e: DateTime): void => {
    state.endDate = e;
    if (!validEndDate(state.startDate, state.endDate)) {
      state.endDateConflict = true;
    }
    else {
      state.endDateConflict = false;
    }
  }

  return (
  <div className="admin-box">
    <SectionTitle title={I18n.t('administration.landingPage.header.title')} annotation={I18n.t('administration.annotation')} />
    <LoadSaveReinitializeForm
      load={fetchPolicy => load(client, editLocale, fetchPolicy)}
      loading={loading}
      postLoadFormat={postLoadFormat}
      createMutationsPromises={createMutationsPromises(client)}
      save={save}
      mutators={{ setFieldTouched }}
      validate={validateDatePicker}
      render={({ handleSubmit, pristine, submitting, form }) => (
        <div className="admin-content">
          <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
            <div className="form-container">
              <Helper
                classname="admin-paragraph"
                label={I18n.t('administration.landingPage.header.helper')}
                helperUrl={'/static2/img/helpers/landing_page_admin/header.png'}
                helperText={I18n.t('administration.helpers.landingPage.header')}
              />
              <Field
                editLocale={editLocale}
                name="headerTitle"
                component={MultilingualTextFieldAdapter}
                label={I18n.t('administration.landingPage.header.titleLabel')}
                required
              />
              <Field
                editLocale={editLocale}
                withAttachmentButton={false}
                name="headerSubtitle"
                component={MultilingualRichTextFieldAdapter}
                label={I18n.t('administration.landingPage.header.subtitleLabel')}
                required
              />
              <Field
                editLocale={editLocale}
                name="headerButtonLabel"
                component={MultilingualTextFieldAdapter}
                label={I18n.t('administration.landingPage.header.buttonLabel')}
                required={false}
              />
              <Field
                name="headerImage"
                component={FileUploaderFieldAdapter}
                label={I18n.t('administration.landingPage.header.headerImage')}
              />
              <Field
                name="headerLogoImage"
                component={FileUploaderFieldAdapter}
                label={I18n.t('administration.landingPage.header.logoDescription')}
              />
              <div className="control-label">
                <span>{I18n.t('administration.landingPage.header.dateDescription')}</span>
              </div>
              <Field
                name="headerStartDate"
                component={DatePickerFieldAdapter}
                picker={{ pickerType: I18n.t('administration.landingPage.header.startDate') }}
                editLocale={editLocale}
                placeHolder={I18n.t('administration.landingPage.header.timePlaceholder')}
                showTime={false}
                hasConflictingDate={state.startDateConflict}
                onDateChange={onStartChange}
                form={form}
              />
              <Field
                name="headerEndDate"
                component={DatePickerFieldAdapter}
                picker={{ pickerType: I18n.t('administration.landingPage.header.endDate') }}
                editLocale={editLocale}
                placeHolder={I18n.t('administration.landingPage.header.timePlaceholder')}
                showTime={false}
                hasConflictingDate={state.endDateConflict}
                onChange={onEndChange}
                form={form}
              />
            </div>
          </AdminForm>
        </div>
      )}
    />
  </div>
)};

const mapStateToProps = ({ admin: { editLocale } }, i18n) => ({
  editLocale: editLocale,
  lang: i18n.locale
});

export default compose(
  connect(mapStateToProps),
  graphql(DiscussionQuery, {
    options: ({ editLocale }) => ({
      variables: {
        lang: editLocale,
        nextView: null
      }
    })
  }),
  manageErrorAndLoading({ displayLoader: true }),
  withApollo)(DumbCustomizeHeader);