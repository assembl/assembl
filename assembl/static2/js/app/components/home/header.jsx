import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Grid, Row } from 'react-bootstrap';
import MapStateToProps from '../../store/mapStateToProps';
import Statistic from './statistic';
import Synthesis from './synthesis';

class Header extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;
    const { synthesis } = this.props.synthesis;

    return (
      <div className="header">
        <Grid fluid className="max-container">
          <div className="header-content">
            <img className="header-logo" src={debateData.logo} alt="logo" />
            <div className="max-text-width">
              <h1 className="light-title-1">{debateData.topic}</h1>
              <h4 className="light-title-4 uppercase margin-m">{debateData.introduction}</h4>
              <Link className="button-link button-light margin-xl" to={`${rootPath}${debateData.slug}/debate`}>
                <Translate value="home.accessButton" />
              </Link>
            </div>
            {synthesis && Object.keys(synthesis.lastPublishedSynthesis).length > 0 &&
              <Synthesis />
            }
          </div>
        </Grid>
        <Grid fluid>
          <Row>
            <Statistic />
            <div className="header-bkg" style={{ backgroundImage: `url(${debateData.homepage})` }}>&nbsp;</div>
          </Row>
        </Grid>
      </div>
    );
  }
}

export default connect(MapStateToProps)(Header);