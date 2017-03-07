import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import MapStateToProps from '../../store/mapStateToProps';
import Theme from './themes/theme';
import Loader from '../common/loader';

class Themes extends React.Component {
  render() {
    const { ideas, ideasLoading } = this.props.ideas;
    return (
      <section className="themes-section">
        {ideasLoading && <Loader color="black" />}
        {(ideas && ideas.latestIdeas.length >= 2) &&
          <Grid fluid className="background-grey">
            <div className="max-container">
              <div className="title-section">
                <div className="title-hyphen">&nbsp;</div>
                <h1 className="dark-title-1">
                  <Translate value="home.themesTitle" />
                </h1>
                <h5 className="dark-title-5 subtitle">
                  <Translate value="home.themesSubtitle" />
                </h5>
              </div>
              <div className="content-section">
                <Row className="no-margin">
                  {ideas.latestIdeas.map((idea, index) => {
                    return (
                      <Col xs={12} sm={24 / ideas.latestIdeas.length} md={12 / ideas.latestIdeas.length} className="theme no-padding" key={`theme-${index}`}>
                        <Theme index={index} />
                      </Col>
                    );
                  })}
                </Row>
              </div>
            </div>
          </Grid>
        }
      </section>
    );
  }
}

export default connect(MapStateToProps)(Themes);