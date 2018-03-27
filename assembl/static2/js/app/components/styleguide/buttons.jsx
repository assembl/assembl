import React from 'react';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';
import Like from '../svg/like';
import Disagree from '../svg/disagree';

class Buttons extends React.Component {
  render() {
    return (
      <div>
        <h2 className="dark-title-2 underline" id="buttons" style={{ borderBottom: "1px solid #ccc"}}>BUTTONS</h2>
        <section style={{ backgroundColor: "#fff", padding: "10px", margin: "10px" }}>
          <div className="margin-s">
            <Button className="button-submit button-dark">Submit</Button>
          </div>
          <div className="margin-s">
            <Button className="button-cancel button-dark">Cancel</Button>
          </div>
          <div className="margin-s">
            <Link className="button-link button-dark">Link</Link>
          </div>
        </section>
        <section style={{ backgroundColor: "#aaa", padding: "10px", margin: "10px" }}>
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
          <div className="like-button action-button">
            <Like size={30} color="#ffffff" backgroundColor="none" />
            <div className="action-button-label">D'accord</div>
          </div>
          <div className="disagree-button action-button">
            <Disagree size={30} color="#ffffff" backgroundColor="none" />
            <div className="action-button-label">Pas d'accord</div>
          </div>
          <div className="share-button action-button">
            <div className="share-icon-container">
              <span className="assembl-icon-share white" />
            </div>
            <div className="action-button-label">Partager</div>
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
          <pre>
            &lt;div className="like-button action-button"&gt;
            <br/>
              &nbsp;&nbsp;&lt;Like size=&#123;30&#125; color="#ffffff" backgroundColor="none" /&gt;
              <br/>
              &nbsp;&nbsp;&lt;div className="action-button-label"&gt;D'accord&lt;/div&gt;
              <br/>
            &lt;/div&gt;
          </pre>
          <pre>
            &lt;div className="disagree-button action-button"&gt;
            <br/>
              &nbsp;&nbsp;&lt;Disagree size=&#123;30&#125; color="#ffffff" backgroundColor="none" /&gt;
              <br/>
              &nbsp;&nbsp;&lt;div className="action-button-label"&gt;Pas d'accord&lt;/div&gt;
              <br/>
            &lt;/div&gt;
          </pre>
          <pre>
            &lt;div className="share-button action-button"&gt;
              <br/>
              &nbsp;&nbsp;&lt;div className="share-icon-container"&gt;
                <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&lt;span className="assembl-icon-share white" /&gt;
                <br/>
              &nbsp;&nbsp;&lt;/div&gt;
              <br/>
              &nbsp;&nbsp;&lt;div className="action-button-label"&gt;Partager&lt;/div&gt;
              <br/>
            &lt;/div&gt;
          </pre>
        </section>
      </div>
    );
  }
}

export default Buttons;