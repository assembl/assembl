// @flow
import React from 'react';
import { Field } from 'react-final-form';
import { I18n, Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import arrayMutators from 'final-form-arrays';

import SectionTitle from '../../../../components/administration/sectionTitle';
import AdminForm from '../../../../components/form/adminForm';
import LoadSaveReinitializeForm from '../../../../components/form/LoadSaveReinitializeForm';
import { load, postLoadFormat } from './load';
import Loader from '../../../common/loader';
import FieldArrayWithActions from '../../../form/fieldArrayWithActions';
import MultilingualTextFieldAdapter from '../../../form/multilingualTextFieldAdapter';
import { deleteResourceTooltip, createResourceTooltip } from '../../../common/tooltips';

const loading = <Loader />;

type Props = {
  editLocale: string
};

const TimelineFields = ({ client, editLocale, lang }: Props) => (
  <div className="discussion-admin admin-box admin-content">
    <SectionTitle title={I18n.t('administration.discussion.5')} annotation={I18n.t('administration.timelineAdmin.annotation')} />
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
      render={({ handleSubmit, pristine, submitting }) => (
        <div className="admin-content">
          <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
            <div className="form-container phase-creation-section">
              <FieldArrayWithActions
                withSeparators={false}
                name="phases"
                titleMsgId={I18n.t('administration.timelineAdmin.phase')}
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
          </AdminForm>
        </div>
      )}
    />
    <div className="phase-configuration-section">
      <Translate value="administration.timelineAdmin.instruction2" className="admin-instruction" />
    </div>
  </div>
);

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