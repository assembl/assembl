import React from 'react';
import Loader from '../common/loader';

class Loading extends React.Component {
  render() {
    return (
      <div>
        <h2 className="dark-title-2 underline" id="loader">LOADER</h2>
        <section>
          <Loader />
          <Loader textHidden />
        </section>
        <section>
          <h3 className="dark-title-3">Code</h3>
          <pre>
            &lt;Loader /&gt;
          </pre>
          <pre>
            &lt;Loader textHidden /&gt;
          </pre>
        </section>
      </div>
    );
  }
}
export default Loading;