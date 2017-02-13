import React from 'react';
import Error from '../common/error';

class ErrorComponent extends React.Component {
  render() {
    return (
      <div>
        <h2 className="dark-title-2 underline" id="error">ERROR</h2>
        <section>
          <div className="left">
            <Error errorMessage="ErrorMessage" />
          </div>
          <div>&nbsp;</div>
        </section>
        <section>
          <h3 className="dark-title-3">Code</h3>
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