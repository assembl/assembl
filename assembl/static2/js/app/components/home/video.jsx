// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';

import Medias from '../common/medias';

export type Props = {
  locale: string,
  video: DebateVideo
};

type State = {
  isTextHigher: boolean
};

export class Video extends React.Component<Props, State> {
  static getDerivedStateFromProps(props: Props) {
    const { video } = props;
    const videoTxt = document.getElementById('video-txt');
    const domVideo = document.getElementById('video-vid');
    if (video.videoUrl && videoTxt && domVideo) {
      const textHeight = videoTxt.clientHeight;
      const videoHeight = domVideo.clientHeight;
      if (textHeight > videoHeight + 5) return { isTextHigher: true };
    }
    return null;
  }

  state = { isTextHigher: false };

  render() {
    const { video } = this.props;
    const { locale } = this.props;
    return (
      <section className="home-section video-section">
        <Grid fluid>
          <div className="max-container">
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                {video.titleEntries ? video.titleEntries[locale] : <Translate value="home.video" />}
              </h1>
            </div>
            <div className="content-section">
              <div className="content-margin">
                <Row>
                  {video.descriptionEntriesTop && (
                    <Col xs={12} md={6} className={this.state.isTextHigher ? 'col-bottom' : ''}>
                      <div className="text" id="video-txt">
                        {video.descriptionEntriesTop[locale]}
                      </div>
                    </Col>
                  )}
                  {video.videoUrl && (
                    <Col xs={12} md={6} className={this.state.isTextHigher ? 'col-bottom' : ''}>
                      <div className="video-container" id="video-vid">
                        <Medias path={video.videoUrl} />
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
  locale: state.i18n.locale,
  video: state.debate.debateData.video
});

export default connect(mapStateToProps)(Video);