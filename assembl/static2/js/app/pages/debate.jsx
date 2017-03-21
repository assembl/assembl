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
    const { loading, thematics } = this.props.data;
    const { identifier } = this.props;
    const isParentRoute = !this.props.params.phase || false;
    const themeId = this.props.params.themeId || null;
    const children = React.Children.map(this.props.children, function (child) {
      return React.cloneElement(child, {
        id: themeId,
        identifier: identifier
      });
    });
    return (
      <div>
        {loading && <Loader color="black" />}
        {thematics &&
          <div className="debate">
            <section className="timeline-section">
              <div className="max-container">
                <div className="burger-menu"><span className="assembl-icon-menu-on"></span></div>
                <Timeline
                  showNavigation={!isParentRoute}
                  identifier={identifier}
                />
              </div>
            </section>
            {isParentRoute &&
              <Themes
                thematics={thematics}
                identifier={identifier}
              />
            }
            {!isParentRoute &&
              <section className="debate-section">
                <Thumbnails
                  showNavigation={!isParentRoute}
                  thematics={thematics}
                  identifier={identifier}
                  themeId={themeId}
                />
                {children}
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
    thematics: ideas(identifier: $identifier) {
      ... on Thematic {
        id,
        identifier,
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
