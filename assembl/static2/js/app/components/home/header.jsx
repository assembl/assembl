import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Grid, Row } from 'react-bootstrap';
import MapStateToProps from '../../store/mapStateToProps';
import Statistic from './statistic';

class Header extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.path;
    return (
      <div className="header">
        <Grid fluid className="max-container">
          <div className="header-content">
            <img className="header-logo" src={debateData.logo} alt="logo" />
            <h1 className="title-1">{debateData.topic}</h1>
            <h3 className="title-3 margin-m">{debateData.introduction}</h3>
            <h4 className="title-5 margin-xs uppercase">{debateData.objectives}</h4>
            <Link className="button-link margin-l" to={`${rootPath}${debateData.slug}/debate`}><Translate value="home.accessButton" /></Link>
            <Statistic />
          </div>
        </Grid>
        <Grid fluid>
          <Row>
            <div className="header-bkg">&nbsp;</div>
          </Row>
        </Grid>
      </div>
    );
  }
}

export default connect(MapStateToProps)(Header);