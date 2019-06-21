// @flow
import React from 'react';
import { connect } from 'react-redux';
import { type ApolloClient, compose, withApollo } from 'react-apollo';
import { I18n, Translate } from 'react-redux-i18n';
import arrayMutators from 'final-form-arrays';
import { Field, FormSpy } from 'react-final-form';
import classnames from 'classnames';
import Loader from '../../../common/loader';
import LoadSaveReinitializeForm from '../../../form/LoadSaveReinitializeForm';
import AdminForm from '../../../../components/form/adminForm';
import CheckboxFieldAdapter from '../../../../components/form/checkboxFieldAdapter';
import CheckboxListFieldAdapter from '../../../form/checkboxListFieldAdapter';
import SectionTitle from '../../../../components/administration/sectionTitle';
import { load, postLoadFormat } from './load';
import { save, createMutationsPromises } from './save';
import validate from './validate';
import TextFieldAdapter from '../../../form/textFieldAdapter';
import { slugAllowedCharacters } from '../../../../constants';
import OnChangeFieldSetField from './OnChangeFieldSetField';
import type { DiscussionPreferencesFormValues } from './types.flow';

type Props = {
  client: ApolloClient,
  locale: string
};

type State = {
  slugIsInvalid: boolean,
  translationServiceMissing: boolean
};

type FormState = {
  values: DiscussionPreferencesFormValues
};

const loading = <Loader />;

class DiscussionPreferencesForm extends React.Component<Props, State> {
  state = {
    slugIsInvalid: false,
    translationServiceMissing: false
  };

  checkSlugValidity = (slug: ?string) => {
    if (slug) {
      this.setState({ slugIsInvalid: !slug.match(slugAllowedCharacters) });
    }
  };

  render() {
    const { client, locale } = this.props;
    const { slugIsInvalid, translationServiceMissing } = this.state;
    return (
      <div className="discussion-admin admin-box admin-content">
        <SectionTitle title={I18n.t('administration.menu.preferences')} annotation="" />
        <LoadSaveReinitializeForm
          load={(fetchPolicy: FetchPolicy) => load(client, fetchPolicy, locale)}
          loading={loading}
          postLoadFormat={postLoadFormat}
          createMutationsPromises={createMutationsPromises(client)}
          save={save}
          validate={validate}
          withWarningModal
          warningValues={['slug']}
          warningMessageKey="administration.slugWarning"
          mutators={{
            ...arrayMutators
          }}
          render={({ handleSubmit, pristine, submitting, values }) => (
            <div className="admin-content">
              <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting} disableSave={slugIsInvalid}>
                <FormSpy
                  subscription={{ values: true }}
                  // $FlowFixMe ignore undefined state
                  onChange={(state: FormState) => {
                    const { values: { withSemanticAnalysis, withTranslation } } = state;
                    this.setState({ translationServiceMissing: withSemanticAnalysis && !withTranslation });
                  }}
                />
                <div className="form-container">
                  <div className="title">
                    <Translate value="administration.informationOfTheDebate" />
                  </div>
                  <Field
                    validate={this.checkSlugValidity}
                    component={TextFieldAdapter}
                    name="slug"
                    label={I18n.t('administration.discussionSlug')}
                    className={classnames({ warning: slugIsInvalid })}
                  />
                  {slugIsInvalid ? (
                    <div className="warning-label">
                      <Translate value="administration.invalidSlug" />
                    </div>
                  ) : null}
                  <div className="separator" />
                  <div className="title">
                    <Translate value="administration.languageChoice" />
                  </div>
                  <div className="margin-l" />
                  <Field component={CheckboxListFieldAdapter} name="languages" />
                  <div className="separator" />
                  <div className="title">
                    <Translate value="administration.moderation" />
                  </div>
                  <Field
                    component={CheckboxFieldAdapter}
                    name="withModeration"
                    isChecked={values.withModeration}
                    label={I18n.t('administration.activateModeration')}
                    type="checkbox"
                  />
                  <div className="separator" />
                  <div className="title">
                    <Translate value="administration.translationService.title" />
                  </div>
                  {translationServiceMissing ? (
                    <div className="warning-label">
                      <Translate value="administration.translationService.description" />
                    </div>
                  ) : null}
                  <Field
                    component={CheckboxFieldAdapter}
                    name="withTranslation"
                    isChecked
                    label={I18n.t('administration.translationService.activate')}
                    type="checkbox"
                  />
                  <div className="separator" />
                  <OnChangeFieldSetField field="withSemanticAnalysis" becomes set="withTranslation" to />
                  <div className="title">
                    <Translate value="administration.semanticAnalysis.title" />
                  </div>
                  <div className="label-indication">
                    <Translate value="administration.semanticAnalysis.description" />
                  </div>
                  <Field
                    component={CheckboxFieldAdapter}
                    name="withSemanticAnalysis"
                    isChecked
                    label={I18n.t('administration.semanticAnalysis.activate')}
                    type="checkbox"
                  />
                </div>
              </AdminForm>
            </div>
          )}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  locale: state.i18n.locale
});

export { DiscussionPreferencesForm };

export default compose(connect(mapStateToProps), withApollo)(DiscussionPreferencesForm);