import React from 'react';
import { Grid } from 'react-bootstrap';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { isPhaseStarted } from '../../../utils/timeline';
import { get } from '../../../utils/routeMap';

class Thumbnails extends React.Component {
  render() {
    const { showNavigation, identifier, thematics, themeId } = this.props;
    const { debateData } = this.props.debate;
    const slug = debateData.slug;
    const phaseStarted = isPhaseStarted(debateData.timeline, identifier);
    return (
      <Grid fluid className={showNavigation && phaseStarted ? 'thumbnails-nav no-padding' : 'hidden'}>
        <div className="thumbnails-container">
          <div className="max-container">
            <div className="thumbnails">
              {thematics.map((thematic, index) => (
                <div className="thumb-img-container" key={index}>
                  <Link to={`${get('debate', { slug: slug, phase: identifier })}${get('theme', { themeId: thematic.id })}`}>
                    <div
                      className={themeId === thematic.id ? 'thumb-img active' : 'thumb-img'}
                      style={
                        thematic.img && thematic.img.externalUrl ? { backgroundImage: `url(${thematic.img.externalUrl})` } : null
                      }
                    />
                    <div className="color-box">&nbsp;</div>
                    <div className="thumb-title">
                      <div className={themeId === thematic.id ? 'thumb-title-inner active-title' : 'thumb-title-inner'}>
                        {thematic.title}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Grid>
    );
  }
}

const mapStateToProps = state => ({
  debate: state.debate
});

export default connect(mapStateToProps)(Thumbnails);