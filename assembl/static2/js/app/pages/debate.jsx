import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import Loader from '../components/common/loader';
import Themes from '../components/debate/common/themes';
import Timeline from '../components/debate/navigation/timeline';
import Thumbnails from '../components/debate/navigation/thumbnails';
import DebateThematicsQuery from '../graphql/DebateThematicsQuery.graphql';

class Debate extends React.Component {
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
    const { loading, thematics } = this.props.data;
    const { identifier } = this.props;
    const isParentRoute = !this.props.params.themeId || false;
    const themeId = this.props.params.themeId || null;
    const children = React.Children.map(this.props.children, child =>
      React.cloneElement(child, {
        id: themeId,
        identifier: identifier
      })
    );
    return (
      <div className="debate">
        {loading && isParentRoute && <Loader color="black" />}
        <div>
          <section className="timeline-section" id="timeline">
            <div className="max-container">
              {thematics &&
                !isParentRoute && (
                  <div className="burger-menu grey" onMouseOver={this.showThumbnails} onClick={this.displayThumbnails}>
                    <div className="assembl-icon-thumb" />
                    <div className="burger-menu-label">
                      <Translate value="debate.themes" />
                    </div>
                  </div>
                )}
              <Timeline showNavigation={!isParentRoute} identifier={identifier} />
            </div>
          </section>
          {thematics && isParentRoute && <Themes thematics={thematics} identifier={identifier} />}
          {thematics &&
            !isParentRoute && (
              <section className="debate-section">
                <div className={this.state.isThumbnailsHidden ? 'hiddenThumb' : 'shown'} onMouseLeave={this.hideThumbnails}>
                  <Thumbnails showNavigation={!isParentRoute} thematics={thematics} identifier={identifier} themeId={themeId} />
                </div>
                {children}
              </section>
            )}
        </div>
      </div>
    );
  }
}

Debate.propTypes = {
  data: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    thematics: PropTypes.Array
  }).isRequired
};

const DebateWithData = graphql(DebateThematicsQuery)(Debate);

const mapStateToProps = state => ({
  lang: state.i18n.locale
});

export default connect(mapStateToProps)(DebateWithData);