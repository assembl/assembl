// @flow
import React from 'react';
import { Field } from 'react-final-form';
import { I18n, Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import arrayMutators from 'final-form-arrays';
import { type ApolloClient } from 'react-apollo';

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

const loading = <Loader />;

type Props = {
  client: ApolloClient,
  editLocale: string,
  lang: string
};

class TimelineFields extends React.Component<Props> {
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
                  renderBody={phase => (
                    <React.Fragment>
                      <div className="admin-paragraph">Choisissez les dates de début et de fin de la phase</div>
                      <Field
                        name={`phases[${phase.index}].start`}
                        component={DatePickerFieldAdapter}
                        picker={{ pickerType: I18n.t('administration.landingPage.header.startDate') }}
                        editLocale={editLocale}
                        placeHolder={I18n.t('administration.landingPage.header.timePlaceholder')}
                        showTime={false}
                        // hasConflictingDate={this.state.startDateConflict}
                        // onDateChange={this.onStartChange}
                        form={form}
                        dateFormat="LL"
                      />
                      <Field
                        name={`phases[${phase.index}].end`}
                        component={DatePickerFieldAdapter}
                        picker={{ pickerType: I18n.t('administration.landingPage.header.endDate') }}
                        editLocale={editLocale}
                        placeHolder={I18n.t('administration.landingPage.header.timePlaceholder')}
                        showTime={false}
                        // hasConflictingDate={this.state.endDateConflict}
                        // onDateChange={this.onEndChange}
                        form={form}
                        dateFormat="LL"
                      />
                      <div className="admin-paragraph">Télécharger une image pour le bandeau timeline de la page accueil</div>
                      <Field
                        name={`phases[${phase.index}].image`}
                        component={FileUploaderFieldAdapter}
                        label={I18n.t('administration.landingPage.header.logoDescription')}
                      />
                      <div className="admin-paragraph">Écrivez une description pour votre phase</div>
                      <Field
                        editLocale={editLocale}
                        withAttachmentButton={false}
                        name={`phases[${phase.index}].description`}
                        component={MultilingualTextFieldAdapter}
                        label={I18n.t('administration.landingPage.header.subtitleLabel')}
                        required
                      />
                    </React.Fragment>
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

const mapStateToProps = (state) => {
  const { phasesById } = state.admin.timeline;
  const filteredPhases = phasesById.sortBy(phase => phase.get('order')).filter(phase => !phase.get('_toDelete'));
  const filteredPhasesId = filteredPhases.keySeq().toJS();
  return {
    editLocale: state.admin.editLocale,
    lang: state.i18n.locale,
    phases: filteredPhasesId
  };
};

export default connect(mapStateToProps)(TimelineFields);