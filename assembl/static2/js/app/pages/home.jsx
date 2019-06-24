// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import { compose, graphql } from 'react-apollo';

import Header from '../components/home/header';
import Objectives from '../components/home/objectives';
import Phases from '../components/home/phases';
import Video from '../components/home/video';
import Twitter from '../components/home/twitter';
import Chatbot from '../components/home/chatbot';
import Partners from '../components/home/partners';
import ScrollOnePageButton from '../components/common/scrollOnePageButton';
import MessagePage from '../components/common/messagePage';
import Section from '../components/common/section';
import LandingPageModulesQuery from '../graphql/LandingPageModulesQuery.graphql';
import { renderRichtext } from '../utils/linkify';

type Props = {
  timeline: Timeline,
  debate: DebateData,
  landingPageModules: Array<LandingPageModule>,
  locale: string
};

type State = {
  scrollOnePageButtonHidden: boolean
};

class Home extends React.Component<Props, State> {
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
    const { landingPageModules, locale, timeline } = this.props;
    if (!timeline) {
      // timeline is still loading
      return null;
    }
    if (timeline.length === 0) {
      return <MessagePage title={I18n.t('home.assemblNotConfigured')} text={I18n.t('administration.noTimeline')} />;
    }
    const textMultimediaSections =
      !!landingPageModules &&
      landingPageModules.map((landingPageModule: LandingPageModule) => {
        if (!landingPageModule.enabled || (!landingPageModule.body && !landingPageModule.title)) {
          return null;
        }
        return (
          <Section key={landingPageModule.id} title={landingPageModule.title || ''}>
            {renderRichtext(landingPageModule.body || '')}
          </Section>
        );
      });
    return (
      <div className="home">
        <Header />
        {textMultimediaSections}
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
  locale: state.i18n.locale
});

export default compose(
  connect(mapStateToProps),
  graphql(LandingPageModulesQuery, {
    options: props => ({
      variables: { lang: props.locale }
    }),
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading
        };
      }
      return {
        error: data.error,
        loading: data.loading,
        landingPageModules: data.landingPageModules
      };
    }
  })
)(Home);