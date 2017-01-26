import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row } from 'react-bootstrap';
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
        {partners &&
          <div>
            <Grid fluid className="max-container">
              <Row>
                {partners.map((partner) => {
                  return (<img key={partner['@id']} src={partner.logo} alt={partner.name} />);
                })}
              </Row>
            </Grid>
          </div>
        }
        {partnersError && <Error errorMessage={partnersError} />}
      </div>
    );
  }
}

export default connect(MapStateToProps, MapDispatchToProps)(PartnersSection);