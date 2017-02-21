import React from 'react';
import { connect } from 'react-redux';
import { Grid, Col } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import MapStateToProps from '../../store/mapStateToProps';
import TopIdea from './themes/topIdea';
import Illustration from './themes/illustration';
import Loader from '../common/loader';

class Themes extends React.Component {
  render() {
    const { ideas, ideasLoading } = this.props.ideas;
    return (
      <section className="themes-section">
        {ideasLoading && <Loader />}
        {(ideas && Object.keys(ideas).length > 4 && ideas.themes.length > 3) &&
          <Grid fluid className="background-grey">
            <div className="max-container">
              <div className="title-section">
                <div className="title-hyphen">&nbsp;</div>
                <h1 className="dark-title-1">
                  <Translate value="home.themesTitle" />
                </h1>
                <h5 className="dark-title-5 subtitle">
                  <Translate value="home.themesSubtitle" />
                </h5>
              </div>
              <div className="content-section">
                <Col xs={12} sm={6} md={3} className="theme1 no-padding">
                  <TopIdea keyValue="controversial" />
                  <Illustration index={0} />
                </Col>
                <Col xs={12} sm={6} md={3} className="theme2 no-padding">
                  <Illustration index={1} />
                  <TopIdea keyValue="longerThread" />
                </Col>
                <Col xs={12} sm={6} md={3} className="theme3 no-padding">
                  <TopIdea keyValue="topContributor" />
                  <Illustration index={2} />
                </Col>
                <Col xs={12} sm={6} md={3} className="theme4 no-padding">
                  <Illustration index={3} />
                  <TopIdea keyValue="recentDiscussion" />
                </Col>
              </div>
            </div>
            <div className="content-end">&nbsp;</div>
          </Grid>
        }
      </section>
    );
  }
}

export default connect(MapStateToProps)(Themes);