import React from 'react';
import Glyphicon from '../common/glyphicon';

class Icons extends React.Component {
  render() {
    return (
      <div>
        <h2 className="dark-title-2 underline" id="icons" style={{ borderBottom: "1px solid #ccc"}}>ICONS</h2>
        <section>
          <Glyphicon glyph="avatar" color="black" size={30} desc="Alt description" />
          <Glyphicon glyph="menuOn" color="black" size={30} desc="Alt description" />
          <Glyphicon glyph="menuOff" color="black" size={30} desc="Alt description" />
          <Glyphicon glyph="message" color="black" size={30} desc="Alt description" />
          <Glyphicon glyph="questionSign" color="black" size={30} desc="Alt description" />
          <a href="http://www.facebook.com" target="_blank" rel="noopener noreferrer">
            <img src="/static2/img/social/Facebook.svg" alt="Facebook" />
          </a>
          <a href="http://www.twitter.com" target="_blank" rel="noopener noreferrer">
            <img src="/static2/img/social/Twitter.svg" alt="Twitter" />
          </a>
          <a href="http://www.linkedin.com" target="_blank" rel="noopener noreferrer">
            <img src="/static2/img/social/Linkedin.svg" alt="Linkedin" />
          </a>
        </section>
        <section>
          <h3 className="dark-title-3">Code</h3>
          <pre>
            &lt;Glyphicon glyph="avatar" color="black" size={30} desc="Alt description" /&gt;
          </pre>
          <pre>
            &lt;Glyphicon glyph="menuOn" color="black" size={30} desc="Alt description" /&gt;
          </pre>
          <pre>
            &lt;Glyphicon glyph="menuOff" color="black" size={30} desc="Alt description" /&gt;
          </pre>
          <pre>
            &lt;Glyphicon glyph="message" color="black" size={30} desc="Alt description" /&gt;
          </pre>
          <pre>
            &lt;Glyphicon glyph="questionSign" color="black" size={30} desc="Alt description" /&gt;
          </pre>
          <pre>
            &lt;a href="http://www.facebook.com" target="_blank" rel="noopener noreferrer"&gt;
              &lt;img src="/static2/img/social/Facebook.svg" alt="Facebook" /&gt;
            &lt;/a&gt;
          </pre>
          <pre>
            &lt;a href="http://www.twitter.com" target="_blank" rel="noopener noreferrer"&gt;
              &lt;img src="/static2/img/social/Twitter.svg" alt="Twitter" /&gt;
            &lt;/a&gt;
          </pre>
          <pre>
            &lt;a href="http://www.linkedin.com" target="_blank" rel="noopener noreferrer"&gt;
              &lt;img src="/static2/img/social/Linkedin.svg" alt="Linkedin" /&gt;
            &lt;/a&gt;
          </pre>
        </section>
      </div>
    );
  }
}

export default Icons;