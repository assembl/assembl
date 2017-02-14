import React from 'react';

class Titles extends React.Component {
  render() {
    return (
      <div>
        <h2 className="dark-title-2 underline" id="titles">TITLES</h2>
        <section>
          <div className="title-section">
            <div className="title-hyphen">&nbsp;</div>
            <h1 className="dark-title-1">Title section</h1>
          </div>
          <h1 className="dark-title-1">Title 1</h1>
          <h2 className="dark-title-2">Title 2</h2>
          <h3 className="dark-title-3">Title 3</h3>
          <h4 className="dark-title-4">Title 4</h4>
          <h5 className="dark-title-5">Title 5</h5>
        </section>
        <section>
          <h3 className="dark-title-3">Code</h3>
          <pre>
            <div>&lt;div className="title-section"&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;div className="title-hyphen"&gt;&nbsp;&lt;/div&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;h1 className="dark-title-1"&gt;Title section&lt;/h1&gt;</div>
            <div>&lt;/div&gt;</div>
          </pre>
          <pre>
            &lt;h1 className="dark-title-1"&gt;Title 1&lt;/h1&gt;
          </pre>
          <pre>
            &lt;h2 className="dark-title-2"&gt;Title 2&lt;/h2&gt;
          </pre>
          <pre>
            &lt;h3 className="dark-title-3"&gt;Title 3&lt;/h3&gt;
          </pre>
          <pre>
            &lt;h4 className="dark-title-4"&gt;Title 4&lt;/h4&gt;
          </pre>
          <pre>
            &lt;h5 className="dark-title-5"&gt;Title 5&lt;/h5&gt;
          </pre>
        </section>
      </div>
    );
  }
}
export default Titles;