import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';
import Synthesis from './header/synthesis';
import { getDiscussionId } from '../../utils/globalFunctions';
import { fetchSynthesis } from '../../actions/synthesisActions';

class SynthesisContainer extends React.Component {
  componentWillMount() {
    const discussionId = getDiscussionId();
    this.props.fetchSynthesis(discussionId);
  }

  render() {
    const { synthesis } = this.props;
    return (
      <div>
        {synthesis ? (
          <section className="home-section synthesis-section">
            <Grid fluid className="background-light">
              <div className="max-container">
                <div style={{ margin: '20px 0' }}>
                  <Row>
                    <Col md={12}>
                      <Synthesis synthesis={synthesis} />
                    </Col>
                  </Row>
                </div>
              </div>
            </Grid>
          </section>
        ) : null}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  synthesis: state.synthesis
});

const mapDispatchToProps = dispatch => ({
  fetchSynthesis: (discussionId) => {
    dispatch(fetchSynthesis(discussionId));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(SynthesisContainer);