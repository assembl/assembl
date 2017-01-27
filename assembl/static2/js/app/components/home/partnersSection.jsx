import React from 'react';
import { connect } from 'react-redux';
import { Grid } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import GlobalFunctions from '../../utils/globalFunctions';
import MapStateToProps from '../../store/mapStateToProps';
import MapDispatchToProps from '../../store/mapDispatchToProps';
import Loader from '../common/loader';
import Error from '../common/error';

class PartnersSection extends React.Component {
  componentWillMount() {
    const discussionId = GlobalFunctions.getDiscussionId();
    this.props.fetchPartners(discussionId);
  }
  render() {
    const { partners, partnersLoading, partnersError } = this.props.partners;
    return (
      <div>
        {partnersLoading && <Loader />}
        {(partners && partners.length > 0) &&
          <Grid fluid className="max-container">
            <div className="partners margin-xl">
              <div className="title-3"><Translate value="home.partners" /></div>
              <div className="margin-m">
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
          </Grid>
        }
        {partnersError && <Error errorMessage={partnersError} />}
      </div>
    );
  }
}

export default connect(MapStateToProps, MapDispatchToProps)(PartnersSection);