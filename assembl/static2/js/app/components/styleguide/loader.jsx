import React from 'react';
import Loader from '../common/loader';

class Loading extends React.Component {
  render() {
    return (
      <div>
        <div className="title-2 underline" id="loader">LOADER</div>
        <section>
          <Loader />
          <Loader textHidden />
        </section>
        <section>
          <div className="title-3">Code</div>
          <div className="box">
            <div>
              <div className="code">
                <span>&lt;</span><span>Loader /</span><span>&gt;</span>
              </div>
              <br />
              <div className="code">
                <span>&lt;</span><span>Loader textHidden /</span><span>&gt;</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}
export default Loading;