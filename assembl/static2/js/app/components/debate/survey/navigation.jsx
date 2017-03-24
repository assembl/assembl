import React from 'react';
import { Grid, Col } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { getDomElementOffset, scrollToElement, getCssAttribute, calculatePercentage } from '../../../utils/globalFunctions';

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
    });
  }
  componentWillUnmount() {
    window.removeEventListener('scroll', this.displayNav);
    window.removeEventListener('scroll', this.displayPagination);
  }
  getQuestionsOffset(questionsLength) { //eslint-disable-line
    const marginTop = getCssAttribute('.question-title-section', 'marginTop', 'px').marginTop;
    const offsetArray = [];
    for (let i = 0; i < questionsLength; i += 1) {
      const questionOffset = Number(getDomElementOffset(document.getElementsByClassName('question-title-section')[i]).top + (marginTop * 2));
      offsetArray.push(questionOffset);
    }
    return offsetArray;
  }
  displayNav() {
    const proposals = document.getElementById('proposals');
    const proposalsOffset = getDomElementOffset(proposals).top;
    const limiteToShow = getDomElementOffset(document.getElementsByClassName('txt-area')[0]).top + document.getElementsByClassName('txt-area')[0].clientHeight + document.getElementById('nav').clientHeight;
    const limiteToHide = getDomElementOffset(document.getElementsByClassName('txt-area')[0]).top + document.getElementsByClassName('txt-area')[0].clientHeight;
    const windowOffset = window.pageYOffset + window.innerHeight;
    if (windowOffset < limiteToHide) {
      this.setState({
        isHidden: true
      });
    }
    if (windowOffset > limiteToShow) {
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
    const target = document.getElementById(`q${this.state.currentQuestionNumber + 1}`);
    const targetOffset = getDomElementOffset(target).top;
    scrollToElement(document.body, targetOffset, 600);
  }
  scrollToPreviousQuestion() {
    const target = document.getElementById(`q${this.state.currentQuestionNumber - 1}`);
    const targetOffset = getDomElementOffset(target).top;
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
                      <Translate value="debate.survey.question" />
                      &nbsp;{this.state.currentQuestionNumber}&nbsp;
                      <Translate value="debate.survey.on" />
                      &nbsp;{this.state.questionsLength}
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

export default Navigation;