import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { Grid, Col } from 'react-bootstrap';
import MapStateToProps from '../../store/mapStateToProps';

class Objectives extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;   
    const imgUrl1 = "http://otacute.fr/guidejapon/wp-content/uploads/2015/09/tokyo-1.jpg";
    const imgUrl2 = "https://images.independenttraveler.com/homepage/newyorkbig.jpg"; 
    
    return (
      <Grid fluid className="background-light objectives">
        <div className="max-container">
          <div className="title-section">
            <div className="title-hyphen">&nbsp;</div>
            <h1 className="dark-title-1">
              <Translate value="home.objectivesTitle" />
            </h1>
          </div>
          <div className="objectives-images">
            <Col xs={12} sm={12} md={6}>
              <div className="text text-column">{debateData.objectives}</div>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <div className="objectives-img" style={{backgroundImage: `url(${imgUrl1})`}}>&nbsp;</div>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <div className="objectives-img" style={{backgroundImage: `url(${imgUrl2})`}}>&nbsp;</div>
            </Col>
          </div>
          <div className="center margin-xxl inline full-size">
            <Link className="button-link button-dark" to={`${rootPath}${debateData.slug}/debate`}>
              <Translate value="home.accessButton" />
            </Link>
          </div>
          <div className="margin-xxl"></div>
        </div>
      </Grid>
    );
  }
}

export default connect(MapStateToProps)(Objectives);