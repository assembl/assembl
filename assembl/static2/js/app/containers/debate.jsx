import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';
import MapStateToProps from '../store/mapStateToProps';
import Loader from '../components/common/loader';
import Error from '../components/common/error';

class Debate extends React.Component {
  render() {
    const { posts, postsLoading, postsError } = this.props.posts;
    return (
      <div>
        {postsLoading && <Loader />}
        {posts &&
          <Grid fluid className="max-container">
            <Row>
              <Col xs={12} sm={12}>
                <Translate value="debate.panelTitle" />
              </Col>
            </Row>
          </Grid>
        }
        {postsError && <Error errorMessage={postsError} />}
      </div>
    );
  }
}

export default connect(MapStateToProps)(Debate);