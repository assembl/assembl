// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { Translate, I18n } from 'react-redux-i18n';
import { Button } from 'react-bootstrap';
import FormControlWithLabel from '../common/formControlWithLabel';
import { displayAlert } from '../../utils/utilityManager';
import withLoadingIndicator from '../common/withLoadingIndicator';
import UpdateUserMutation from '../../graphql/mutations/updateUser.graphql';

type PersonnalDataProps = {
  username: string,
  name: string,
  email: string,
  id: string,
  updateUser: Function
};

type PersonnalDataState = {
  username: string,
  name: string,
  email: string
};

class PersonnalData extends React.PureComponent<*, PersonnalDataProps, PersonnalDataState> {
  props: PersonnalDataProps;

  state: PersonnalDataState;

  constructor(props) {
    super(props);
    const { username, name, email } = this.props;
    this.state = {
      username: username,
      name: name,
      email: email
    };
  }

  handleUsernameChange = (e) => {
    this.setState({ username: e.target.value });
  };

  handleFullnameChange = (e) => {
    this.setState({ name: e.target.value });
  };

  handleEmailChange = (e) => {
    this.setState({ email: e.target.value });
  };

  handleSaveClick = () => {
    const { updateUser, id } = this.props;
    const { name, username } = this.state;
    const variables = {
      id: id,
      name: name,
      username: username
    };
    updateUser({ variables: variables })
      .then(() => {
        displayAlert('success', I18n.t('profile.saveSuccess'));
      })
      .catch((error) => {
        displayAlert('danger', error.message.replace('GraphQL error: ', ''));
      });
  };

  render() {
    const { username, name, email } = this.state;
    const fullNameLabel = I18n.t('profile.fullname');
    const emailLabel = I18n.t('profile.email');
    return (
      <div>
        <h2 className="dark-title-2 margin-l">
          <Translate value="profile.personalInfos" />
        </h2>
        <div className="profile-form center">
          <FormControlWithLabel
            label={I18n.t('profile.userName')}
            onChange={this.handleUsernameChange}
            type="text"
            value={username}
          />
          <FormControlWithLabel label={fullNameLabel} onChange={this.handleFullnameChange} type="text" value={name} required />
          <FormControlWithLabel label={emailLabel} onChange={this.handleEmailChange} type="email" value={email} disabled />
          <Button disabled={!name} className="button-submit button-dark margin-l" onClick={this.handleSaveClick}>
            <Translate value="profile.save" />
          </Button>
        </div>
      </div>
    );
  }
}

export default compose(graphql(UpdateUserMutation, { name: 'updateUser' }), withLoadingIndicator())(PersonnalData);