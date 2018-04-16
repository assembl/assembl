// @flow
import React from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import { Grid, Col, Button } from 'react-bootstrap';
import Avatar from '../components/profile/avatar';
import PersonnalData from '../components/profile/personnalData';
import ModifyPasswordForm from '../components/profile/modifyPasswordForm';
import DeleteMyAccount from '../components/profile/deleteMyAccount';
import { get, getContextual } from '../utils/routeMap';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import UserQuery from '../graphql/userQuery.graphql';

type ProfileProps = {
  email: string,
  name: string,
  username: string,
  connectedUserId: string,
  creationDate: ?string,
  lang: string,
  slug: string,
  userId: string,
  id: string,
  hasPassword: boolean,
  params: Object,
  location: Object
};

type ProfileState = {
  name: string,
  passwordEditionOpen: boolean
};

class Profile extends React.PureComponent<*, ProfileProps, ProfileState> {
  props: ProfileProps;

  state: ProfileState;

  defaultProps: {
    creationDate: null
  };

  constructor(props) {
    super(props);
    const { name } = this.props;
    this.state = {
      name: name,
      passwordEditionOpen: false
    };
  }

  componentWillMount() {
    const { connectedUserId, slug } = this.props;
    const { userId } = this.props.params;
    const { location } = this.props;
    if (!connectedUserId) {
      browserHistory.push(`${getContextual('login', { slug: slug })}?next=${location.pathname}`);
    } else if (connectedUserId !== userId) {
      browserHistory.push(get('home', { slug: slug }));
    }
  }

  handlePasswordClick = () => {
    this.setState({ passwordEditionOpen: true });
  };

  render() {
    const { creationDate, hasPassword, lang, id, name, username, email } = this.props;
    return (
      <div className="profile background-dark-grey">
        <div className="content-section">
          <Grid fluid>
            <div className="max-container">
              <Col xs={12} sm={3}>
                <Avatar creationDate={creationDate} lang={lang} name={name} />
              </Col>
              <Col xs={12} sm={9}>
                <div className="border-left">
                  <h1 className="dark-title-1">
                    <Translate value="profile.panelTitle" />
                  </h1>
                  <PersonnalData id={id} username={username} name={name} email={email} />
                  {hasPassword && (
                    <div>
                      <h2 className="dark-title-2 margin-l">
                        <Translate value="profile.password" />
                      </h2>
                      <div className="profile-form center">
                        {this.state.passwordEditionOpen ? (
                          <ModifyPasswordForm id={id} successCallback={() => this.setState({ passwordEditionOpen: false })} />
                        ) : (
                          <Button className="button-submit button-dark" onClick={this.handlePasswordClick}>
                            <Translate value="profile.changePassword" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  <DeleteMyAccount />
                </div>
              </Col>
            </div>
          </Grid>
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ context, debate, i18n }, ownProps) => {
  const userId = ownProps.params.userId;
  return {
    slug: debate.debateData.slug,
    connectedUserId: context.connectedUserId,
    id: btoa(`AgentProfile:${userId}`),
    lang: i18n.locale
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(UserQuery, {
    props: ({ data }) => {
      if (data.loading) {
        return { loading: true };
      }
      if (data.error) {
        // this is needed to properly redirect to home page in case of error
        return { error: data.error };
      }
      return {
        username: data.user.username,
        email: data.user.email,
        name: data.user.name,
        creationDate: data.user.creationDate,
        hasPassword: data.user.hasPassword
      };
    }
  }),
  withLoadingIndicator()
)(Profile);