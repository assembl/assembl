import React from 'react';
import { connect } from 'react-redux';
import { Grid } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import MapStateToProps from '../../store/mapStateToProps';
import MapDispatchToProps from '../../store/mapDispatchToProps';
import Loader from '../common/loader';
import Error from '../common/error';

class PartnersSection extends React.Component {
  componentWillMount() {
    const { debateId } = this.props.context;
    this.props.fetchPartners(debateId);
  }
  render() {
    const { partners, partnersLoading, partnersError } = this.props.partners;
    return (
      <div>
        {partnersLoading && <Loader />}
        {(partners && partners.length > 0) &&
          <Grid fluid className="background-light">
            <div className="max-container">
              <div className="partners">
                <div className="title-section">
                  <div className="title-hyphen">&nbsp;</div>
                  <h1 className="dark-title-1">
                    <Translate value="home.partners" />
                  </h1>
                </div>
                <div className="margin-l">
                  {partners.map((partner) => {
                    return (
                      <div className="partner-logo" key={partner['@id']}>
                        <a href={`${partner.homepage}`} target="_blank" rel="noopener noreferrer">
                          <img src={partner.logo} alt={partner.name} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Grid>
        }
        {partnersError && <Error errorMessage={partnersError} />}
      </div>
    );
  }
}

export default connect(MapStateToProps, MapDispatchToProps)(PartnersSection);