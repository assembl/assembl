import React from 'react';
import { Button } from 'react-bootstrap';

class Buttons extends React.Component {
  render() {
    return (
      <div>
        <div className="title-2 underline" id="buttons">BUTTONS</div>
        <section>
          <Button className="button-success">Success</Button>
          <Button className="button-cancel">Cancel</Button>
        </section>
        <section>
          <div className="title-3">Code</div>
          <div className="box">
            <div>
              <div className="code">
                <span>&lt;</span>
                <span>Button className=&quot;button-success&quot;</span>
                <span>&gt;</span>
              </div>
              <span>Success</span>
              <div className="code">
                <span>&lt;</span>
                <span>/Button</span>
                <span>&gt;</span>
              </div>
            </div>
            <div>
              <div className="code">
                <span>&lt;</span>
                <span>Button className=&quot;button-cancel&quot;</span>
                <span>&gt;</span>
              </div>
              <span>Cancel</span>
              <div className="code">
                <span>&lt;</span><span>/Button</span><span>&gt;</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default Buttons;