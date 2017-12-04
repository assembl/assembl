import React from 'react';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { Grid, Col, Button } from 'react-bootstrap';
import FormControlWithLabel from '../components/common/formControlWithLabel';
import { get, getContextual } from '../utils/routeMap';
import { getConnectedUserId, getDiscussionSlug } from '../utils/globalFunctions';

class Profile extends React.Component {
  constructor(props) {
    super(props);
    const { username, fullname, email } = this.props;
    this.state = {
      username: username,
      fullname: fullname,
      email: email
    };
    this.handleUsernameChange = this.handleUsernameChange.bind(this);
    this.handleFullnameChange = this.handleFullnameChange.bind(this);
    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handlePasswordClick = this.handlePasswordClick.bind(this);
  }
  componentWillMount() {
    const connectedUserId = getConnectedUserId();
    const { userId } = this.props.params;
    const { pathname } = this.props.location;
    const slug = { slug: getDiscussionSlug() };
    if (!connectedUserId) {
      browserHistory.push(`${getContextual('login', slug)}?next=${pathname}`);
    } else if (connectedUserId !== userId) {
      browserHistory.push(get('home', slug));
    }
  }
  handleUsernameChange(e) {
    this.setState({ username: e.target.value });
  }
  handleFullnameChange(e) {
    this.setState({ fullname: e.target.value });
  }
  handleEmailChange(e) {
    this.setState({ email: e.target.value });
  }
  handleSaveClick() {}
  handlePasswordClick() {
    browserHistory.push(get('ctxRequestPasswordChange'));
  }
  render() {
    const { username, fullname, email } = this.state;
    return (
      <div className="profile">
        <div className="content-section">
          <Grid fluid>
            <div className="max-container">
              <Col xs={12} sm={3}>
                <div className="center">
                  <span className="assembl-icon-profil" />
                </div>
                <h4 className="dark-title-4 center">{fullname}</h4>
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
                      value={fullname}
                      required
                    />
                    <FormControlWithLabel
                      label={I18n.t('profile.email')}
                      onChange={this.handleEmailChange}
                      type="email"
                      value={email}
                      required
                    />
                    <Button className="button-submit button-dark margin-l" onClick={this.handleSaveClick}>
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

const mapStateToProps = () => {
  const userMock = {
    username: 'Paolina',
    fullname: 'Pauline Thomas',
    email: 'pauline.thomas@bluenove.com'
  };
  return {
    username: userMock.username,
    fullname: userMock.fullname,
    email: userMock.email
  };
};

export default connect(mapStateToProps)(Profile);