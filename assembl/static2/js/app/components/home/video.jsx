import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid, Col } from 'react-bootstrap';

class Video extends React.Component {
  render() {
    return (
      <section className="video-section">
        <Grid fluid className="background-light">
          <div className="max-container">
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                <Translate value="home.video" />
              </h1>
            </div>
            <div className="content-section">
              <div className="content-margin">
                <Col xs={12} md={6}>
                  <div className="text">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed cursus tellus id neque accumsan, in facilisis enim vehicula. Duis nec purus quis ligula posuere congue a non erat. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Proin sed sollicitudin nibh. Pellentesque id vulputate velit. Curabitur eu pharetra quam, sed pretium est. Vivamus in massa quis tellus volutpat porta ac non mauris. Nam et dolor volutpat, elementum est id, vestibulum nibh. In placerat magna vel lectus condimentum tincidunt. Integer aliquet ipsum in lacus facilisis sagittis. Mauris feugiat mollis quam a sollicitudin. Nulla iaculis est ac tellus gravida, nec convallis ex mattis. Sed tempus dolor sit amet ornare posuere.
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div className="video-container">
                    <iframe src="https://www.youtube.com/embed/T8gC9fHGpfg" frameBorder="0" width="560" height="315"></iframe>
                  </div>
                </Col>
              </div>
            </div>
          </div>
          <div className="content-end">&nbsp;</div>
        </Grid>
      </section>
    );
  }
}

export default Video;