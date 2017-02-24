import React from 'react';

class Container extends React.Component {
  render() {
    return (
      <div className="margin-xxl">
        <h2 className="dark-title-2 underline" id="container" style={{ borderBottom: "1px solid #ccc"}}>CONTAINER</h2>
        <h3 className="dark-title-3">Code</h3>
        <pre>
          <div>&lt;section className="name-section"&gt;</div>
            <div style={{ marginLeft: `${20}px` }}>&lt;Grid fluid&gt;</div>
              <div style={{ marginLeft: `${40}px` }}>&lt;div className="max-container"&gt;&lt;/div&gt;</div>
            <div style={{ marginLeft: `${20}px` }}>&lt;/Grid&gt;</div>
          <div>&lt;/section&gt;</div>
        </pre>
      </div>
    );
  }
}
export default Container;