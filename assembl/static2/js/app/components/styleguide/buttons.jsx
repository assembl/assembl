import React from 'react';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';

class Buttons extends React.Component {
  render() {
    return (
      <div>
        <h2 className="dark-title-2 underline" id="buttons">BUTTONS</h2>
        <section>
          <div className="margin-s">
            <Button className="button-submit button-dark">Submit</Button>
          </div>
          <div className="margin-s">
            <Button className="button-cancel button-dark">Cancel</Button>
          </div>
          <div className="margin-s">
            <Link className="button-link button-dark">Link</Link>
          </div>
          <div className="margin-s">
            <Button className="button-submit button-light">Submit</Button>
          </div>
          <div className="margin-s">
            <Button className="button-cancel button-light">Cancel</Button>
          </div>
          <div className="margin-s">
            <Link className="button-link button-light">Link</Link>
          </div>
        </section>
        <section>
          <h3 className="dark-title-3">Code</h3>
          <div className="box">
            <div>
              <div className="code">
                <span>&lt;</span>
                <span>Button className=&quot;button-submit&nbsp;button-dark&quot;</span>
                <span>&gt;</span>
              </div>
              <span>Submit</span>
              <div className="code">
                <span>&lt;</span>
                <span>/Button</span>
                <span>&gt;</span>
              </div>
            </div>
            <div>
              <div className="code">
                <span>&lt;</span>
                <span>Button className=&quot;button-cancel&nbsp;button-dark&quot;</span>
                <span>&gt;</span>
              </div>
              <span>Cancel</span>
              <div className="code">
                <span>&lt;</span><span>/Button</span><span>&gt;</span>
              </div>
            </div>
            <div>
              <div className="code">
                <span>&lt;</span>
                <span>Link className=&quot;button-link&nbsp;button-dark&quot; to=&quot;/link&quot;</span>
                <span>&gt;</span>
              </div>
              <span>Link</span>
              <div className="code">
                <span>&lt;</span>
                <span>/Link</span>
                <span>&gt;</span>
              </div>
            </div>
            <div>
              <div className="code">
                <span>&lt;</span>
                <span>Button className=&quot;button-submit&nbsp;button-light&quot;</span>
                <span>&gt;</span>
              </div>
              <span>Submit</span>
              <div className="code">
                <span>&lt;</span>
                <span>/Button</span>
                <span>&gt;</span>
              </div>
            </div>
            <div>
              <div className="code">
                <span>&lt;</span>
                <span>Button className=&quot;button-cancel&nbsp;button-light&quot;</span>
                <span>&gt;</span>
              </div>
              <span>Cancel</span>
              <div className="code">
                <span>&lt;</span><span>/Button</span><span>&gt;</span>
              </div>
            </div>
            <div>
              <div className="code">
                <span>&lt;</span>
                <span>Link className=&quot;button-link&nbsp;button-light&quot; to=&quot;/link&quot;</span>
                <span>&gt;</span>
              </div>
              <span>Link</span>
              <div className="code">
                <span>&lt;</span>
                <span>/Link</span>
                <span>&gt;</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default Buttons;