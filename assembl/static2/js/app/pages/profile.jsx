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
import CookiesSelectorContainer from '../components/cookies/cookiesSelectorContainer';
import { get, getContextual } from '../utils/routeMap';
import manageErrorAndLoading from '../components/common/manageErrorAndLoading';
import Helper from '../components/common/helper';
import PasswordRequirements from '../components/common/passwordRequirements';
import UserQuery from '../graphql/userQuery.graphql';
import ProfileFieldsQuery from '../graphql/ProfileFields.graphql';
import UpdateUserMutation from '../graphql/mutations/updateUser.graphql';
import UpdateProfileFieldsMutation from '../graphql/mutations/updateProfileFields.graphql';
import { browserHistory } from '../router';
import { displayAlert } from '../utils/utilityManager';
import { encodeUserIdBase64 } from '../utils/globalFunctions';
import mergeLoadingAndError from '../components/common/mergeLoadingAndError';

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
  name: string,
  passwordEditionOpen: boolean,
  values: {
    [string]: Object
  },
  saveDisabled: boolean
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
      passwordEditionOpen: false,
      saveDisabled: false
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
        displayAlert('danger', error.message.replace('GraphQL error: ', ''), false, 10000);
      });
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
    const saveDisabled = this.state.saveDisabled;
    return (
      <div className="profile background-dark-grey">
        <div className="content-section">
          <Grid fluid>
            <div className="max-container">
              <Col xs={12} sm={3}>
                <Avatar creationDate={creationDate} lang={lang} name={name} />
              </Col>
              <Col xs={12} sm={9} className="no-padding-sm">
                <div className="border-left">
                  <h1 className="dark-title-1">
                    <Translate value="profile.panelTitle" />
                  </h1>
                  <h2 className="dark-title-2 margin-l">
                    <Translate value="profile.personalInfos" />
                  </h2>
                  <div className="profile-form center">
                    {profileFields &&
                      profileFields.map(
                        pf =>
                          !pf.configurableField.hidden && (
                            <ConfiguredField
                              key={pf.id}
                              configurableField={pf.configurableField}
                              handleValueChange={value => this.handleFieldValueChange(pf.id, value)}
                              value={this.state.values[pf.id]}
                              validationCallback={(hasError: boolean) => this.setState(() => ({ saveDisabled: hasError }))}
                            />
                          )
                      )}
                    <Translate value="profile.usernameInformations" />
                    <Button
                      className="button-submit button-dark margin-l"
                      onClick={!saveDisabled ? this.handleSaveClick : null}
                      disabled={saveDisabled}
                    >
                      <Translate value="profile.save" />
                    </Button>
                  </div>
                  {hasPassword && (
                    <div>
                      <div className="center-align-flex">
                        <h2 className="dark-title-2 margin-l">
                          <Translate value="profile.password" />
                        </h2>
                        <Helper classname="title margin-m" helperText={<PasswordRequirements />} />
                      </div>
                      <div className="profile-form center">
                        <ModifyPasswordForm id={id} />
                      </div>
                    </div>
                  )}
                  <div className="profile-cookies-configuration">
                    <CookiesSelectorContainer />
                  </div>
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
      if (data.error || data.loading) {
        return {
          profileFieldsQueryMetadata: {
            error: data.error,
            loading: data.loading
          },
          profileFields: []
        };
      }

      return {
        profileFieldsQueryMetadata: {
          error: data.error,
          loading: data.loading
        },
        profileFields: data.profileFields
      };
    }
  }),
  graphql(UserQuery, {
    skip: props => !props.id,
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          userQueryMetadata: {
            error: data.error,
            loading: data.loading
          }
        };
      }

      const { creationDate, email, hasPassword, name, username } = data.user;
      return {
        userQueryMetadata: {
          error: data.error,
          loading: data.loading
        },
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
  mergeLoadingAndError(['profileFieldsQueryMetadata', 'userQueryMetadata']),
  manageErrorAndLoading({ displayLoader: true })
)(Profile);