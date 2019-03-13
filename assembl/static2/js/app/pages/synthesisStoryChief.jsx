// @flow
import React from 'react';
import { connect } from 'react-redux';
import Section from '../components/common/section';

type Props = {
  title: string,
  url: string
};

class Synthesis extends React.Component<Props> {
  handleLoad = () => {};

  render() {
    const { title, url } = this.props;
    return (
      <Section title={title}>
        <div className="synthesis">
          <iframe
            ref={(iframe) => {
              if (iframe) {
                this.iframe = iframe;
              }
            }}
            src={url}
            title="storychief-iframe"
            frameBorder="0"
            className="synthesis-iframe"
          />
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