// @flow
import * as React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { form, FormGroup, FormControl, Button } from 'react-bootstrap';
import { Link } from 'react-router';
import * as lodashGet from 'lodash/get';
// Route helper import
import { browserHistory } from '../../../app/router';

import { signupAction } from '../../actions/authenticationActions';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { get, getContextual } from '../../utils/routeMap';
import inputHandler from '../../utils/inputHandler';
import { displayAlert, displayCustomModal } from '../../utils/utilityManager';
import FormControlWithLabel from '../common/formControlWithLabel';
import manageErrorAndLoading from '../../components/common/manageErrorAndLoading';
import mergeLoadingAndError from '../../components/common/mergeLoadingAndError';
import TabsConditionQuery from '../../graphql/TabsConditionQuery.graphql';
import TextFieldsQuery from '../../graphql/TextFields.graphql';
import LegalContentsQuery from '../../graphql/LegalContents.graphql';
import LegalForm from './legalForm';
import SignupCheckbox from './signupCheckbox';
import BackButton from '../../../app/components/debate/common/backButton';

type Props = {
  hasTermsAndConditions: boolean,
  hasPrivacyPolicy: boolean,
  hasUserGuidelines: boolean,
  signUp: Function,
  auth: Object,
  textFields: Array<ConfigurableField>,
  privacyPolicyText: string,
  termsAndConditionsText: string,
  userGuidelinesText: string
};

type State = {
  privacyPolicyIsChecked: boolean,
  termsAndConditionsIsChecked: boolean,
  userGuidelinesIsChecked: boolean
};

class SignupForm extends React.Component<Props, State> {
  signupHandler: (SyntheticEvent<>) => void;

  handleInput: (SyntheticInputEvent<HTMLInputElement>) => void;

  toggleCheck: () => void;

  handleAcceptButton: () => void;

  state = {
    privacyPolicyIsChecked: false,
    termsAndConditionsIsChecked: false,
    userGuidelinesIsChecked: false
  };

  componentWillReceiveProps(nextProps) {
    const { auth } = nextProps;
    const { success, reason } = auth.signupSuccess;
    let msg;
    if (success === false && reason) {
      switch (reason) {
      case 'password': {
        msg = I18n.t('login.incorrectPassword');
        break;
      }
      case 'general': {
        const firstError = auth.signupSuccess.data[0];
        msg = firstError.message;
        break;
      }
      default: {
        msg = I18n.t('login.somethingWentWrong');
        break;
      }
      }
      displayAlert('danger', msg, true);
    }
  }

  handleInput = (e) => {
    inputHandler(this, e);
  };

  handleSelectChange = (e) => {
    const name = e.target.name;
    const value = e.target.value ? [e.target.value] : null;
    this.setState(() => ({ [name]: value }));
  };

  signupHandler = (e) => {
    e.preventDefault();
    const slug = getDiscussionSlug();
    const { termsAndConditionsIsChecked, privacyPolicyIsChecked, userGuidelinesIsChecked } = this.state;
    const acceptedCookies = {
      ACCEPT_CGU: termsAndConditionsIsChecked,
      ACCEPT_PRIVACY_POLICY_ON_DISCUSSION: privacyPolicyIsChecked,
      ACCEPT_USER_GUIDELINES_ON_DISCUSSION: userGuidelinesIsChecked
    };
    const acceptedLegalContentsArray = Object.keys(acceptedCookies)
      .map(key => (acceptedCookies[key] ? key : null))
      .filter(el => el !== null);
    if (slug) {
      this.props.signUp({ ...this.state, discussionSlug: slug }, acceptedLegalContentsArray);
    } else {
      this.props.signUp(this.state, acceptedLegalContentsArray);
    }
  };

  toggleCheck = (legalContentsType: string) => {
    this.setState(prevState => ({ [`${legalContentsType}IsChecked`]: !prevState[`${legalContentsType}IsChecked`] }));
  };

  handleAcceptButton = (legalContentsType: string) => {
    this.setState({ [`${legalContentsType}IsChecked`]: true });
  };

  displayLegalFormModal = (checked: boolean, text: string, legalContentsType: string) => {
    const modalContent = (
      <LegalForm
        handleAcceptButton={this.handleAcceptButton}
        checked={checked}
        text={text}
        legalContentsType={legalContentsType}
      />
    );
    displayCustomModal(modalContent, true, 'modal-large');
  };

  redirectToPreviousPage = () => {
    browserHistory.goBack();
  };

  render() {
    const slug = getDiscussionSlug();
    const {
      hasTermsAndConditions,
      hasPrivacyPolicy,
      hasUserGuidelines,
      textFields,
      termsAndConditionsText,
      privacyPolicyText,
      userGuidelinesText
    } = this.props;
    const { privacyPolicyIsChecked, termsAndConditionsIsChecked, userGuidelinesIsChecked } = this.state;

    const legalContentsType = {
      termsAndConditions: 'termsAndConditions',
      privacyPolicy: 'privacyPolicy',
      userGuidelines: 'userGuidelines'
    };

    return (
      <div className="login-view">
        <BackButton handleClick={this.redirectToPreviousPage} linkClassName="back-btn" />
        <div className="box-title margin-l">{I18n.t('login.createAccount')}</div>
        <div className="box">
          <form className="signup" onSubmit={this.signupHandler}>
            {textFields &&
              textFields.map((field) => {
                if (field.__typename === 'TextField' && !field.hidden) {
                  return (
                    <FormGroup key={field.id}>
                      <FormControl
                        type={field.fieldType.toLowerCase()}
                        name={field.identifier === 'CUSTOM' ? field.id : field.identifier.toLowerCase()}
                        placeholder={field.required ? `${field.title}*` : field.title}
                        onChange={this.handleInput}
                        required={field.required}
                      />
                      {field.identifier === 'PASSWORD2' ? (
                        <p className="annotation no-margin">{I18n.t('login.passwordRequirement')}</p>
                      ) : null}
                    </FormGroup>
                  );
                }

                if (field.__typename === 'SelectField' && field.options && !field.hidden) {
                  return (
                    <FormControlWithLabel
                      componentClass="select"
                      id={field.id}
                      key={field.id}
                      label={field.title}
                      onChange={this.handleSelectChange}
                      value={this.state[field.id]}
                      required={field.required}
                      labelAlwaysVisible
                    >
                      {!field.required ? <option key="0" value="" /> : null}
                      {field.options.map(option => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </FormControlWithLabel>
                  );
                }
                return null;
              })}
            {hasTermsAndConditions && (
              <SignupCheckbox
                checked={termsAndConditionsIsChecked}
                toggleCheck={this.toggleCheck}
                legalContentsType={legalContentsType.termsAndConditions}
                displayLegalFormModal={this.displayLegalFormModal}
                text={termsAndConditionsText}
              />
            )}
            {hasPrivacyPolicy && (
              <SignupCheckbox
                checked={privacyPolicyIsChecked}
                toggleCheck={this.toggleCheck}
                legalContentsType={legalContentsType.privacyPolicy}
                displayLegalFormModal={this.displayLegalFormModal}
                text={privacyPolicyText}
              />
            )}
            {hasUserGuidelines && (
              <SignupCheckbox
                checked={userGuidelinesIsChecked}
                toggleCheck={this.toggleCheck}
                legalContentsType={legalContentsType.userGuidelines}
                displayLegalFormModal={this.displayLegalFormModal}
                text={userGuidelinesText}
              />
            )}
            <div className="center">
              <FormGroup>
                <Button
                  type="submit"
                  name="register"
                  value={I18n.t('login.signUp')}
                  className="button-submit button-dark button-signup"
                >
                  <Translate value="login.signUp" />
                </Button>
              </FormGroup>
              <FormGroup>
                <Translate dangerousHTML value="login.alreadyAccount" />
                <span>&nbsp;</span>
                <Link to={slug ? getContextual('login', { slug: slug }) : get('login')}>
                  <Translate value="login.login" />
                </Link>
              </FormGroup>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth,
  lang: state.i18n.locale
});

const mapDispatchToProps = dispatch => ({
  signUp: (payload, acceptedLegalContents) => {
    dispatch(signupAction(payload, acceptedLegalContents));
  }
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(TextFieldsQuery, {
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          textFieldsQueryMetadata: {
            error: data.error,
            loading: data.loading
          },
          textFields: []
        };
      }

      return {
        textFieldsQueryMetadata: {
          error: data.error,
          loading: data.loading
        },
        textFields: data.textFields
      };
    }
  }),
  graphql(LegalContentsQuery, {
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          legalContentsQueryMetadata: {
            error: data.error,
            loading: data.loading
          }
        };
      }

      return {
        legalContentsQueryMetadata: {
          error: data.error,
          loading: data.loading
        },
        termsAndConditionsText: lodashGet(data, 'legalContents.termsAndConditions', ''),
        privacyPolicyText: lodashGet(data, 'legalContents.privacyPolicy', ''),
        userGuidelinesText: lodashGet(data, 'legalContents.userGuidelines', '')
      };
    }
  }),
  graphql(TabsConditionQuery, {
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          tabsConditionQueryMetadata: {
            error: data.error,
            loading: data.loading
          }
        };
      }

      return {
        tabsConditionQueryMetadata: {
          error: data.error,
          loading: data.loading
        },
        hasTermsAndConditions: data.hasTermsAndConditions,
        hasPrivacyPolicy: data.hasPrivacyPolicy,
        hasUserGuidelines: data.hasUserGuidelines
      };
    }
  }),
  mergeLoadingAndError(['textFieldsQueryMetadata', 'legalContentsQueryMetadata', 'tabsConditionQueryMetadata']),
  manageErrorAndLoading({ displayLoader: false })
)(SignupForm);