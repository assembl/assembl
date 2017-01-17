import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Glyphicon } from 'react-bootstrap';
import Loader from '../common/loader';
import Error from '../common/error';

class Statistic extends React.Component {
  render() {
    const { posts, postsLoading, postsError } = this.props.posts;
    const { users, usersLoading, usersError } = this.props.users;
    return (
      <div className="statistic">
        <div className="inline">
          {postsLoading && <Loader textHidden />}
          {postsError && <Error />}
          {posts &&
            <div className="inline">
              <div className="black-icon"><Glyphicon glyph="comment" /></div>
              <div className="stat">{posts.total} <Translate value="home.contribution" /></div>
            </div>
          }
        </div>
        <div className="inline">
          {usersLoading && <Loader textHidden />}
          {usersError && <Error />}
          {users &&
            <div className="inline">
              <div className="black-icon"><Glyphicon glyph="user" /></div>
              <div className="stat">{users.totalVerifiedUsers} <Translate value="home.participant" /></div>
            </div>
          }
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    posts: state.posts,
    users: state.users
  };
};

export default connect(mapStateToProps)(Statistic);