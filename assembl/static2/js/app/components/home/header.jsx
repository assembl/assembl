import React from 'react';
import { Link } from 'react-router';
import { Translate, Localize } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { Grid, Row } from 'react-bootstrap';
import Statistic from './header/statistic';
import Synthesis from './header/synthesis';

class Header extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { rootPath, connectedUserId } = this.props.context;
    const { synthesis } = this.props.synthesis;
    return (
      <section className="header-section">
        <Grid fluid className="max-container">
          <div className="header-content">
            <img className="header-logo" src={debateData.logo} alt="logo" />
            <div className="max-text-width">
              <h1 className="light-title-1">{debateData.topic}</h1>
              <h4 className="light-title-4 uppercase margin-m">
                <span dangerouslySetInnerHTML={{ __html: debateData.introduction }} />
                <span>&nbsp;</span>
                <br />
                <Translate value="home.from" />
                <span>&nbsp;</span>
                {debateData.startDate &&
                  <Localize value={debateData.startDate} dateFormat="date.format" />
                }
                <span>&nbsp;</span>
                <Translate value="home.to" />
                <span>&nbsp;</span>
                {debateData.endDate &&
                  <Localize value={debateData.endDate} dateFormat="date.format" />
                }
              </h4>
              <Link className="button-link button-light margin-xl" to={connectedUserId ? `${rootPath}${debateData.slug}/debate` : `${rootPath}${debateData.slug}/login`}>
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
            <div className="header-bkg" style={{ backgroundImage: `url(${debateData.headerBackgroundUrl})` }}>&nbsp;</div>
          </Row>
        </Grid>
      </section>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    context: state.context,
    synthesis: state.synthesis
  };
};

export default connect(mapStateToProps)(Header);