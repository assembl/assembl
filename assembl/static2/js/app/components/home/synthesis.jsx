import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';
import Synthesis from './header/synthesis';

class SynthesisContainer extends React.Component {
  render() {
    const { synthesis } = this.props.synthesis;
    return (
      <section className="home-section synthesis-section">
        <Grid fluid className="background-light">
          <div className="max-container">
            <div style={{ margin: '20px 0' }}>
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

const mapStateToProps = (state) => {
  return {
    synthesis: state.synthesis
  };
};

export default connect(mapStateToProps)(SynthesisContainer);