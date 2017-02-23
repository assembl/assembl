import React from 'react';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';

class Buttons extends React.Component {
  render() {
    return (
      <div>
        <h2 className="dark-title-2 underline" id="buttons" style={{ borderBottom: "1px solid #ccc"}}>BUTTONS</h2>
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
          <pre>
            &lt;Button className="button-submit button-dark"&gt;Submit&lt;/Button&gt;
          </pre>
          <pre>
            &lt;Button className="button-cancel button-dark"&gt;Cancel&lt;/Button&gt;
          </pre>
          <pre>
            &lt;Link className="button-link button-dark"&gt;Link&lt;/Link&gt;
          </pre>
          <pre>
            &lt;Button className="button-submit button-light"&gt;Submit&lt;/Button&gt;
          </pre>
          <pre>
            &lt;Button className="button-cancel button-light"&gt;Cancel&lt;/Button&gt;
          </pre>
          <pre>
            &lt;Link className="button-link button-light"&gt;Link&lt;/Link&gt;
          </pre>
        </section>
      </div>
    );
  }
}

export default Buttons;