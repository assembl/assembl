import React from 'react';
import { I18n } from 'react-redux-i18n';
import { Grid, Col, FormGroup, ControlLabel, FormControl } from 'react-bootstrap';


class Questions extends React.Component {
  render() {
    return (
      <section className="questions-section">
        <Grid fluid className="background-grey">
          <div className="max-container">
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                {this.props.title}
              </h1>
            </div>
            <Col xs={12} md={9} className="col-centered">
              <FormGroup className="margin-xl" controlId="formControlsTextarea">
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