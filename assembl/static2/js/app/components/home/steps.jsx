import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Grid, Col } from 'react-bootstrap';
import MapStateToProps from '../../store/mapStateToProps';
import Step from './steps/step';

class Steps extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    return (
      <section className="steps-section">
        <Grid fluid className="background-grey">
          <div className="max-container">
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                <Translate value="home.timelineTitle" />
              </h1>
            </div>
            <div className="content-section">
              <Col xs={12} sm={6} md={3} className="no-padding step1">
                <Step imgUrl={debateData.config.home.steps.img1Url} stepNumber={1} title="home.step1Title" text="home.step1Text" />
              </Col>
              <Col xs={12} sm={6} md={3} className="no-padding step2">
                <Step imgUrl={debateData.config.home.steps.img2Url} stepNumber={2} title="home.step2Title" text="home.step2Text" />
              </Col>
              <Col xs={12} sm={6} md={3} className="no-padding step3">
                <Step imgUrl={debateData.config.home.steps.img3Url} stepNumber={3} title="home.step3Title" text="home.step3Text" />
              </Col>
              <Col xs={12} sm={6} md={3} className="no-padding step4">
                <Step imgUrl={debateData.config.home.steps.img4Url} stepNumber={4} title="home.step4Title" text="home.step4Text" />
              </Col>
            </div>
          </div>
          <div className="content-end">&nbsp;</div>
        </Grid>
      </section>
    );
  }
}

export default connect(MapStateToProps)(Steps);