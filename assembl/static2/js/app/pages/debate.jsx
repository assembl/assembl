import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Translate } from 'react-redux-i18n';
import Loader from '../components/common/loader';
import Themes from '../components/debate/common/themes';
import Timeline from '../components/debate/navigation/timeline';
import Thumbnails from '../components/debate/navigation/thumbnails';

class Debate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isThumbnailsHidden: true,
      isTimelineHidden: false
    };
    this.showThumbnails = this.showThumbnails.bind(this);
    this.hideThumbnails = this.hideThumbnails.bind(this);
    this.displayThumbnails = this.displayThumbnails.bind(this);
    this.displayTimeline = this.displayTimeline.bind(this);
  }
  componentDidMount() {
      window.addEventListener('scroll', this.displayTimeline);
  }
  componentWillUnmount() {
      window.removeEventListener('scroll', this.displayTimeline);
  }
  showThumbnails() {
    const { isThumbnailsHidden } = this.state;
    this.setState({ isThumbnailsHidden: false });
  }
  hideThumbnails() {
    const { isThumbnailsHidden } = this.state;
    this.setState({ isThumbnailsHidden: true });
  }
  displayThumbnails() {
    const { isThumbnailsHidden } = this.state;
    if(!isThumbnailsHidden) this.setState({ isThumbnailsHidden: true });
    if(isThumbnailsHidden) this.setState({ isThumbnailsHidden: false });
  }
  displayTimeline() {
    const { isTimelineHidden } = this.state;
    let top  = window.pageYOffset || document.documentElement.scrollTop;
    if (top > 400) {
      this.setState({
        isTimelineHidden: true,
        isThumbnailsHidden: true
      });
    } else {
      this.setState({
        isTimelineHidden: false,
        isThumbnailsHidden: true
      });
    }
  }
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
      <div className="debate">
        {loading && <Loader color="black" />}
        {thematics &&
          <div>
            <section className={this.state.isTimelineHidden ? 'hidden' : 'shown timeline-section'}>
              <div className="max-container">
                {!isParentRoute &&
                  <div className="burger-menu grey" onMouseOver={this.showThumbnails} onClick={this.displayThumbnails}>
                    <div className="assembl-icon-thumb"></div>
                    <div className="burger-menu-label">
                      <Translate value="debate.themes" />
                    </div>
                  </div>
                }
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
                <div className={this.state.isThumbnailsHidden ? 'hiddenThumb' : 'shown'} onMouseLeave={this.hideThumbnails}>
                  <Thumbnails
                    showNavigation={!isParentRoute}
                    thematics={thematics}
                    identifier={identifier}
                    themeId={themeId}
                  />
                </div>
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
