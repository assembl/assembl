// @flow
import React from 'react';
import { Field } from 'react-final-form';
import { I18n, Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import arrayMutators from 'final-form-arrays';
import { type ApolloClient, graphql, compose, withApollo } from 'react-apollo';

import TimelineQuery from '../../../../graphql/Timeline.graphql';
import TabbedContent from '../../../common/tabbedContent';
import SectionTitle from '../../../../components/administration/sectionTitle';
import AdminForm from '../../../../components/form/adminForm';
import LoadSaveReinitializeForm from '../../../../components/form/LoadSaveReinitializeForm';
import { load, postLoadFormat } from './load';
import Loader from '../../../common/loader';
import FieldArrayWithActions from '../../../form/fieldArrayWithActions';
import MultilingualTextFieldAdapter from '../../../form/multilingualTextFieldAdapter';
import DatePickerFieldAdapter from '../../../form/datePickerFieldAdapter';
import FileUploaderFieldAdapter from '../../../form/fileUploaderFieldAdapter';
import { deleteResourceTooltip, createResourceTooltip, phaseTooltip } from '../../../common/tooltips';
import { convertISO8601StringToDate } from '../../../../utils/globalFunctions';
import { validStartDate, validEndDate } from '../../landingPage/header/validate';
import manageErrorAndLoading from '../../../common/manageErrorAndLoading';

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

  onStartChange = (newStart: moment$Moment, index: number) => {
    const startDateConflict = validStartDate(newStart, this.state.phases[index].end);
    const updatedPhases = [...this.state.phases];
    updatedPhases[index].start = newStart;
    this.setState({
      phases: updatedPhases,
      startDateConflict: startDateConflict
    });
  };

  onEndChange = (newEnd: moment$Moment, index: number) => {
    const endDateConflict = validEndDate(newEnd, this.state.phases[index].end);
    const updatedPhases = [...this.state.phases];
    updatedPhases[index].end = newEnd;
    this.setState({
      phases: updatedPhases,
      startDateConflict: endDateConflict
    });
  };

  render() {
    const { client, editLocale, lang } = this.props;
    return (
      <div className="discussion-admin admin-box admin-content">
        <SectionTitle
          title={I18n.t('administration.discussion.5')}
          annotation={I18n.t('administration.timelineAdmin.annotation')}
        />
        <Translate value="administration.timelineAdmin.instruction1" className="admin-instruction" />
        <LoadSaveReinitializeForm
          load={(fetchPolicy: FetchPolicy) => load(client, fetchPolicy, lang)}
          loading={loading}
          postLoadFormat={postLoadFormat}
          createMutationsPromises={() => {}}
          save={() => {}}
          validate={() => {}}
          mutators={{
            ...arrayMutators
          }}
          render={({ values, handleSubmit, pristine, submitting, form }) => (
            <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
              <div className="form-container phase-creation-section">
                <FieldArrayWithActions
                  name="phases"
                  withSeparators={false}
                  titleMsgId="administration.timelineAdmin.phase"
                  tooltips={{
                    addTooltip: createResourceTooltip,
                    deleteTooltip: deleteResourceTooltip
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
              <div className="section-test">
                <div className="phase-configuration-section">
                  <Translate value="administration.timelineAdmin.instruction2" className="admin-instruction" />
                </div>
                <TabbedContent
                  type="phase"
                  divClassName="admin-content"
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
                    <div className="discussion-admin admin-box admin-content">
                      <Translate value="administration.timelineAdmin.instruction1" className="admin-instruction" />
                      <Field
                        name={`phases[${phase.index}].start`}
                        component={DatePickerFieldAdapter}
                        picker={{ pickerType: I18n.t('administration.landingPage.header.startDate') }}
                        editLocale={editLocale}
                        placeHolder={I18n.t('administration.landingPage.header.timePlaceholder')}
                        showTime={false}
                        hasConflictingDate={false}
                        onDateChange={e => this.onStartChange(e, index)}
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
                        onDateChange={e => this.onEndChange(e, index)}
                        form={form}
                        dateFormat="LL"
                      />
                      <Translate value="administration.timelineAdmin.instruction1" className="admin-instruction" />
                      <Field
                        name={`phases[${phase.index}].image`}
                        component={FileUploaderFieldAdapter}
                        label={I18n.t('administration.landingPage.header.logoDescription')}
                      />
                      <Translate value="administration.timelineAdmin.instruction1" className="admin-instruction" />
                      <Field
                        editLocale={editLocale}
                        withAttachmentButton={false}
                        name={`phases[${phase.index}].description`}
                        component={MultilingualTextFieldAdapter}
                        label={I18n.t('administration.landingPage.header.subtitleLabel')}
                        required
                      />
                    </div>
                  )}
                />
              </div>
            </AdminForm>
          )}
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