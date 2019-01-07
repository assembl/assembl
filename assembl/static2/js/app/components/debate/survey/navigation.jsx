import React from 'react';
import { Grid, Col } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import debounce from 'lodash/debounce';

import { getDomElementOffset, calculatePercentage } from '../../../utils/globalFunctions';
import { SMALL_SCREEN_WIDTH } from '../../../constants';
import { withScreenDimensions } from '../../common/screenDimensions';

class Navigation extends React.Component {
  constructor(props) {
    super(props);
    const { questionsLength } = this.props;
    this.state = {
      navPosition: 'fixed',
      navBottom: 0,
      isHidden: true,
      questionsLength: questionsLength,
      currentQuestionNumber: 0
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.displayNav);
    window.addEventListener('scroll', this.displayPagination);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(
      {
        questionsLength: nextProps.questionsLength
      },
      () => {
        this.displayNav();
        this.displayPagination();
        if (nextProps.isScroll && nextProps.questionIndex && this.props.screenWidth >= SMALL_SCREEN_WIDTH) {
          this.scrollToQuestion(nextProps.questionIndex);
        }
      }
    );
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.displayNav);
    window.removeEventListener('scroll', this.displayPagination);
  }

  getQuestionsOffset(questionsLength) {
    const offsetArray = [];
    this.questionsLength = questionsLength;
    for (let i = 0; i < this.questionsLength; i += 1) {
      if (!document.getElementsByClassName('question-title')[i]) {
        return;
      }
      const questionOffset = Number(getDomElementOffset(document.getElementsByClassName('question-title')[i]).top);
      offsetArray.push(questionOffset + 40);
    }
    return offsetArray; // eslint-disable-line
  }

  displayNav = debounce(() => {
    const proposals = document.getElementById('proposals');
    if (!proposals) {
      return;
    }
    const proposalsOffset = getDomElementOffset(proposals).top;
    const firstTextarea = document.getElementsByClassName('rich-text-editor')[0];
    if (!firstTextarea) {
      return;
    }
    const limitToHide = getDomElementOffset(firstTextarea).top + firstTextarea.clientHeight;
    const limitToShow = limitToHide + document.getElementById('nav').clientHeight;
    const windowOffset = window.pageYOffset + this.props.screenHeight;
    const { isPhaseCompleted } = this.props;
    if (windowOffset < limitToHide && !isPhaseCompleted) {
      this.setState({
        isHidden: true
      });
    }
    if (windowOffset > limitToShow && !isPhaseCompleted) {
      this.setState({
        isHidden: false
      });
    }
    if (windowOffset > proposalsOffset) {
      this.setState({
        navPosition: 'absolute',
        navBottom: proposals.clientHeight,
        isHidden: true
      });
    } else {
      this.setState({
        navPosition: 'fixed',
        navBottom: 0
      });
    }
  }, 100);

  displayPagination = debounce(() => {
    const questionsOffset = this.getQuestionsOffset(this.state.questionsLength);
    if (!questionsOffset) {
      return;
    }
    const windowOffset = window.pageYOffset + this.props.screenHeight;
    let currentQuestionNumber = 0;
    for (let i = 0; i < this.state.questionsLength; i += 1) {
      if (windowOffset > questionsOffset[i]) {
        currentQuestionNumber = i + 1;
      }
    }
    this.setState({
      currentQuestionNumber: currentQuestionNumber
    });
  }, 100);

  scrollToQuestion = (questionIndex) => {
    let target;
    if (questionIndex > this.state.questionsLength) {
      target = document.getElementById('proposals');
    } else {
      target = document.getElementById(`q${questionIndex}`);
    }
    const targetOffset = Number(getDomElementOffset(target).top);
    window.scrollTo({ top: targetOffset - 80, left: 0, behavior: 'smooth' });
    this.props.scrollToQuestion(false);
  };

  render() {
    const barWidth = calculatePercentage(this.state.currentQuestionNumber, this.state.questionsLength);
    return (
      <section
        className={this.state.isHidden ? 'hidden' : 'shown navigation-section background-color'}
        id="nav"
        style={{ position: this.state.navPosition, bottom: this.state.navBottom }}
      >
        <Grid fluid>
          <div className="max-container">
            <div className="question-nav">
              <Col xs={12} md={9} className="col-centered">
                <Col xs={6} md={6} className="no-padding">
                  <div className="question-numbers">
                    <div className="txt">
                      <Translate
                        value="debate.survey.question_x_on_total"
                        current={this.state.currentQuestionNumber}
                        total={this.state.questionsLength}
                      />
                    </div>
                    <div className="bar" style={{ width: `${barWidth}%` }}>
                      &nbsp;
                    </div>
                    <div className="bkg-bar">&nbsp;</div>
                  </div>
                </Col>
                <Col xs={6} md={6} className="no-padding">
                  <div
                    className="arrow right"
                    onClick={() => {
                      this.scrollToQuestion(this.state.currentQuestionNumber + 1);
                    }}
                  >
                    <span className="assembl-icon-down-open" />
                  </div>
                  {this.state.currentQuestionNumber > 1 && (
                    <div
                      className="arrow right"
                      onClick={() => {
                        this.scrollToQuestion(this.state.currentQuestionNumber - 1);
                      }}
                    >
                      <span className="assembl-icon-up-open" />
                    </div>
                  )}
                </Col>
              </Col>
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

export default withScreenDimensions(Navigation);