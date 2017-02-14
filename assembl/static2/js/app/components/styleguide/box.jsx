import React from 'react';

class Box extends React.Component {
  render() {
    return (
      <div>
        <h2 className="dark-title-2 underline" id="box">BOX</h2>
        <section>
          <div className="box-title">Box title</div>
          <div className="box">Box content</div>
          <div className="insert-box border margin-m">
            <h3 className="dark-title-3">Box title</h3>
            <div className="hyphen">&nbsp;</div>
            <div>Box content</div>
          </div>
        </section>
        <section>
          <h3 className="dark-title-3">Code</h3>
          <pre>
            &lt;div className="box-title"&gt;Box title&lt;/div&gt;
          </pre>
          <pre>
            &lt;div className="box"&gt;Box content&lt;/div&gt;
          </pre>
          <pre>
            <div>&lt;div className="insert-box"&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;h3 className="dark-title-3"&gt;Box title&lt;/h3&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;div className="hyphen">&nbsp;&lt;/div&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;div>Box content&lt;/div&gt;</div>
            <div>&lt;/div&gt;</div>
          </pre>
        </section>
      </div>
    );
  }
}
export default Box;