import React from 'react';

class Container extends React.Component {
  render() {
    return (
      <div>
        <div className="title-2 underline" id="container">CONTAINER</div>
        <div className="title-3">Code</div>
        <div className="box">
          <div>
            <div className="code">&lt;Grid fluid className=&quot;max-container&quot;&gt;</div>
            <br />
            <div className="code" style={{ paddingLeft: `${20}px` }}>&lt;Row&gt;</div>
            <br />
            <div className="code" style={{ paddingLeft: `${40}px` }}>&lt;Col xs=&#123;12&#125; sm=&#123;12&#125;&gt;</div>
            <div className="code">&lt;/Col&gt;</div>
            <br />
            <div className="code" style={{ paddingLeft: `${20}px` }}>&lt;/Row&gt;</div>
            <br />
            <div className="code">&lt;/Grid&gt;</div>
          </div>
        </div>
      </div>
    );
  }
}
export default Container;