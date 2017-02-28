import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';
import MapStateToProps from '../../store/mapStateToProps';
import Synthesis from './header/synthesis';

class SynthesisContainer extends React.Component {
  render() {
    const { synthesis } = this.props.synthesis;
    return (
      <section className="synthesis-section">
        <Grid fluid className="background-light">
          <div className="max-container">
            <div className="content-section">
              <Row>
                <Col md={12}>
                  {synthesis && Object.keys(synthesis.lastPublishedSynthesis).length > 0 &&
                    <Synthesis />
                  }
                </Col>
              </Row>
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

export default connect(MapStateToProps)(SynthesisContainer);