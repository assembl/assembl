import React from 'react';
import { connect } from 'react-redux';
import Header from '../components/home/header';
import Synthesis from '../components/home/synthesis';
import Objectives from '../components/home/objectives';
import Phases from '../components/home/phases';
import Video from '../components/home/video';
import Twitter from '../components/home/twitter';
import Contact from '../components/home/contact';
import Chatbot from '../components/home/chatbot';
import Partners from '../components/home/partners';

class Home extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { locale } = this.props.i18n;
    return (
      <div className="home">
        <Header />
        <Synthesis />
        {debateData.objectives && <Objectives />}
        {debateData.timeline && debateData.timeline.length > 1 && <Phases />}
        {debateData.video && <Video />}
        {debateData.twitter && <Twitter />}
        <Contact />
        {debateData.chatbot && <Chatbot chatbot={debateData.chatbot} locale={locale} />}
        {debateData.partners && <Partners />}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    i18n: state.i18n
  };
};

export default connect(mapStateToProps)(Home);