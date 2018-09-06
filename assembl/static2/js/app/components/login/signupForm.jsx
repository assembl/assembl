// @flow
import * as React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { form, FormGroup, FormControl, Button, Checkbox } from 'react-bootstrap';
import { Link } from 'react-router';
import * as lodashGet from 'lodash/get';
import { signupAction } from '../../actions/authenticationActions';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { get, getContextual } from '../../utils/routeMap';
import inputHandler from '../../utils/inputHandler';
import { displayAlert, displayCustomModal } from '../../utils/utilityManager';
import FormControlWithLabel from '../common/formControlWithLabel';
import withoutLoadingIndicator from '../../components/common/withoutLoadingIndicator';
import TabsConditionQuery from '../../graphql/TabsConditionQuery.graphql';
import TextFieldsQuery from '../../graphql/TextFields.graphql';
import LegalContentsQuery from '../../graphql/LegalContents.graphql';
import LegalForm from './legalForm';

type SignupFormProps = {
  hasTermsAndConditions: boolean,
  hasPrivacyPolicy: boolean,
  signUp: Function,
  auth: Object,
  textFields: Array<ConfigurableField>,
  privacyPolicyText: string,
  termsAndConditionsText: string
};

type SignupFormState = {
  privacyPolicyIsChecked: boolean,
  termsAndConditionsIsChecked: boolean
};

class SignupForm extends React.Component<SignupFormProps, SignupFormState> {
  signupHandler: (SyntheticEvent<>) => void;

  handleInput: (SyntheticInputEvent<HTMLInputElement>) => void;

  toggleCheck: () => void;

  handleAcceptButton: () => void;

  constructor(props) {
    super(props);
    this.state = {
      privacyPolicyIsChecked: false,
      termsAndConditionsIsChecked: false
    };
  }

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
    if (slug) {
      this.props.signUp({ ...this.state, discussionSlug: slug });
    } else {
      this.props.signUp(this.state);
    }
  };

  toggleCheck = (legalContentsType: string) => {
    this.setState(prevState => ({ [`${legalContentsType}IsChecked`]: !prevState[`${legalContentsType}IsChecked`] }));
  };

  handleAcceptButton = (legalContentsType: string) => {
    this.setState({ [`${legalContentsType}IsChecked`]: true });
  };

  render() {
    const slug = getDiscussionSlug();
    const { hasTermsAndConditions, hasPrivacyPolicy, textFields, termsAndConditionsText, privacyPolicyText } = this.props;
    const { privacyPolicyIsChecked, termsAndConditionsIsChecked } = this.state;
    return (
      <div className="login-view">
        <div className="box-title">{I18n.t('login.createAccount')}</div>
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
              <FormGroup className="left margin-left-2">
                <Checkbox
                  checked={termsAndConditionsIsChecked}
                  type="checkbox"
                  onChange={() => this.toggleCheck('termsAndConditions')}
                  required
                  inline
                >
                  <Translate value="termsAndConditions.iAccept" />
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      const content = (
                        <LegalForm
                          handleAcceptButton={this.handleAcceptButton}
                          checked={termsAndConditionsIsChecked}
                          text={termsAndConditionsText}
                          legalContentsType="termsAndConditions"
                        />
                      );
                      displayCustomModal(content, true, 'modal-large');
                    }}
                  >
                    <Translate value="termsAndConditions.link" className="terms-link" />
                  </a>
                </Checkbox>
              </FormGroup>
            )}
            {hasPrivacyPolicy && (
              <FormGroup className="left margin-left-2">
                <Checkbox
                  checked={privacyPolicyIsChecked}
                  type="checkbox"
                  onChange={() => this.toggleCheck('privacyPolicy')}
                  required
                  inline
                >
                  <Translate value="privacyPolicy.iAccept" />
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      const content = (
                        <LegalForm
                          text={privacyPolicyText}
                          handleAcceptButton={this.handleAcceptButton}
                          checked={privacyPolicyIsChecked}
                          legalContentsType="privacyPolicy"
                        />
                      );
                      displayCustomModal(content, true, 'modal-large');
                    }}
                  >
                    <Translate value="privacyPolicy.link" className="terms-link" />
                  </a>
                </Checkbox>
              </FormGroup>
            )}
            <div className="center">
              <FormGroup>
                <Button
                  type="submit"
                  name="register"
                  value={I18n.t('login.signUp')}
                  className="button-submit button-dark margin-m"
                >
                  <Translate value="login.signUp" />
                </Button>
              </FormGroup>
              <FormGroup>
                <Translate value="login.alreadyAccount" />
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
  signUp: (payload) => {
    dispatch(signupAction(payload));
  }
});

const withData = graphql(TabsConditionQuery, {
  props: ({ data }) => ({
    ...data,
    hasTermsAndConditions: data.hasTermsAndConditions,
    hasPrivacyPolicy: data.hasPrivacyPolicy
  })
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(TextFieldsQuery, {
    props: ({ data }) => {
      if (data.loading) {
        return { loading: true, textFields: [] };
      }
      if (data.error) {
        // this is needed to properly redirect to home page in case of error
        return { error: data.error, textFields: [] };
      }

      return {
        textFields: data.textFields
      };
    }
  }),
  graphql(LegalContentsQuery, {
    props: ({ data }) => {
      if (data.loading) {
        return { loading: true };
      }
      if (data.error) {
        return { error: data.error };
      }

      return {
        ...data,
        termsAndConditionsText: lodashGet(data, 'legalContents.termsAndConditions', ''),
        privacyPolicyText: lodashGet(data, 'legalContents.privacyPolicy', '')
      };
    }
  }),
  withData,
  withoutLoadingIndicator()
)(SignupForm);