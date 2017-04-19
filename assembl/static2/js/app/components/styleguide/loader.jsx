import React from 'react';
import Loader from '../common/loader';

class Loading extends React.Component {
  render() {
    return (
      <div className="margin-xxl">
        <h2 className="dark-title-2 underline" id="loader" style={{ borderBottom: "1px solid #ccc"}}>LOADER</h2>
        <section>
          <Loader loading color="black" />
          <Loader loading textHidden color="black" />
        </section>
        <section>
          <h3 className="dark-title-3">Code</h3>
          <pre>
            &lt;Loader loading color="black" /&gt;
          </pre>
          <pre>
            &lt;Loader loading textHidden color="black" /&gt;
          </pre>
        </section>
      </div>
    );
  }
}
export default Loading;