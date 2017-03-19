import React from 'react';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import Loader from '../components/common/loader';
import Themes from '../components/debate/common/themes';
import Timeline from '../components/debate/navigation/timeline';
import Thumbnails from '../components/debate/navigation/thumbnails';

class Debate extends React.Component {
  render() {
    const { identifier } = this.props;
    const { loading, thematics } = this.props.data;
    const locationIdentifier = this.props.location.pathname.split('debate')[1].length > 0 ? this.props.location.pathname.split('debate/')[1].split('/')[0] : null;
    const queryIdentifier = this.props.location.query.phase || locationIdentifier;
    const isParentRoute = this.props.location.pathname.split('debate')[1].length === 0;
    const themeId = this.props.location.pathname.split('theme/')[1];
    return (
      <div>
        {loading && <Loader color="black" />}
        {thematics &&
          <div className="debate">
            <Timeline showNavigation={!isParentRoute} />
            {isParentRoute &&
              <Themes
                thematics={thematics}
                identifier={identifier}
                queryIdentifier={queryIdentifier}
              />
            }
            {!isParentRoute &&
              <section className="debate-section">
                <Thumbnails
                  showNavigation={!isParentRoute}
                  thematics={thematics}
                  themeId={themeId}
                  identifier={identifier}
                  queryIdentifier={queryIdentifier}
                />
                {this.props.children}
              </section>
            }
          </div>
        }
      </div>
    );
  }
}

Debate.propTypes = {
  data: React.PropTypes.shape({
    loading: React.PropTypes.bool.isRequired,
    error: React.PropTypes.object,
    thematics: React.PropTypes.Array
  }).isRequired
};

const ThematicQuery = gql`
  query ThematicQuery($lang: String!, $identifier: String!) {
   thematics: ideas {
     ... on Thematic {
       id,
       identifier(identifier: $identifier),
       title(lang: $lang),
       description,
       numPosts,
       numContributors,
       imgUrl
     }
   }
  }
`;

const DebateWithData = graphql(ThematicQuery)(Debate);

const mapStateToProps = (state) => {
  return {
    lang: state.i18n.locale
  };
};

export default connect(mapStateToProps)(DebateWithData);
