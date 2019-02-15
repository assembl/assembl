// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';

import Header from '../components/home/header';
import Objectives from '../components/home/objectives';
import Phases from '../components/home/phases';
import Video from '../components/home/video';
import Twitter from '../components/home/twitter';
import Chatbot from '../components/home/chatbot';
import Partners from '../components/home/partners';
import ScrollOnePageButton from '../components/common/scrollOnePageButton';
import MessagePage from '../components/common/messagePage';

class Home extends React.Component {
  state = {
    scrollOnePageButtonHidden: false
  };

  componentWillMount() {
    window.addEventListener('scroll', this.hideScrollOnePageButton);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.hideScrollOnePageButton);
  }

  hideScrollOnePageButton = debounce(() => {
    if (!this.state.scrollOnePageButtonHidden) {
      this.setState(() => ({
        scrollOnePageButtonHidden: true
      }));
    }
  }, 100);

  render() {
    const { objectives, video, twitter, chatbot, partners } = this.props.debate.debateData;
    const { locale } = this.props.i18n;
    const { timeline } = this.props;
    if (!timeline) {
      // timeline is still loading
      return null;
    }
    if (timeline.length === 0) {
      return <MessagePage title={I18n.t('home.assemblNotConfigured')} text={I18n.t('administration.noTimeline')} />;
    }

    return (
      <div className="home">
        <Header />
        <ScrollOnePageButton hidden={this.state.scrollOnePageButtonHidden} />
        {objectives && <Objectives />}
        {timeline.length > 1 && <Phases />}
        {video && <Video />}
        {twitter && <Twitter />}
        {chatbot && <Chatbot chatbot={chatbot} locale={locale} />}
        {partners && <Partners />}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  debate: state.debate,
  timeline: state.timeline,
  i18n: state.i18n
});

export default connect(mapStateToProps)(Home);