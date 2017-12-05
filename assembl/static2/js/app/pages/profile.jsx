// @flow
import React from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Translate, I18n } from 'react-redux-i18n';
import { Grid, Col, Button } from 'react-bootstrap';
import FormControlWithLabel from '../components/common/formControlWithLabel';
import { get, getContextual } from '../utils/routeMap';
import { displayAlert } from '../utils/utilityManager';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import UserQuery from '../graphql/userQuery.graphql';
import UpdateUserMutation from '../graphql/mutations/updateUser.graphql';

type ProfileProps = {
  username: string,
  name: string,
  email: string,
  connectedUserId: string,
  slug: string,
  userId: string,
  id: string,
  params: Object,
  location: Object,
  refetchUser: Function,
  updateUser: Function
};

type ProfileSate = {
  username: string,
  name: string,
  email: string
};

class Profile extends React.PureComponent<*, ProfileProps, ProfileSate> {
  props: ProfileProps;
  state: ProfileSate;

  constructor(props) {
    super(props);
    const { username, name, email } = this.props;
    this.state = {
      username: username,
      name: name,
      email: email
    };
  }
  componentWillMount() {
    const { connectedUserId, slug } = this.props;
    const { userId } = this.props.params;
    const { location } = this.props;
    if (!connectedUserId) {
      browserHistory.push(`${getContextual('login', slug)}?next=${location.pathname}`);
    } else if (connectedUserId !== userId) {
      browserHistory.push(get('home', slug));
    }
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
    const { updateUser, id, refetchUser } = this.props;
    const { name, username } = this.state;
    const variables = {
      id: id,
      name: name,
      username: username
    };
    updateUser({ variables: variables })
      .then(() => {
        refetchUser();
        displayAlert('success', I18n.t('profile.saveSuccess'));
      })
      .catch((error) => {
        displayAlert('danger', error);
      });
  };
  handlePasswordClick = () => {
    browserHistory.push(get('ctxRequestPasswordChange'));
  };
  render() {
    const { username, name, email } = this.state;
    return (
      <div className="profile">
        <div className="content-section">
          <Grid fluid>
            <div className="max-container">
              <Col xs={12} sm={3}>
                <div className="center">
                  <span className="assembl-icon-profil" />
                </div>
                <h4 className="dark-title-4 center">{this.props.name}</h4>
              </Col>
              <Col xs={12} sm={9}>
                <div className="border-left">
                  <h1 className="dark-title-1">
                    <Translate value="profile.panelTitle" />
                  </h1>
                  <h3 className="dark-title-3 margin-l">
                    <Translate value="profile.personalInfos" />
                  </h3>
                  <div className="profile-form center">
                    <FormControlWithLabel
                      label={I18n.t('profile.userName')}
                      onChange={this.handleUsernameChange}
                      type="text"
                      value={username}
                    />
                    <FormControlWithLabel
                      label={I18n.t('profile.fullname')}
                      onChange={this.handleFullnameChange}
                      type="text"
                      value={name}
                      required
                    />
                    <FormControlWithLabel
                      label={I18n.t('profile.email')}
                      onChange={this.handleEmailChange}
                      type="email"
                      value={email}
                      disabled
                    />
                    <Button disabled={!name} className="button-submit button-dark margin-l" onClick={this.handleSaveClick}>
                      <Translate value="profile.save" />
                    </Button>
                  </div>
                  <h3 className="dark-title-3 margin-l">
                    <Translate value="profile.password" />
                  </h3>
                  <div className="profile-form center">
                    <Button className="button-submit button-dark" onClick={this.handlePasswordClick}>
                      <Translate value="profile.changePassword" />
                    </Button>
                  </div>
                </div>
              </Col>
            </div>
          </Grid>
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ context, debate }) => {
  return {
    slug: debate.debateData.slug,
    connectedUserId: context.connectedUserId,
    id: btoa(`AgentProfile:${context.connectedUserId}`)
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(UserQuery, {
    props: ({ data }) => {
      if (data.loading) {
        return { loading: true };
      }
      return {
        username: data.user.username,
        name: data.user.name,
        email: data.user.email,
        refetchUser: data.refetch
      };
    }
  }),
  graphql(UpdateUserMutation, { name: 'updateUser' }),
  withLoadingIndicator()
)(Profile);