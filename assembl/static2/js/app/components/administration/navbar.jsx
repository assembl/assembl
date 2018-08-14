// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Col, OverlayTrigger } from 'react-bootstrap';

import { getDiscussionSlug, calculatePercentage } from '../../utils/globalFunctions';
import { get } from '../../utils/routeMap';
import { nextStepTooltip, previousStepTooltip } from '../common/tooltips';
import { browserHistory } from '../../router';

type Props = {
  steps: Array<string>,
  currentStep: string,
  phaseIdentifier: string,
  beforeChangeSection: Function,
  queryArgs: Object
};

type State = {
  steps: Array<string>,
  currentStep: string
};

class Navbar extends React.Component<Props, State> {
  static defaultProps = {
    beforeChangeSection: () => {},
    queryArgs: {}
  };

  constructor(props: Props) {
    super(props);
    const { currentStep, steps } = this.props;
    this.state = {
      currentStep: currentStep,
      steps: steps
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    this.setState({
      currentStep: nextProps.currentStep,
      steps: nextProps.steps
    });
  }

  goToSection = (stepNb: number) => {
    const slug = { slug: getDiscussionSlug() };
    const stepId = this.state.steps[stepNb - 1];
    const { phaseIdentifier, queryArgs } = this.props;
    browserHistory.push(`${get('administration', { ...slug, id: phaseIdentifier }, { section: stepNb, ...queryArgs })}`);
    this.setState({
      currentStep: stepId
    });
  };

  render() {
    const { currentStep, steps } = this.state;
    const { beforeChangeSection } = this.props;
    const currentStepIndex = steps.indexOf(currentStep) + 1;
    const barWidth = calculatePercentage(currentStepIndex, steps.length);
    return (
      <div className="admin-navbar">
        <Col xs={6} md={6}>
          <div className="step-numbers">
            <div className="txt">
              <Translate value="administration.step_x_total" num={currentStepIndex} total={steps.length} />
            </div>
            <div className="bar" style={{ width: `${barWidth}%` }}>
              &nbsp;
            </div>
            <div className="bkg-bar">&nbsp;</div>
          </div>
        </Col>
        <Col xs={6} md={6}>
          <div className="arrow-container">
            {currentStepIndex < steps.length && (
              <OverlayTrigger placement="top" overlay={nextStepTooltip}>
                <div
                  onClick={() => {
                    beforeChangeSection();
                    this.goToSection(currentStepIndex + 1);
                  }}
                  className="arrow right"
                >
                  <span className="assembl-icon-up-open" />
                </div>
              </OverlayTrigger>
            )}
            {currentStepIndex > 1 && (
              <OverlayTrigger placement="top" overlay={previousStepTooltip}>
                <div
                  onClick={() => {
                    beforeChangeSection();
                    this.goToSection(currentStepIndex - 1);
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