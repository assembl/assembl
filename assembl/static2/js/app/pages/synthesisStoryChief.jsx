// @flow
import React from 'react';
import { connect } from 'react-redux';
import Section from '../components/common/section';

type Props = {
  title: string,
  url: string
};

class Synthesis extends React.Component {
  componentDidMount() {
    window.addEventListener('load', this.handleLoad);
  }

  handleLoad = () => {
    const storyChiefNavbar = document.querySelector(
      'body > main > main > div > div > div.story-hero__left.text-center.hidden-sm.hidden-xs > div.story__social.story__social--absolute > div'
    );
    storyChiefNavbar.remove();
  };

  render() {
    const { title, url } = this.props;
    return (
      <Section title={title}>
        <div className="synthesis">
          <iframe src={url} title="storychief-iframe" frameBorder="0" className="synthesis-iframe" />
        </div>
      </Section>
    );
  }
}

const mockProps = () => ({
  title: 'Un bon titre de synthèse',
  url: 'https://bluenovev3.storychief.io/culture-manager-phase-2'
});

export default connect(mockProps)(Synthesis);