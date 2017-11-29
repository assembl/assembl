import React from 'react';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { Grid, Col, Button } from 'react-bootstrap';
import FormControlWithLabel from '../components/common/formControlWithLabel';

const Profile = ({ username, firstname, lastname, email, imgUrl }) => {
  return (
    <div className="profile">
      <div className="content-section">
        <Grid fluid>
          <div className="max-container">
            <Col xs={12} sm={3}>
              <div className="center">
                <div className="profile-image" style={{ backgroundImage: `url(${imgUrl})` }} />
                <span className="assembl-icon-edit color" />
                <div className="modify">
                  <Translate value="profile.modify" />
                </div>
              </div>
              <h4 className="dark-title-4 center">
                {firstname} {lastname}
              </h4>
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
                  <FormControlWithLabel label={I18n.t('profile.userName')} type="text" value={username} />
                  <FormControlWithLabel label={I18n.t('profile.firstname')} type="text" value={firstname} />
                  <FormControlWithLabel label={I18n.t('profile.lastname')} type="text" value={lastname} />
                  <FormControlWithLabel label={I18n.t('profile.email')} type="text" value={email} />
                  <Button className="button-submit button-dark margin-l">
                    <Translate value="profile.save" />
                  </Button>
                </div>
                <h3 className="dark-title-3 margin-l">
                  <Translate value="profile.password" />
                </h3>
                <div className="profile-form center">
                  <Button className="button-submit button-dark">
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
};

const mapStateToProps = () => {
  const userMock = {
    username: 'Paolina',
    firstname: 'Pauline',
    lastname: 'Thomas',
    email: 'pauline.thomas@bluenove.com',
    imgUrl: 'https://framapic.org/F3tnSRYg9CLV/QyoRQ65a2s0t.jpeg'
  };
  return {
    username: userMock.username,
    firstname: userMock.firstname,
    lastname: userMock.lastname,
    email: userMock.email,
    imgUrl: userMock.imgUrl
  };
};

export default connect(mapStateToProps)(Profile);