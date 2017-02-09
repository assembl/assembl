import React from 'react';

class Box extends React.Component {
  render() {
    return (
      <div>
        <h2 className="title-2 underline" id="box">BOX</h2>
        <section>
          <div className="box-title">Box title</div>
          <div className="box">Box content</div>
        </section>
        <section>
          <h3 className="title-3">Code</h3>
          <div className="box">
            <div>
              <div className="code">
                <span>&lt;div className=&quot;box-title&quot;&gt;</span>
                <span>Box title</span>
                <span>&lt;/div&gt;</span>
              </div>
            </div>
            <div>
              <div className="code">
                <span>&lt;div className=&quot;box&quot;&gt;</span>
                <span>Box content</span>
                <span>&lt;/div&gt;</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}
export default Box;