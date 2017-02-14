import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Grid, Row } from 'react-bootstrap';
import MapStateToProps from '../../store/mapStateToProps';
import Statistic from './statistic';
import SynthesisInsert from './synthesisInsert';

class Header extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;
    const { synthesis } = this.props.synthesis;

    return (
      <div className="header">
        <Grid fluid className="max-container">
          <div className="header-content">
            <img style={{ display: 'none' }} className="header-logo" src={debateData.logo} alt="logo" />
            <h1 className="light-title-1">{debateData.topic}</h1>
            <h3 className="light-title-3 margin-m">{debateData.introduction}</h3>
            <h5 className="light-title-5 margin-xs uppercase">{debateData.objectives}</h5>
            <Link className="button-link button-light margin-l" to={`${rootPath}${debateData.slug}/debate`}><Translate value="home.accessButton" /></Link>
            {synthesis && Object.keys(synthesis.lastPublishedSynthesis).length > 0 &&
              <SynthesisInsert />
            }
          </div>
        </Grid>
        <Grid fluid>
          <Row>
            <Statistic />
            <div className="header-bkg">&nbsp;</div>
          </Row>
        </Grid>
      </div>
    );
  }
}

export default connect(MapStateToProps)(Header);