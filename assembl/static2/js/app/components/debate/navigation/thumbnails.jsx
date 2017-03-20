import React from 'react';
import { Grid } from 'react-bootstrap';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { isPhaseStarted } from '../../../utils/timeline';

class Thumbnails extends React.Component {
  render() {
    const {
      showNavigation,
      identifier,
      thematics,
      themeId
    } = this.props;
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;
    const phaseStarted = isPhaseStarted(debateData.timeline, identifier);
    return (
      <Grid fluid className={showNavigation && phaseStarted ? 'thumbnails-nav no-padding' : 'hidden'}>
        <div className="thumbnails-container">
          <div className="max-container">
            <div className="thumbnails">
              {thematics.map((thematic, index) => {
                return(
                  <div className="thumb-img-container" key={`thumb-${index}`}>
                    <Link to={`${rootPath}${debateData.slug}/debate/${identifier}/theme/${thematic.id.split(':')[1]}`}>
                      <div className={themeId == thematic.id.split(':')[1] ? 'thumb-img active' : 'thumb-img'} style={{ backgroundImage: `url(${thematic.imgUrl})` }}>&nbsp;</div>
                      <div className="color-box">&nbsp;</div>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="thumb">&nbsp;</div>
      </Grid>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    context: state.context
  };
};

export default connect(mapStateToProps)(Thumbnails);