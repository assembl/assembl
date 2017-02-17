import React from 'react';
import { Glyphicon } from 'react-bootstrap';

class Icons extends React.Component {
  render() {
    return (
      <div>
        <h2 className="dark-title-2 underline" id="icons" style={{ borderBottom: "1px solid #ccc"}}>ICONS</h2>
        <section>
          <div className="rounded-icon"><Glyphicon glyph="search" /></div>
          <div className="rounded-icon"><Glyphicon glyph="user" /></div>
          <div className="color-icon"><Glyphicon glyph="comment" /></div>
          <div className="color-icon"><Glyphicon glyph="user" /></div>
          <div className="black-icon"><Glyphicon glyph="align-justify" /></div>
          <div className="black-icon"><Glyphicon glyph="remove" /></div>
          <div style={{ backgroundColor: '#4a4a4a', width: `${100}px`, padding: `${10}px`, display: 'inline' }}>
            <div className="white-icon"><Glyphicon glyph="envelope" /></div>
            <div className="white-icon"><Glyphicon glyph="question-sign" /></div>
            <img src="/static2/img/social/Facebook.svg" alt="Facebook" width="20px" style={{ marginRight: `${10}px` }} />
            <img src="/static2/img/social/Twitter.svg" alt="Twitter" width="20px" style={{ marginRight: `${10}px` }} />
            <img src="/static2/img/social/Linkedin.svg" alt="Linkedin" width="20px" style={{ marginRight: `${10}px` }} />
          </div>
        </section>
        <section>
          <h3 className="dark-title-3">Code</h3>
          <pre>
            &lt;div className="rounded-icon"&gt;&lt;Glyphicon glyph="search" /&gt;&lt;/div&gt;
          </pre>
          <pre>
            &lt;div className="rounded-icon"&gt;&lt;Glyphicon glyph="user" /&gt;&lt;/div&gt;
          </pre>
          <pre>
            &lt;div className="color-icon"&gt;&lt;Glyphicon glyph="comment" /&gt;&lt;/div&gt;
          </pre>
          <pre>
            &lt;div className="color-icon"&gt;&lt;Glyphicon glyph="user" /&gt;&lt;/div&gt;
          </pre>
          <pre>
            &lt;div className="black-icon"&gt;&lt;Glyphicon glyph="align-justify" /&gt;&lt;/div&gt;
          </pre>
          <pre>
            &lt;div className="black-icon"&gt;&lt;Glyphicon glyph="remove" /&gt;&lt;/div&gt;
          </pre>
          <pre>
            &lt;div className="white-icon"&gt;&lt;Glyphicon glyph="envelope" /&gt;&lt;/div&gt;
          </pre>
          <pre>
            &lt;div className="white-icon"&gt;&lt;Glyphicon glyph="question-sign" /&gt;&lt;/div&gt;
          </pre>
          <pre>
            &lt;img src="/static2/img/social/Facebook.svg" alt="Facebook" width="20px" /&gt;
          </pre>
          <pre>
            &lt;img src="/static2/img/social/Twitter.svg" alt="Twitter" width="20px" /&gt;
          </pre>
          <pre>
            &lt;img src="/static2/img/social/Linkedin.svg" alt="Linkedin" width="20px" /&gt;
          </pre>
        </section>
      </div>
    );
  }
}

export default Icons;