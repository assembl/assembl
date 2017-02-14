import React from 'react';

class Box extends React.Component {
  render() {
    return (
      <div>
        <h2 className="dark-title-2 underline" id="box">BOX</h2>
        <section>
          <div className="box-title">Box title</div>
          <div className="box">Box content</div>
        </section>
        <section>
          <h3 className="dark-title-3">Code</h3>
          <pre>
            &lt;div className="box-title"&gt;Box title&lt;/div&gt;
          </pre>
          <pre>
            &lt;div className="box"&gt;Box content&lt;/div&gt;
          </pre>
        </section>
      </div>
    );
  }
}
export default Box;