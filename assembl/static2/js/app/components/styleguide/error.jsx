import React from 'react';
import Error from '../common/error';

class ErrorComponent extends React.Component {
  render() {
    return (
      <div>
        <div className="title-2 underline" id="error">ERROR</div>
        <section>
          <div className="left">
            <Error errorMessage="ErrorMessage" />
          </div>
          <div>&nbsp;</div>
        </section>
        <section>
          <div className="title-3">Code</div>
          <div className="box">
            <div>
              <div className="code">
                <span>&lt;</span>
                <span>Error errorMessage=&#123;error&#125; /</span>
                <span>&gt;</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default ErrorComponent;