import React from 'react';
import { Grid, Col } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import TopIdea from './themes/topIdea'
import IllustratedIdea from './themes/illustratedIdea'

class Themes extends React.Component {
  render() {   
    return(
      <Grid fluid className="background-grey themes">
        <div className="max-container">
          <div>
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                <Translate value="home.themesTitle" />
              </h1>
              <h5 className="dark-title-5 subtitle">
                <Translate value="home.themesSubtitle" />
              </h5>
            </div>
          </div>
          <div className="margin-xl">
            <Col xs={12} sm={6} md={3} className="theme1 no-padding">
              <TopIdea keyValue="controversial" />
              <IllustratedIdea index={0} />
            </Col>
            <Col xs={12} sm={6} md={3} className="theme2 no-padding">
              <IllustratedIdea index={1} />
              <TopIdea keyValue="longerThread" />
            </Col>
            <Col xs={12} sm={6} md={3} className="theme3 no-padding">
              <TopIdea keyValue="topContributor" />
              <IllustratedIdea index={2} />
            </Col>
            <Col xs={12} sm={6} md={3} className="theme4 no-padding">
              <IllustratedIdea index={3} />
              <TopIdea keyValue="recentDiscussion" />
            </Col>
          </div>
        </div>
      </Grid>
    );
  }
}

export default Themes;