import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Grid, Col, FormGroup, FormControl } from 'react-bootstrap';


class Questions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      componentHeight: 0,
      screenHeight: 0
    };
    this.updateDimensions = this.updateDimensions.bind(this);
  }
  componentDidMount() {
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
  render() {
    const { index } = this.props;
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
            <div className="question-title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                {this.props.title}
              </h1>
            </div>
            <Col xs={12} md={9} className="col-centered">
              <FormGroup className="no-margin" controlId="formControlsTextarea">
                <FormControl className="txt-area" componentClass="textarea" placeholder={I18n.t('debate.survey.txtAreaPh')} />
              </FormGroup>
            </Col>
          </div>
        </Grid>
      </section>
    );
  }
}

export default Questions;