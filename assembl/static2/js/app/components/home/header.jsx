import React from 'react';
import { Link } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Grid, Row } from 'react-bootstrap';
import Statistic from './statistic';

class Header extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    return (
      <div className="header">
        <Grid fluid>
          <Row>
            <div className="header-content">
              <img className="header-logo" src={debateData.logo} alt="logo" />
              <div className="title-1">{debateData.topic}</div>
              <div className="title-3">{debateData.introduction}</div>
              <div className="title-4">{debateData.objectives}</div>
              <Link className="button-link margin-l" to={`/v2/${debateData.slug}/debate`}><Translate value="home.accessButton" /></Link>
              <Statistic />
            </div>
          </Row>
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

const mapStateToProps = (state) => {
  return {
    debate: state.debate
  };
};

export default connect(mapStateToProps)(Header);