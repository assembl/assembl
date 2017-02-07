import React from 'react';
import Loader from '../common/loader';

class Loading extends React.Component {
  render() {
    return (
      <div>
        <h2 className="title-2 underline" id="loader">LOADER</h2>
        <section>
          <Loader />
          <Loader textHidden />
        </section>
        <section>
          <h3 className="title-3">Code</h3>
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