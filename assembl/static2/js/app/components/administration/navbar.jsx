import React from 'react';
import { browserHistory } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { Col, OverlayTrigger } from 'react-bootstrap';
import { getDiscussionSlug, calculatePercentage } from '../../utils/globalFunctions';
import { get } from '../../utils/routeMap';
import { nextStepTooltip, previousStepTooltip } from '../common/tooltips';

class Navbar extends React.Component {
  static defaultProps = {
    beforeChangeSection: () => {}
  };

  constructor(props) {
    super(props);
    const { currentStep, totalSteps } = this.props;
    this.state = {
      currentStep: currentStep,
      totalSteps: totalSteps
    };
    this.goToSection = this.goToSection.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      currentStep: nextProps.currentStep,
      totalSteps: nextProps.totalSteps
    });
  }

  goToSection(stepNb) {
    const slug = { slug: getDiscussionSlug() };
    const { phaseIdentifier } = this.props;
    browserHistory.push(
      `${get('administration', slug)}${get('adminPhase', { ...slug, phase: phaseIdentifier })}?section=${stepNb}`
    );
    this.setState({
      currentStep: stepNb
    });
  }

  render() {
    const { currentStep, totalSteps } = this.state;
    const { beforeChangeSection } = this.props;
    const barWidth = calculatePercentage(currentStep, totalSteps);
    return (
      <div className="admin-navbar">
        <Col xs={6} md={6}>
          <div className="step-numbers">
            <div className="txt">
              <Translate value="administration.step_x_total" num={currentStep} total={totalSteps} />
            </div>
            <div className="bar" style={{ width: `${barWidth}%` }}>
              &nbsp;
            </div>
            <div className="bkg-bar">&nbsp;</div>
          </div>
        </Col>
        <Col xs={6} md={6}>
          <div className="arrow-container">
            {currentStep < totalSteps && (
              <OverlayTrigger placement="top" overlay={nextStepTooltip}>
                <div
                  onClick={() => {
                    beforeChangeSection();
                    this.goToSection(currentStep + 1);
                  }}
                  className="arrow right"
                >
                  <span className="assembl-icon-up-open" />
                </div>
              </OverlayTrigger>
            )}
            {currentStep > 1 && (
              <OverlayTrigger placement="top" overlay={previousStepTooltip}>
                <div
                  onClick={() => {
                    beforeChangeSection();
                    this.goToSection(currentStep - 1);
                  }}
                  className="arrow right"
                >
                  <span className="assembl-icon-down-open" />
                </div>
              </OverlayTrigger>
            )}
          </div>
        </Col>
      </div>
    );
  }
}

export default Navbar;