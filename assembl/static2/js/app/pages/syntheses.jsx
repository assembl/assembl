import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Grid } from 'react-bootstrap';
import { Link } from 'react-router';

import { get } from '../utils/routeMap';
import Loader from '../components/common/loader';
import SynthesesQuery from '../graphql/SynthesesQuery.graphql';

export class DumbSyntheses extends React.Component {
  render() {
    const { data, slug } = this.props;
    if (data.loading) {
      return <Loader color="black" />;
    }
    const { syntheses } = data;
    return (
      <Grid fluid className={syntheses.length > 0 ? 'thumbnails-nav no-padding' : 'hidden'}>
        <div className="thumbnails-container">
          <div className="max-container">
            <div className="thumbnails">
              {syntheses.map((synthesis, index) => {
                return (
                  <div className="thumb-img-container" key={index}>
                    <Link to={`${get('synthesis', { synthesisId: synthesis.id, slug: slug })}`}>
                      <div
                        className={'thumb-img active'}
                        style={synthesis.imgUrl ? { backgroundImage: `url(${synthesis.imgUrl})` } : null}
                      />
                      <div className="color-box">&nbsp;</div>
                      <div className="thumb-title">
                        <div className={'thumb-title-inner'}>
                          {synthesis.subject}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Grid>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    lang: state.i18n.locale,
    slug: state.debate.debateData.slug
  };
};

export default compose(connect(mapStateToProps), graphql(SynthesesQuery))(DumbSyntheses);