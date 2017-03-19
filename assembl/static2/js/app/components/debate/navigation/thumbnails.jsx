import React from 'react';

class Thumbnails extends React.Component {
  render() {
    const { showNavigation, bkgImgUrl } = this.props;
    return (
      <div className={showNavigation ? 'thumbnails-nav' : 'hidden'}>
        <div className="thumbnails-container">
          <div className="thumbnails">
            <div className="thumb-img-container">
              <div className="thumb-img" style={{ backgroundImage: `${bkgImgUrl}` }}>&nbsp;</div>
              <div className="color-box">&nbsp;</div>
            </div>
          </div>
        </div>
        <div className="thumb">&nbsp;</div>
      </div>
    );
  }
}

export default Thumbnails;