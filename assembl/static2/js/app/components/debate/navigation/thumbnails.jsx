import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { isPhaseStarted } from '../../../utils/timeline';

class Thumbnails extends React.Component {
  render() {
    const {
      showNavigation,
      identifier,
      queryIdentifier,
      thematics,
      themeId
    } = this.props;
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;
    const identifierToDisplay = queryIdentifier || identifier;
    const phaseStarted = isPhaseStarted(debateData.timeline, identifierToDisplay);
    return (
      <div className={showNavigation && phaseStarted ? 'thumbnails-nav' : 'hidden'}>
        <div className="thumbnails-container">
          <div className="thumbnails">
            {thematics.map((thematic, index) => {
              return(
                <div className="thumb-img-container" key={`thumb-${index}`}>
                  <Link to={`${rootPath}${debateData.slug}/debate/${identifierToDisplay}/theme/${thematic.id.split(':')[1]}`}>
                    <div className={themeId == thematic.id.split(':')[1] ? 'thumb-img active' : 'thumb-img'} style={{ backgroundImage: `url(${thematic.imgUrl})` }}>&nbsp;</div>
                    <div className="color-box">&nbsp;</div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
        <div className="thumb">&nbsp;</div>
      </div>
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