import React from 'react';

class Container extends React.Component {
  render() {
    return (
      <div>
        <div className="title-2 underline" id="container">CONTAINER</div>
        <div className="title-3">Code</div>
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