import React from 'react';
import { connect } from 'react-redux';
import Header from '../components/home/header';
import Synthesis from '../components/home/synthesis';
import Objectives from '../components/home/objectives';
import Phases from '../components/home/phases';
import Video from '../components/home/video';
import Twitter from '../components/home/twitter';
import Contact from '../components/home/contact';
import Partners from '../components/home/partners';

class Home extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    return (
      <div className="home">
        <Header />
        <Synthesis />
        {debateData.objectives &&
          <Objectives />
        }
        {(debateData.timeline && debateData.timeline.length > 1) &&
          <Phases />
        }
        {debateData.videoUrl &&
          <Video />
        }
        {debateData.twitter &&
          <Twitter />
        }
        <Contact />
        <Partners />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate
  };
};

export default connect(mapStateToProps)(Home);