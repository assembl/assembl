import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';
import GlobalFunctions from '../../utils/globalFunctions';
import MapStateToProps from '../../store/mapStateToProps';
import Step from './steps/step';
import Timeline from './steps/timeline';

class Steps extends React.Component {
  getCurrentStepIndex() {
    const { debateData } = this.props.debate;
    const currentDate = new Date();
    let currentStepIndex = 0;
    debateData.config.home.steps.timeline.map((step, index) => {
      const startDate = GlobalFunctions.getCustomDate(step.startDate);
      const endDate = GlobalFunctions.getCustomDate(step.endDate);
      const isCurrentStep = GlobalFunctions.compareDates(currentDate, startDate) && GlobalFunctions.compareDates(endDate, currentDate);
      if (isCurrentStep) {
        currentStepIndex = index;
      }
      return index;
    });
    return currentStepIndex;
  }
  render() {
    const currentStepIndex = this.getCurrentStepIndex();
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
              <Row className="no-margin">
                <Col xs={12} sm={6} md={3} className={currentStepIndex !== 0 ? 'no-padding step1 hidden-xs' : 'no-padding step1'}>
                  <Step imgUrl={debateData.config.home.steps.img1Url} stepNumber={1} title="home.step1Title" text="home.step1Text" />
                </Col>
                <Col xs={12} sm={6} md={3} className={currentStepIndex !== 1 ? 'no-padding step2 hidden-xs' : 'no-padding step2'}>
                  <Step imgUrl={debateData.config.home.steps.img2Url} stepNumber={2} title="home.step2Title" text="home.step2Text" />
                </Col>
                <Col xs={12} sm={6} md={3} className={currentStepIndex !== 2 ? 'no-padding step3 hidden-xs' : 'no-padding step3'}>
                  <Step imgUrl={debateData.config.home.steps.img3Url} stepNumber={3} title="home.step3Title" text="home.step3Text" />
                </Col>
                <Col xs={12} sm={6} md={3} className={currentStepIndex !== 3 ? 'no-padding step4 hidden-xs' : 'no-padding step4'}>
                  <Step imgUrl={debateData.config.home.steps.img4Url} stepNumber={4} title="home.step4Title" text="home.step4Text" />
                </Col>
              </Row>
              <Row className="no-margin">
                <Col xs={3} sm={3} md={3} className="no-padding bar1">
                  <Timeline index={0} currentStep={currentStepIndex === 0} />
                </Col>
                <Col xs={3} sm={3} md={3} className="no-padding bar2">
                  <Timeline index={1} currentStep={currentStepIndex === 1} />
                </Col>
                <Col xs={3} sm={3} md={3} className="no-padding bar3">
                  <Timeline index={2} currentStep={currentStepIndex === 2} />
                </Col>
                <Col xs={3} sm={3} md={3} className="no-padding bar4">
                  <Timeline index={3} currentStep={currentStepIndex === 3} />
                </Col>
              </Row>
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

export default connect(MapStateToProps)(Steps);