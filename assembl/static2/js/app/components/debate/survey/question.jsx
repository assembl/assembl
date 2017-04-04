import React from 'react';
import { Translate, I18n } from 'react-redux-i18n';
import { Grid, Col, FormGroup, FormControl, Button } from 'react-bootstrap';

class Questions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      componentHeight: 0,
      screenHeight: 0,
      remainingChars: 0,
      showSubmitButton: false
    };
    this.updateDimensions = this.updateDimensions.bind(this);
  }
  componentDidMount() {
    const maxChars = this.txtarea.props.maxLength;
    this.setState({
      remainingChars: maxChars
    });
    this.updateDimensions();
    window.addEventListener('resize', this.updateDimensions);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }
  updateDimensions() {
    const componentHeight = this.question.clientHeight;
    const screenHeight = window.innerHeight - document.getElementById('navbar').clientHeight;
    const screenWidth = window.innerWidth;
    setTimeout(() => {
      this.setState({
        screenHeight: screenHeight,
        componentHeight: componentHeight,
        screenWidth: screenWidth
      });
    }, 600);
  }
  getRemainingChars(e) {
    const maxChars = this.txtarea.props.maxLength;
    const remainingChars = maxChars - e.currentTarget.value.length;
    this.setState({
      remainingChars: remainingChars
    });
  }
  displaySubmitButton(e) {
    const nbChars = e.currentTarget.value.length;
    if(nbChars > 10) {
      this.setState({
        showSubmitButton: true
      });
    } else {
      this.setState({
        showSubmitButton: false
      });
    }
  }
  render() {
    const { index, title } = this.props;
    return (
      <section
        className="questions-section"
        id={`q${index}`}
        ref={(q) => { this.question = q; }}
        style={
          this.state.componentHeight < this.state.screenHeight && this.state.screenWidth >= 600 ?
            { height: this.state.screenHeight } : { height: `${100}%` }
        }
      >
        <Grid fluid className="background-grey">
          <div className="max-container">
            <div className="question-title">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                {`${index}/ ${title}`}
              </h1>
            </div>
            <Col xs={12} md={9} className="col-centered">
              <FormGroup className="no-margin" controlId="formControlsTextarea">
                <FormControl
                  className="txt-area"
                  componentClass="textarea"
                  placeholder={I18n.t('debate.survey.txtAreaPh')}
                  onClick={this.props.redirectToLogin}
                  onKeyUp={(e) => {
                    this.getRemainingChars(e);
                    this.displaySubmitButton(e);
                  }}
                  maxLength={1200}
                  ref={(t) => { this.txtarea = t; }}
                />
              </FormGroup>
              <div className="annotation right margin-s">
                <Translate value="debate.survey.remaining_x_characters" nbCharacters={this.state.remainingChars} />
              </div>
              {this.state.showSubmitButton &&
                <Button className="button-submit button-dark right margin-m clear">
                  <Translate value="debate.survey.submit" />
                </Button>
              }
            </Col>
          </div>
        </Grid>
      </section>
    );
  }
}

export default Questions;