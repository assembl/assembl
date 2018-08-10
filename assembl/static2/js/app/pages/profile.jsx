// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Translate, I18n } from 'react-redux-i18n';
import { Grid, Col, Button } from 'react-bootstrap';

import Avatar from '../components/profile/avatar';
import ModifyPasswordForm from '../components/profile/modifyPasswordForm';
import DeleteMyAccount from '../components/profile/deleteMyAccount';
import ConfiguredField, { type ConfiguredFieldType } from '../components/common/configuredField';
import { get, getContextual } from '../utils/routeMap';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import UserQuery from '../graphql/userQuery.graphql';
import ProfileFieldsQuery from '../graphql/ProfileFields.graphql';
import UpdateUserMutation from '../graphql/mutations/updateUser.graphql';
import UpdateProfileFieldsMutation from '../graphql/mutations/updateProfileFields.graphql';
import { browserHistory } from '../router';
import { displayAlert } from '../utils/utilityManager';
import { encodeUserIdBase64 } from '../utils/globalFunctions';

type ProfileProps = {
  connectedUserId: string,
  creationDate: ?string,
  email: string, // eslint-disable-line react/no-unused-prop-types
  lang: string,
  slug: string,
  userId: string,
  username: string, // eslint-disable-line react/no-unused-prop-types
  id: string,
  hasPassword: boolean,
  name: string,
  params: Object,
  location: Object,
  profileFields: Array<ConfiguredFieldType>,
  updateProfileFields: Function
};

type ProfileState = {
  passwordEditionOpen: boolean,
  values: {
    [string]: Object
  }
};

class Profile extends React.PureComponent<ProfileProps, ProfileState> {
  static defaultProps = {
    creationDate: null
  };

  static getDerivedStateFromProps(nextProps: ProfileProps) {
    const email = nextProps.profileFields.find(pf => pf.configurableField.identifier === 'EMAIL');
    const fullname = nextProps.profileFields.find(pf => pf.configurableField.identifier === 'FULLNAME');
    const username = nextProps.profileFields.find(pf => pf.configurableField.identifier === 'USERNAME');
    const defaultValues =
      email && fullname && username
        ? {
          [email.id]: nextProps.email,
          [fullname.id]: nextProps.name,
          [username.id]: nextProps.username
        }
        : {};
    const values = nextProps.profileFields
      .filter(pf => pf.configurableField.identifier === 'CUSTOM')
      .filter(pf => pf.valueData)
      .reduce(
        (result, pf) => ({
          ...result,
          [pf.id]: pf.valueData.value
        }),
        defaultValues
      );

    return { values: values };
  }

  constructor(props) {
    super(props);
    const { name } = this.props;
    this.state = {
      name: name,
      values: {},
      passwordEditionOpen: false
    };
  }

  componentDidMount() {
    const { connectedUserId, slug } = this.props;
    const { userId } = this.props.params;
    const { location } = this.props;
    if (!connectedUserId) {
      browserHistory.push(`${getContextual('login', { slug: slug })}?next=${location.pathname}`);
    } else if (connectedUserId !== userId) {
      browserHistory.push(get('home', { slug: slug }));
    }
  }

  handleSaveClick = () => {
    const { id, lang, profileFields, updateProfileFields } = this.props;
    const data = profileFields.map(pf => ({
      configurableFieldId: pf.configurableField.id,
      id: pf.id,
      valueData: {
        value: this.state.values[pf.id]
      }
    }));
    const variables = { lang: lang, data: data };
    const payload = {
      refetchQueries: [
        {
          query: UserQuery,
          variables: {
            id: id
          }
        }
      ],
      variables: variables
    };
    updateProfileFields(payload)
      .then(() => {
        displayAlert('success', I18n.t('profile.saveSuccess'));
      })
      .catch((error) => {
        displayAlert('danger', error.message.replace('GraphQL error: ', ''));
      });
  };

  handlePasswordClick = () => {
    this.setState({ passwordEditionOpen: true });
  };

  handleFieldValueChange = (id, value) => {
    this.setState(prevState => ({
      ...prevState,
      values: {
        ...prevState.values,
        [id]: value
      }
    }));
  };

  render() {
    const { creationDate, hasPassword, lang, id, name } = this.props;
    const profileFields = this.props.profileFields;

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
                  <h2 className="dark-title-2 margin-l">
                    <Translate value="profile.personalInfos" />
                  </h2>
                  <div className="profile-form center">
                    {profileFields &&
                      profileFields.map(pf => (
                        !pf.configurableField.hidden &&
                        <ConfiguredField
                          key={pf.id}
                          configurableField={pf.configurableField}
                          handleValueChange={value => this.handleFieldValueChange(pf.id, value)}
                          value={this.state.values[pf.id]}
                        />
                      ))}
                    <Translate value="profile.usernameInformations" />
                    <Button className="button-submit button-dark margin-l" onClick={this.handleSaveClick}>
                      <Translate value="profile.save" />
                    </Button>
                  </div>
                  {hasPassword && (
                    <div>
                      <h2 className="dark-title-2 margin-l">
                        <Translate value="profile.password" />
                      </h2>
                      <div className="profile-form center">
                        {this.state.passwordEditionOpen ? (
                          <ModifyPasswordForm id={id} successCallback={() => this.setState({ passwordEditionOpen: false })} />
                        ) : (
                          <Button
                            id="modify-password-button"
                            className="button-submit button-dark"
                            onClick={this.handlePasswordClick}
                          >
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
    id: encodeUserIdBase64(userId),
    lang: i18n.locale
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(ProfileFieldsQuery, {
    props: ({ data }) => {
      if (data.loading) {
        return { loading: true, profileFields: [] };
      }
      if (data.error) {
        // this is needed to properly redirect to home page in case of error
        return { error: data.error, profileFields: [] };
      }

      return {
        profileFields: data.profileFields
      };
    }
  }),
  graphql(UserQuery, {
    props: ({ data }) => {
      if (data.loading) {
        return { loading: true };
      }
      if (data.error) {
        // this is needed to properly redirect to home page in case of error
        return { error: data.error };
      }
      const { creationDate, email, hasPassword, name, username } = data.user;
      return {
        creationDate: creationDate,
        email: email,
        hasPassword: hasPassword,
        name: name,
        username: username
      };
    }
  }),
  graphql(UpdateUserMutation, { name: 'updateUser' }),
  graphql(UpdateProfileFieldsMutation, { name: 'updateProfileFields' }),
  withLoadingIndicator()
)(Profile);