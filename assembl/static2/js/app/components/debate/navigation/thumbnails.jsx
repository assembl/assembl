import React from 'react';

class Thumbnails extends React.Component {
  render() {
    const { showNavigation } = this.props;
    return (
      <div className={showNavigation ? 'thumbnails-nav' : 'hidden'}>
        <div className="thumbnails-container">
          <div className="thumbnails">
            <div className="thumb-img-container">
              <div className="thumb-img" style={{ backgroundImage: 'url(/data/Discussion/6/documents/422/data)' }}>&nbsp;</div>
              <div className="color-box">&nbsp;</div>
            </div>
            <div className="thumb-img-container">
              <div className="thumb-img" style={{ backgroundImage: 'url(/data/Discussion/6/documents/423/data)' }}>&nbsp;</div>
              <div className="color-box">&nbsp;</div>
            </div>
            <div className="thumb-img-container">
              <div className="thumb-img" style={{ backgroundImage: 'url(/data/Discussion/6/documents/424/data)' }}>&nbsp;</div>
              <div className="color-box">&nbsp;</div>
            </div>
            <div className="thumb-img-container">
              <div className="thumb-img" style={{ backgroundImage: 'url(/data/Discussion/6/documents/425/data)' }}>&nbsp;</div>
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