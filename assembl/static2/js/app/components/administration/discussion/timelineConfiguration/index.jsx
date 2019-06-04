// @flow
import React from 'react';
import { Field } from 'react-final-form';
import { I18n, Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import arrayMutators from 'final-form-arrays';
import setFieldTouched from 'final-form-set-field-touched';
import { type ApolloClient, graphql, compose, withApollo } from 'react-apollo';
import isEqualWith from 'lodash/isEqualWith';

import TimelineQuery from '../../../../graphql/Timeline.graphql';
import SectionTitle from '../../../../components/administration/sectionTitle';
import AdminForm from '../../../../components/form/adminForm';
import LoadSaveReinitializeForm from '../../../../components/form/LoadSaveReinitializeForm';
import { load, postLoadFormat } from './load';
import { createMutationsPromises, save } from './save';
import validate from './validate';
import Loader from '../../../common/loader';
import FieldArrayWithActions from '../../../form/fieldArrayWithActions';
import MultilingualTextFieldAdapter from '../../../form/multilingualTextFieldAdapter';
import DatePickerFieldAdapter from '../../../form/datePickerFieldAdapter';
import FileUploaderFieldAdapter from '../../../form/fileUploaderFieldAdapter';
import { deletePhaseTooltip, addPhaseTooltip } from '../../../common/tooltips';
import manageErrorAndLoading from '../../../common/manageErrorAndLoading';
import { compareEditorState } from '../../../form/utils';

import Helper from '../../../common/helper';

const loading = <Loader />;

type Props = {
  client: ApolloClient,
  editLocale: string,
  lang: string
};

const hasConflictingDates = (phase, phases) => {
  const start = phase.start ? phase.start.time : null;
  const end = phase.end ? phase.end.time : null;
  const id = phase.id;
  const phaseIndex = phases.findIndex(p => p.id === id);
  const previousPhase = phases[phaseIndex - 1];
  const nextPhase = phases[phaseIndex + 1];
  const res =
    (start && previousPhase && previousPhase.end && start.isBefore(previousPhase.end.time)) ||
    (end && nextPhase && nextPhase.start && end.isAfter(nextPhase.start.time));
  return res || false;
};

class TimelineFields extends React.Component<Props> {
  render() {
    const { client, editLocale, lang } = this.props;
    return (
      <div className="timeline-admin admin-box">
        <SectionTitle
          title={I18n.t('administration.discussion.5')}
          annotation={I18n.t('administration.timelineAdmin.annotation')}
        />
        <div className="admin-content">
          <LoadSaveReinitializeForm
            load={(fetchPolicy: FetchPolicy) => load(client, fetchPolicy, lang)}
            loading={loading}
            postLoadFormat={postLoadFormat}
            createMutationsPromises={createMutationsPromises(client, lang)}
            save={save}
            validate={validate}
            mutators={{
              ...arrayMutators,
              setFieldTouched: setFieldTouched
            }}
            render={({ values, handleSubmit, submitting, initialValues, form, errors }) => {
              const pristine = isEqualWith(initialValues, values, compareEditorState);
              return (
                <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
                  <p>
                    <Translate value="administration.timelineAdmin.instruction1" className="admin-instruction" />
                  </p>
                  <div className="panel-group">
                    <FieldArrayWithActions
                      minItems={1}
                      errors={errors.phases}
                      usePanels
                      confirmDeletion
                      name="phases"
                      withSeparators={false}
                      titleMsgId="administration.timelineAdmin.phase"
                      renderTitleMsg={({ titleMsgId, idx, fieldValue }) => {
                        // $FlowFixMe
                        const title = fieldValue && fieldValue.title ? fieldValue.title[editLocale] || '' : '';
                        return (
                          <span>
                            <Translate value={titleMsgId} count={idx + 1} /> &mdash; {title}
                          </span>
                        );
                      }}
                      tooltips={{
                        addTooltip: addPhaseTooltip,
                        deleteTooltip: deletePhaseTooltip
                      }}
                      renderFields={({ name, idx }) => {
                        const phase = values.phases[idx];
                        if (!phase) {
                          // when we use the delete action, it tries to still render the deleted element
                          return null;
                        }
                        const phaseNumber = idx + 1;
                        const startDatePickerPlaceholder = I18n.t('administration.timelineAdmin.selectStart', {
                          count: phaseNumber
                        });
                        const endDatePickerPlaceholder = I18n.t('administration.timelineAdmin.selectEnd', {
                          count: phaseNumber
                        });
                        const conflictingDates = hasConflictingDates(phase, values.phases);
                        return (
                          <div key={phase.id}>
                            <Field
                              key={`phase-title-form-${name}`}
                              editLocale={editLocale}
                              name={`${name}.title`}
                              component={MultilingualTextFieldAdapter}
                              label={`${I18n.t('administration.timelineAdmin.phaseLabel')} ${editLocale.toUpperCase()}`}
                              required
                            />
                            <Translate value="administration.timelineAdmin.instruction3" className="admin-paragraph" />
                            <Field
                              required
                              name={`${name}.start`}
                              component={DatePickerFieldAdapter}
                              picker={{ pickerType: I18n.t('administration.landingPage.header.startDate') }}
                              editLocale={editLocale}
                              placeHolder={startDatePickerPlaceholder}
                              showTime={false}
                              dateFormat="LL"
                              form={form}
                              hasConflictingDates={conflictingDates}
                            />
                            <Field
                              required
                              name={`${name}.end`}
                              component={DatePickerFieldAdapter}
                              picker={{ pickerType: I18n.t('administration.landingPage.header.endDate') }}
                              editLocale={editLocale}
                              placeHolder={endDatePickerPlaceholder}
                              showTime={false}
                              dateFormat="LL"
                              form={form}
                              hasConflictingDates={conflictingDates}
                            />
                            {conflictingDates && (
                              <div className="warning-message">
                                <Translate value="administration.timelineAdmin.warningLabel" />
                              </div>
                            )}
                            <Helper
                              label={I18n.t('administration.timelineAdmin.instruction4')}
                              helperUrl="/static2/img/helpers/landing_page_admin/timeline_phase.png"
                              helperText={I18n.t('administration.helpers.timelinePhases')}
                              classname="title"
                            />
                            <Field
                              className="admin-content"
                              name={`${name}.image`}
                              component={FileUploaderFieldAdapter}
                              label={I18n.t('administration.landingPage.timeline.imageDescription')}
                            />
                            <Helper
                              label={I18n.t('administration.timelineAdmin.instruction5')}
                              helperUrl="/static2/img/helpers/landing_page_admin/timeline_phase.png"
                              helperText={I18n.t('administration.helpers.timelinePhases')}
                              classname="title"
                            />
                            <Field
                              className="form-control"
                              componentClass="textarea"
                              rows={5}
                              editLocale={editLocale}
                              name={`${name}.description`}
                              component={MultilingualTextFieldAdapter}
                              label={I18n.t('administration.timelineAdmin.descriptionPhaseLabel')}
                              required
                            />
                          </div>
                        );
                      }}
                    />
                  </div>
                </AdminForm>
              );
            }}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  editLocale: state.admin.editLocale,
  lang: state.i18n.locale
});

export default compose(
  connect(mapStateToProps),
  graphql(TimelineQuery, {
    options: ({ editLocale }) => ({
      variables: {
        lang: editLocale
      }
    })
  }),
  manageErrorAndLoading({ displayLoader: true }),
  withApollo
)(TimelineFields);