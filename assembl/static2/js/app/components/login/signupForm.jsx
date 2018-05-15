// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { form, FormGroup, FormControl, Button, Checkbox } from 'react-bootstrap';
import { Link } from 'react-router';
import { signupAction } from '../../actions/authenticationActions';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { get, getContextual } from '../../utils/routeMap';
import inputHandler from '../../utils/inputHandler';
import { displayAlert, displayCustomModal } from '../../utils/utilityManager';
import TermsForm from '../common/termsForm';
import withoutLoadingIndicator from '../../components/common/withoutLoadingIndicator';
import TabsConditionQuery from '../../graphql/TabsConditionQuery.graphql';
import TextFieldsQuery from '../../graphql/TextFields.graphql';

type SignupFormProps = {
  hasTermsAndConditions: boolean,
  signUp: Function,
  lang: string,
  auth: Object,
  textFields: Array<ConfigurableField>
};

type SignupFormState = {
  checked: boolean
};

class SignupForm extends React.Component<void, SignupFormProps, SignupFormState> {
  props: SignupFormProps;

  state: SignupFormState;

  signupHandler: SyntheticEvent => void;

  handleInput: SyntheticEvent => void;

  toggleCheck: () => void;

  handleAcceptButton: () => void;

  constructor(props) {
    super(props);
    this.state = {
      checked: false
    };

    this.signupHandler = this.signupHandler.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.toggleCheck = this.toggleCheck.bind(this);
    this.handleAcceptButton = this.handleAcceptButton.bind(this);
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

  handleInput(e) {
    inputHandler(this, e);
  }

  signupHandler(e) {
    e.preventDefault();
    const slug = getDiscussionSlug();
    if (slug) {
      this.props.signUp({ ...this.state, discussionSlug: slug });
    } else {
      this.props.signUp(this.state);
    }
  }

  toggleCheck() {
    this.setState({ checked: !this.state.checked });
  }

  handleAcceptButton() {
    this.setState({ checked: true });
  }

  render() {
    const slug = getDiscussionSlug();
    const { hasTermsAndConditions, lang, textFields } = this.props;
    return (
      <div className="login-view">
        <div className="box-title">{I18n.t('login.createAccount')}</div>
        <div className="box">
          <form className="signup" onSubmit={this.signupHandler}>
            {textFields &&
              textFields.map(tf => (
                <FormGroup key={tf.id}>
                  <FormControl
                    type={tf.fieldType.toLowerCase()}
                    name={tf.identifier === 'CUSTOM' ? tf.id : tf.identifier.toLowerCase()}
                    placeholder={tf.title}
                    onChange={this.handleInput}
                  />
                </FormGroup>
              ))}
            {hasTermsAndConditions && (
              <FormGroup className="left margin-left-2">
                <Checkbox checked={this.state.checked} type="checkbox" onChange={this.toggleCheck} required inline>
                  <Translate value="termsAndConditions.iAccept" />
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      const Terms = (
                        <TermsForm handleAcceptButton={this.handleAcceptButton} isChecked={this.state.checked} lang={lang} />
                      );
                      displayCustomModal(Terms, true, 'modal-large');
                    }}
                  >
                    <Translate value="termsAndConditions.link" className="terms-link" />
                  </a>
                </Checkbox>
              </FormGroup>
            )}
            <FormGroup>
              <Button type="submit" name="register" value={I18n.t('login.signUp')} className="button-submit button-dark margin-m">
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
    hasTermsAndConditions: data.hasTermsAndConditions
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
  withData,
  withoutLoadingIndicator()
)(SignupForm);