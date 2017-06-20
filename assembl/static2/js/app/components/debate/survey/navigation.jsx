import React from 'react';
import { Grid, Col } from 'react-bootstrap';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { getDomElementOffset, scrollToPosition, calculatePercentage } from '../../../utils/globalFunctions';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';

// This is the minimum width to make this navigation bar usable
const MIN_WIDTH = 768;

class Navigation extends React.Component {
  constructor(props) {
    super(props);
    const { questionsLength } = this.props;
    this.displayNav = this.displayNav.bind(this);
    this.displayPagination = this.displayPagination.bind(this);
    this.scrollToQuestion = this.scrollToQuestion.bind(this);
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
      if (nextProps.isScroll && nextProps.questionIndex && window.innerWidth >= MIN_WIDTH) {
        this.scrollToQuestion(nextProps.questionIndex);
      }
    });
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
  displayNav() {
    const proposals = document.getElementById('proposals');
    if (!proposals) {
      return;
    }
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
  }
  displayPagination() {
    const navbarHeight = document.getElementById('timeline').clientHeight;
    const questionsOffset = this.getQuestionsOffset(this.state.questionsLength);
    if (!questionsOffset) {
      return;
    }
    const windowOffset = window.pageYOffset + window.innerHeight;
    let currentQuestionNumber = 0;
    for (let i = 0; i < this.state.questionsLength; i += 1) {
      if (windowOffset > (questionsOffset[i] + navbarHeight)) {
        currentQuestionNumber = i + 1;
      }
    }
    this.setState({
      currentQuestionNumber: currentQuestionNumber
    });
  }
  scrollToQuestion(questionIndex) {
    const navbarHeight = document.getElementById('timeline').clientHeight;
    let target;
    if (questionIndex > this.state.questionsLength) {
      target = document.getElementById('proposals');
    } else {
      target = document.getElementById(`q${questionIndex}`);
    }
    const targetOffset = Number(getDomElementOffset(target).top) + navbarHeight;
    scrollToPosition((targetOffset - 40), 600);
    this.props.scrollToQuestion(false);
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
                  <div
                    className="arrow right"
                    onClick={() => { this.scrollToQuestion(this.state.currentQuestionNumber + 1); }}
                  >
                    <span className="assembl-icon-down-open" />
                  </div>
                  {this.state.currentQuestionNumber > 1 &&
                    <div
                      className="arrow right"
                      onClick={() => { this.scrollToQuestion(this.state.currentQuestionNumber - 1); }}
                    >
                      <span className="assembl-icon-up-open" />
                    </div>
                  }
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