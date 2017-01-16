import React from 'react';
import { Translate } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Grid, Row, Button } from 'react-bootstrap';
import Statistic from './statistic';

class Header extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    return (
      <div className="header">
        <Grid>
          <Row>
            <div className="header-content">
              <img className="header-logo" src={debateData.logo} alt="logo" />
              <div className="title-1">{debateData.topic}</div>
              <div className="title-3">{debateData.introduction}</div>
              <div className="title-4">{debateData.objectives}</div>
              <Button className="button-success margin-l">
                <Translate value="home.accessButton" />
              </Button>
              <Statistic />
            </div>
          </Row>
        </Grid>
        <Grid fluid>
          <Row>
            <div className="header-bkg">
              <img src="../../../../static2/css/img/default_header.jpg" alt="header" />
            </div>
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