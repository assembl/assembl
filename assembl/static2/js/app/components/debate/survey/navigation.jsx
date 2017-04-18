import React from 'react';
import { Grid, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { getDomElementOffset, scrollToElement, calculatePercentage } from '../../../utils/globalFunctions';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';

class Navigation extends React.Component {
  constructor(props) {
    super(props);
    const { questionsLength } = this.props;
    this.displayNav = this.displayNav.bind(this);
    this.displayPagination = this.displayPagination.bind(this);
    this.scrollToNextQuestion = this.scrollToNextQuestion.bind(this);
    this.scrollToPreviousQuestion = this.scrollToPreviousQuestion.bind(this);
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
    this.setState({
      questionsLength: nextProps.questionsLength
    }, () => {
      this.displayNav();
      this.displayPagination();
    });
  }
  componentWillUnmount() {
    window.removeEventListener('scroll', this.displayNav);
    window.removeEventListener('scroll', this.displayPagination);
  }
  getQuestionsOffset(questionsLength) { //eslint-disable-line
    const offsetArray = [];
    for (let i = 0; i < questionsLength; i += 1) {
      const questionOffset = Number(getDomElementOffset(document.getElementsByClassName('question-title')[i]).top);
      offsetArray.push(questionOffset);
    }
    return offsetArray;
  }
  displayNav() {
    const proposals = document.getElementById('proposals');
    const proposalsOffset = getDomElementOffset(proposals).top;
    const firstTextarea = document.getElementsByClassName('txt-area')[0];
    if (!firstTextarea) {
      return;
    }
    const limitToHide = getDomElementOffset(firstTextarea).top + firstTextarea.clientHeight;
    const limitToShow = limitToHide + document.getElementById('nav').clientHeight;
    const windowOffset = window.pageYOffset + window.innerHeight;
    const { debateData } = this.props.debate;
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, 'survey');
    if (windowOffset < limitToHide && isPhaseCompleted) {
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
        navBottom: proposals.clientHeight
      });
    } else {
      this.setState({
        navPosition: 'fixed',
        navBottom: 0
      });
    }
  }
  displayPagination() {
    const questionsOffset = this.getQuestionsOffset(this.state.questionsLength);
    const windowOffset = window.pageYOffset + window.innerHeight;
    let currentQuestionNumber = 0;
    for (let i = 0; i < this.state.questionsLength; i += 1) {
      if (windowOffset > questionsOffset[i]) {
        currentQuestionNumber = i + 1;
      }
    }
    this.setState({
      currentQuestionNumber: currentQuestionNumber
    });
  }
  scrollToNextQuestion() {
    const navbarHeight = document.getElementById('timeline').clientHeight;
    const target = document.getElementById(`q${this.state.currentQuestionNumber + 1}`);
    const targetOffset = Number(getDomElementOffset(target).top) + navbarHeight;
    scrollToElement(document.body, targetOffset, 600);
  }
  scrollToPreviousQuestion() {
    const navbarHeight = document.getElementById('timeline').clientHeight;
    const target = document.getElementById(`q${this.state.currentQuestionNumber - 1}`);
    const targetOffset = Number(getDomElementOffset(target).top) + navbarHeight;
    scrollToElement(document.body, targetOffset, 600);
  }
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
                      <Translate value="debate.survey.question_x_on_total" current={this.state.currentQuestionNumber} total={this.state.questionsLength} />
                    </div>
                    <div className="bar" style={{ width: `${barWidth}%` }}>&nbsp;</div>
                    <div className="bkg-bar">&nbsp;</div>
                  </div>
                </Col>
                <Col xs={6} md={6} className="no-padding">
                  <div className="arrow right" onClick={this.state.currentQuestionNumber === this.state.questionsLength ? null : this.scrollToNextQuestion}>
                    <span className="assembl-icon-down-open" />
                  </div>
                  <div className="arrow right" onClick={this.state.currentQuestionNumber === 1 ? null : this.scrollToPreviousQuestion}>
                    <span className="assembl-icon-up-open" />
                  </div>
                </Col>
              </Col>
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate
  };
};

export default connect(mapStateToProps)(Navigation);