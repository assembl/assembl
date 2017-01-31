import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row } from 'react-bootstrap';
import MapStateToProps from '../../store/mapStateToProps';
import Loader from '../common/loader';
import Error from '../common/error';

class MessagesList extends React.Component {
  render() {
    const { posts, postsLoading, postsError } = this.props.posts;
    return (
      <div>
        {postsLoading && <Loader />}
        {posts &&
          <Grid fluid>
            <Row className="max-container">
              {posts.posts.map((post) => {
                return (
                  <div className="box" key={post['@id']}>
                    <div>{post.body.entries[0].value}</div>
                  </div>
                );
              })}
            </Row>
          </Grid>
        }
        {postsError && <Error errorMessage={postsError} />}
      </div>
    );
  }
}

export default connect(MapStateToProps)(MessagesList);