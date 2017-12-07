import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { Grid } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

class Partners extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    return (
      <section className="home-section partners-section">
        <Grid fluid>
          <div className="max-container">
            <div className="title-section">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                <Translate value="home.partners" />
              </h1>
            </div>
            <div className="content-section">
              <div className="content-margin">
                {debateData.partners.map((partner, index) => (
                  <div className="partner-logo" key={index}>
                    <Link to={partner.link} target="_blank">
                      <img src={partner.logo} alt={partner.name} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Grid>
      </section>
    );
  }
}

const mapStateToProps = state => ({
  debate: state.debate
});

export default connect(mapStateToProps)(Partners);