import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Grid, Col } from 'react-bootstrap';
import Step from './timeline/step';

class Timeline extends React.Component {
  render() {
    const imgUrl1 = "http://www.circuits-clubmed.fr/sites/default/files/clubmed_circuits_decouverte_mexique_belize_guatemala__0.jpg";
    const imgUrl2 = "http://www.oz-en-oisans.com/sites/default/files/styles/page_slide/public/page/randonnees-oz-1.jpg?itok=-YIbMQuB";
    const imgUrl3 = "http://cdt65.media.tourinsoft.eu/upload/Lac-de-l-oule.JPG";
    const imgUrl4 = "http://www.geo.fr/var/geo/storage/images/voyages/vos-voyages-de-reve/martinique-terre-de-relief/coucher-de-soleil/597484-1-fre-FR/coucher-de-soleil.jpg";
    
    return (
      <Grid fluid>
        <div className="max-container background-grey">
          <div className="timeline">
            <div>
              <div className="title-section">
                <div className="title-hyphen">&nbsp;</div>
                <h1 className="dark-title-1">
                  <Translate value="home.timelineTitle" />
                </h1>
              </div>
            </div>
            <div className="margin-xl">
              <Col xs={12} sm={6} md={3} className="no-padding step1">
                <Step imgUrl={imgUrl1} stepNumber={1} title="home.step1Title" text="home.step1Text" />
              </Col>
              <Col xs={12} sm={6} md={3} className="no-padding step2">
                <Step imgUrl={imgUrl2} stepNumber={2} title="home.step2Title" text="home.step2Text" />
              </Col>
              <Col xs={12} sm={6} md={3} className="no-padding step3">
                <Step imgUrl={imgUrl3} stepNumber={3} title="home.step3Title" text="home.step3Text" />
              </Col>
              <Col xs={12} sm={6} md={3} className="no-padding step4">
                <Step imgUrl={imgUrl4} stepNumber={4} title="home.step4Title" text="home.step4Text" />
              </Col>
            </div>
          </div>
        </div>
      </Grid>
    );
  }
}

export default Timeline;