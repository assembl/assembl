import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';
import GlobalFunctions from '../../utils/globalFunctions';
import MapStateToProps from '../../store/mapStateToProps';
import Step from './steps/step';
import Timeline from './steps/timeline';

class Steps extends React.Component {
  isCurrentStep(index) {
    const currentDate = new Date();
    const timeline = this.props.debate.debateData.config.home.steps;
    const startDate = GlobalFunctions.getDateFromString(timeline[index].startDate);
    const endDate = GlobalFunctions.getDateFromString(timeline[index].endDate);
    const isCurrentStep = GlobalFunctions.isDateExpired(currentDate, startDate) && GlobalFunctions.isDateExpired(endDate, currentDate);

    return isCurrentStep;
  }
  render() {
    const timeline = this.props.debate.debateData.config.home.steps;
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
                {timeline.map((step, index) => {
                  return (
                    <Col xs={12} sm={6} md={3} className={this.isCurrentStep(index) ? 'no-padding step' : 'no-padding step hidden-xs'} key={`step${index}`}>
                      <Step imgUrl={step.imgUrl} startDate={step.startDate} index={index} title={`home.step${index}Title`} text={`home.step${index}Text`} />
                    </Col>
                  );
                })}
              </Row>
              <Row className="no-margin">
                {timeline.map((step, index) => {
                  return (
                    <Col xs={3} sm={3} md={3} className={'no-padding bar'} key={`timeline${index}`}>
                      <Timeline index={index} currentStep={this.isCurrentStep(index)} />
                    </Col>
                  );
                })}
              </Row>
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

export default connect(MapStateToProps)(Steps);