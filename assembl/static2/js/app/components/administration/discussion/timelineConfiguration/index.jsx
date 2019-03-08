// @flow
import React from 'react';
import { Field } from 'react-final-form';
import { I18n, Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import arrayMutators from 'final-form-arrays';
import { type ApolloClient, graphql, compose, withApollo } from 'react-apollo';
import isEqualWith from 'lodash/isEqualWith';

import TimelineQuery from '../../../../graphql/Timeline.graphql';
import TabbedContent from '../../../common/tabbedContent';
import SectionTitle from '../../../../components/administration/sectionTitle';
import AdminForm from '../../../../components/form/adminForm';
import LoadSaveReinitializeForm from '../../../../components/form/LoadSaveReinitializeForm';
import { load, postLoadFormat } from './load';
import { createMutationsPromises, save } from './save';
import Loader from '../../../common/loader';
import FieldArrayWithActions from '../../../form/fieldArrayWithActions';
import MultilingualTextFieldAdapter from '../../../form/multilingualTextFieldAdapter';
import DatePickerFieldAdapter from '../../../form/datePickerFieldAdapter';
import FileUploaderFieldAdapter from '../../../form/fileUploaderFieldAdapter';
import { deletePhaseTooltip, addPhaseTooltip, phaseTooltip } from '../../../common/tooltips';
import { convertISO8601StringToDate } from '../../../../utils/globalFunctions';
import { validStartDate, validEndDate } from '../../landingPage/header/validate';
import manageErrorAndLoading from '../../../common/manageErrorAndLoading';
import { compareEditorState } from '../../../form/utils';

import Helper from '../../../common/helper';

const loading = <Loader />;

type Props = {
  client: ApolloClient,
  editLocale: string,
  lang: string
};

type State = {
  phases: Array<Object>,
  startDateConflict: boolean,
  endDateConflict: boolean
};

class TimelineFields extends React.Component<Props, State> {
  static getDerivedStateFromProps(props) {
    const phases = props.phases.map(({ start, end }) => ({
      start: start ? convertISO8601StringToDate(start) : null,
      end: end ? convertISO8601StringToDate(end) : null
    }));
    return {
      phases: phases,
      startDateConflict: false,
      endDateConflict: false
    };
  }

  state = {
    phases: [],
    startDateConflict: false,
    endDateConflict: false
  };

  onStartChange = (newStart: moment$Moment, index: number, values) => {
    const startDateConflict = validStartDate(newStart, values.phases[index].end);
    const updatedPhases = [...values.phases];
    updatedPhases[index].start = newStart;
    this.setState({
      phases: updatedPhases,
      startDateConflict: startDateConflict
    });
  };

  onEndChange = (newEnd: moment$Moment, index: number, values) => {
    const endDateConflict = validEndDate(values.phases[index].start, newEnd);
    const updatedPhases = [...values.phases];
    updatedPhases[index].end = newEnd;
    this.setState({
      phases: updatedPhases,
      endDateConflict: endDateConflict
    });
  };

  render() {
    const { client, editLocale, lang } = this.props;
    return (
      <div className="timeline-admin admin-box">
        <SectionTitle
          title={I18n.t('administration.discussion.5')}
          annotation={I18n.t('administration.timelineAdmin.annotation')}
        />
        <LoadSaveReinitializeForm
          load={(fetchPolicy: FetchPolicy) => load(client, fetchPolicy, lang)}
          loading={loading}
          postLoadFormat={postLoadFormat}
          createMutationsPromises={createMutationsPromises(client, lang)}
          save={save}
          validate={() => {}}
          mutators={{
            ...arrayMutators
          }}
          render={({ values, handleSubmit, submitting, initialValues }) => {
            const pristine = isEqualWith(initialValues, values, compareEditorState);
            return (
              <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
                <Translate value="administration.timelineAdmin.instruction1" className="admin-instruction" />
                <div className="phases-creation">
                  <FieldArrayWithActions
                    name="phases"
                    withSeparators={false}
                    titleMsgId="administration.timelineAdmin.phase"
                    tooltips={{
                      addTooltip: addPhaseTooltip,
                      deleteTooltip: deletePhaseTooltip
                    }}
                    renderFields={({ name }) => (
                      <React.Fragment>
                        <Field
                          key={`phase-title-form-${name}`}
                          editLocale={editLocale}
                          name={`${name}.title`}
                          component={MultilingualTextFieldAdapter}
                          label={`${I18n.t('administration.timelineAdmin.phaseLabel')} ${editLocale.toUpperCase()}`}
                          required
                        />
                      </React.Fragment>
                    )}
                  />
                </div>
                <Translate value="administration.timelineAdmin.instruction2" className="admin-instruction" />
                <div className="phase-configuration-section">
                  <TabbedContent
                    type="phase"
                    divClassName=""
                    tabTitleMsgId="administration.timelineAdmin.phase"
                    tabs={values.phases.map((phase, index) => {
                      const tabTitle = `${I18n.t('administration.timelineAdmin.phase', { count: index + 1 })}`;
                      return {
                        id: phase.id,
                        title: tabTitle,
                        description: phase.description,
                        start: phase.start,
                        end: phase.end,
                        index: index
                      };
                    })}
                    renderTooltip={phaseTooltip}
                    renderBody={(phase, index) => (
                      <div className="form-container">
                        <Translate value="administration.timelineAdmin.instruction3" className="admin-paragraph" />
                        <Field
                          name={`phases[${phase.index}].start`}
                          component={DatePickerFieldAdapter}
                          picker={{ pickerType: I18n.t('administration.landingPage.header.startDate') }}
                          editLocale={editLocale}
                          placeHolder={I18n.t('administration.landingPage.header.timePlaceholder')}
                          showTime={false}
                          hasConflictingDate={false}
                          onDateChange={e => this.onStartChange(e, index, values)}
                          dateFormat="LL"
                        />
                        <Field
                          name={`phases[${phase.index}].end`}
                          component={DatePickerFieldAdapter}
                          picker={{ pickerType: I18n.t('administration.landingPage.header.endDate') }}
                          editLocale={editLocale}
                          placeHolder={I18n.t('administration.landingPage.header.timePlaceholder')}
                          showTime={false}
                          hasConflictingDate={false}
                          onDateChange={e => this.onEndChange(e, index, values)}
                          dateFormat="LL"
                        />
                        <Helper
                          label={I18n.t('administration.timelineAdmin.instruction4')}
                          helperUrl="/static2/img/helpers/landing_page_admin/timeline_phase.png"
                          helperText={I18n.t('administration.helpers.timelinePhases')}
                          classname="title"
                        />
                        <Field
                          className="admin-content"
                          name={`phases[${phase.index}].image`}
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
                          editLocale={editLocale}
                          withAttachmentButton={false}
                          name={`phases[${phase.index}].description`}
                          component={MultilingualTextFieldAdapter}
                          label={I18n.t('administration.timelineAdmin.descriptionPhaseLabel')}
                          required
                        />
                      </div>
                    )}
                  />
                </div>
              </AdminForm>
            );
          }}
        />
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