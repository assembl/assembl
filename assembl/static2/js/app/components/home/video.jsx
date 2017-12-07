import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Grid, Row, Col } from 'react-bootstrap';

class Video extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isTextHigher: false
    };
  }

  componentWillReceiveProps() {
    const { debateData } = this.props.debate;
    const videoTxt = document.getElementById('video-txt');
    const video = document.getElementById('video-vid');
    if (debateData.videoUrl && videoTxt) {
      const textHeight = videoTxt.clientHeight;
      const videoHeight = video.clientHeight;
      if (textHeight > videoHeight + 5) this.setState({ isTextHigher: true });
    }
  }

  render() {
    const { debateData } = this.props.debate;
    const { locale } = this.props.i18n;
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
                        <iframe src={debateData.video.videoUrl} frameBorder="0" width="560" height="315" title="video" />
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
  debate: state.debate,
  i18n: state.i18n
});

export default connect(mapStateToProps)(Video);