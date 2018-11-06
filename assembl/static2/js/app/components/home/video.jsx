// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';

import Medias from '../common/medias';

type Props = {
  debateData: DebateData,
  locale: string
};

type State = {
  isTextHigher: boolean
};

class Video extends React.Component<Props, State> {
  static getDerivedStateFromProps(props: Props) {
    const { debateData } = props;
    const videoTxt = document.getElementById('video-txt');
    const video = document.getElementById('video-vid');
    if (debateData.videoUrl && videoTxt) {
      const textHeight = videoTxt.clientHeight;
      const videoHeight = video.clientHeight;
      if (textHeight > videoHeight + 5) return { isTextHigher: true };
    }
    return null;
  }

  state = { isTextHigher: false };

  render() {
    const { debateData } = this.props;
    const { locale } = this.props;
    return (
      <section className="home-section video-section">
        <Grid fluid>
          <div className="max-container">
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                {debateData.video.titleEntries ? debateData.video.titleEntries[locale] : <Translate value="home.video" />}
              </h1>
            </div>
            <div className="content-section">
              <div className="content-margin">
                <Row>
                  {debateData.video.descriptionEntriesTop && (
                    <Col xs={12} md={6} className={this.state.isTextHigher ? 'col-bottom' : ''}>
                      <div className="text" id="video-txt">
                        {debateData.video.descriptionEntriesTop[locale]}
                      </div>
                    </Col>
                  )}
                  {debateData.video.videoUrl && (
                    <Col xs={12} md={6} className={this.state.isTextHigher ? 'col-bottom' : ''}>
                      <div className="video-container" id="video-vid">
                        <Medias path={debateData.video.videoUrl} />
                      </div>
                    </Col>
                  )}
                </Row>
              </div>
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

const mapStateToProps = state => ({
  debateData: state.debate.debateData,
  locale: state.i18n.locale
});

export default connect(mapStateToProps)(Video);