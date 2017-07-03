import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import Themes from '../components/debate/common/themes';
import Timeline from '../components/debate/navigation/timeline';
import Thumbnails from '../components/debate/navigation/thumbnails';
import RootIdeasQuery from '../graphql/RootIdeasQuery.graphql';

class DebateThread extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isThumbnailsHidden: true
    };
    this.showThumbnails = this.showThumbnails.bind(this);
    this.hideThumbnails = this.hideThumbnails.bind(this);
    this.displayThumbnails = this.displayThumbnails.bind(this);
  }
  showThumbnails() {
    this.setState({ isThumbnailsHidden: false });
  }
  hideThumbnails() {
    setTimeout(() => {
      this.setState({ isThumbnailsHidden: true });
    }, 400);
  }
  displayThumbnails() {
    this.setState({ isThumbnailsHidden: !this.state.isThumbnailsHidden });
  }
  render() {
    const { rootIdea } = this.props.data;
    const thematics = rootIdea ? rootIdea.children : [];
    const { identifier, isNavbarHidden } = this.props;
    const isParentRoute = !this.props.params.themeId || false;
    const themeId = this.props.params.themeId || null;
    const children = React.Children.map(this.props.children, (child) => {
      return React.cloneElement(child, {
        id: themeId,
        identifier: identifier
      });
    });
    return (
      <div className="debate">
        {thematics &&
          <div>
            <section
              className={isNavbarHidden ? 'timeline-section timeline-top' : 'timeline-section timeline-shifted'}
              id="timeline"
            >
              <div className="max-container">
                {!isParentRoute &&
                  <div className="burger-menu grey" onMouseOver={this.showThumbnails} onClick={this.displayThumbnails}>
                    <div className="assembl-icon-thumb" />
                    <div className="burger-menu-label">
                      <Translate value="debate.themes" />
                    </div>
                  </div>}
                <Timeline showNavigation={!isParentRoute} identifier={identifier} />
              </div>
            </section>
            {isParentRoute && <Themes thematics={thematics} identifier={identifier} />}
            {!isParentRoute &&
              <section className="debate-section">
                <div className={this.state.isThumbnailsHidden ? 'hiddenThumb' : 'shown'} onMouseLeave={this.hideThumbnails}>
                  <Thumbnails
                    showNavigation={!isParentRoute}
                    thematics={thematics}
                    identifier={identifier}
                    themeId={themeId}
                    isNavbarHidden={isNavbarHidden}
                  />
                </div>
                {children}
              </section>}
          </div>}
      </div>
    );
  }
}

DebateThread.propTypes = {
  data: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    ideas: PropTypes.Array
  }).isRequired
};

const DebateWithData = graphql(RootIdeasQuery)(DebateThread);

const mapStateToProps = (state) => {
  return {
    lang: state.i18n.locale
  };
};

export default connect(mapStateToProps)(DebateWithData);