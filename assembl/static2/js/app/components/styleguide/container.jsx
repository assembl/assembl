import React from 'react';

class Container extends React.Component {
  render() {
    return (
      <div>
        <h2 className="dark-title-2 underline" id="container" style={{ borderBottom: "1px solid #ccc"}}>CONTAINER</h2>
        <h3 className="dark-title-3">Code</h3>
        <pre>
          <div>&lt;Grid fluid&gt;</div>
            <div style={{ marginLeft: `${20}px` }}>&lt;div className="max-container"&gt;&lt;/div&gt;</div>
          <div>&lt;/Grid&gt;</div>
        </pre>
      </div>
    );
  }
}
export default Container;