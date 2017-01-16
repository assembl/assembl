import React from 'react';
import { connect } from 'react-redux';
import DebateActions from '../actions/debateActions';
import Loading from '../components/common/loading';
import Error from '../components/common/error';
import Navbar from '../components/common/navbar';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.props.fetchDebateData('6');
  }
  render() {
    const { debateData, loading, error } = this.props.debate;
    return (
      <div>
        {loading && <Loading />}
        {debateData &&
          <div>
            <Navbar />
            <div className="app-content">{this.props.children}</div>
          </div>
        }
        {error && <Error />}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchDebateData: (id) => {
      dispatch(DebateActions.fetchDebateData(id));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);