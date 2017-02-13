import React from 'react';

class Container extends React.Component {
  render() {
    return (
      <div>
        <h2 className="dark-title-2 underline" id="container">CONTAINER</h2>
        <h3 className="dark-title-3">Code</h3>
        <div className="box">
          <div>
            <div className="code">&lt;Grid fluid&gt;</div>
            <br />
            <div className="code" style={{ paddingLeft: `${20}px` }}>&lt;div className=&quot;max-container&quot;&gt;</div>
            <br />
            <div className="code" style={{ paddingLeft: `${20}px` }}>&lt;/div&gt;</div>
            <br />
            <div className="code">&lt;/Grid&gt;</div>
          </div>
        </div>
      </div>
    );
  }
}
export default Container;