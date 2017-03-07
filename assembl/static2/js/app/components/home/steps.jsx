import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';
import { getDateFromString, isDateExpired } from '../../utils/globalFunctions';
import MapStateToProps from '../../store/mapStateToProps';
import Step from './steps/step';
import Timeline from './steps/timeline';

class Steps extends React.Component {
  isCurrentStep(index) {
    const currentDate = new Date();
    const { debateData } = this.props.debate;
    const startDate = getDateFromString(debateData.timeline[index].startDate);
    const endDate = getDateFromString(debateData.timeline[index].endDate);
    const isCurrentStep = isDateExpired(currentDate, startDate) && isDateExpired(endDate, currentDate);
    return isCurrentStep;
  }
  render() {
    const { debateData } = this.props.debate;
    return (
      <section className="steps-section">
        {debateData.timeline &&
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
                  {debateData.timeline.map((step, index) => {
                    return (
                      <Col xs={12} sm={24 / debateData.timeline.length} md={12 / debateData.timeline.length} className={this.isCurrentStep(index) ? 'no-padding step' : 'no-padding step hidden-xs'} key={`step${index}`}>
                        <Step imgUrl={step.imgUrl} startDate={step.startDate} index={index} title={`home.step${index}Title`} text={`home.step${index}Text`} />
                      </Col>
                    );
                  })}
                </Row>
                <Row className="no-margin">
                  {debateData.timeline.map((step, index) => {
                    return (
                      <Col xs={12 / debateData.timeline.length} sm={12 / debateData.timeline.length} md={12 / debateData.timeline.length} className={'no-padding bar'} key={`timeline${index}`}>
                        <Timeline index={index} currentStep={this.isCurrentStep(index)} />
                      </Col>
                    );
                  })}
                </Row>
              </div>
            </div>
          </Grid>
        }
      </section>
    );
  }
}

export default connect(MapStateToProps)(Steps);