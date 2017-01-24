import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import MapStateToProps from '../store/mapStateToProps';
import Loader from '../components/common/loader';
import Error from '../components/common/error';

class Debate extends React.Component {
  render() {
    const { posts, postsLoading, postsError } = this.props.posts;
    return (
      <div>
        {postsLoading && <Loader />}
        {posts && <p><Translate value="debate.panelTitle" /></p>}
        {postsError && <Error errorMessage={postsError} />}
      </div>
    );
  }
}

export default connect(MapStateToProps)(Debate);