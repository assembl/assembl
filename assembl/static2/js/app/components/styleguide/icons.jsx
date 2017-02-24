import React from 'react';
import { Link } from 'react-router';
import Glyphicon from '../common/glyphicon';

class Icons extends React.Component {
  render() {
    return (
      <div className="margin-xxl">
        <h2 className="dark-title-2 underline" id="icons" style={{ borderBottom: "1px solid #ccc"}}>ICONS</h2>
        <section>
          <div className="inline padding">
            <Glyphicon glyph="avatar" color="black" size={30} desc="Alt description" />
          </div>
          <div className="inline padding">
            <Glyphicon glyph="menuOn" color="black" size={30} desc="Alt description" />
          </div>
          <div className="inline padding">
            <Glyphicon glyph="menuOff" color="black" size={30} desc="Alt description" />
          </div>
          <div className="inline padding">
            <Glyphicon glyph="message" color="black" size={30} desc="Alt description" />
          </div>
          <div className="inline padding">
            <Glyphicon glyph="questionSign" color="black" size={30} desc="Alt description" />
          </div>
          <div style={{backgroundColor:"#000", width:"200px"}}>
            <div className="inline padding">
              <Link to="http://www.facebook.com" target="_blank">
                <Glyphicon glyph="facebook" color="white" size={30} desc="Facebook" />
              </Link>
            </div>
            <div className="inline padding">
              <Link to="http://www.twitter.com" target="_blank">
                <Glyphicon glyph="twitter" color="white" size={30} desc="Twitter" />
              </Link>
            </div>
            <div className="inline padding">
              <Link to="http://www.linkedin.com" target="_blank">
                <Glyphicon glyph="linkedin" color="white" size={30} desc="Linkedin" />
              </Link>
            </div>
          </div>
        </section>
        <section>
          <h3 className="dark-title-3">Code</h3>
          <pre>
            &lt;Glyphicon glyph="avatar" color="black" size=&#123;30&#125; desc="Alt description" /&gt;
          </pre>
          <pre>
            &lt;Glyphicon glyph="menuOn" color="black" size=&#123;30&#125; desc="Alt description" /&gt;
          </pre>
          <pre>
            &lt;Glyphicon glyph="menuOff" color="black" size=&#123;30&#125; desc="Alt description" /&gt;
          </pre>
          <pre>
            &lt;Glyphicon glyph="message" color="black" size=&#123;30&#125; desc="Alt description" /&gt;
          </pre>
          <pre>
            &lt;Glyphicon glyph="questionSign" color="black" size=&#123;30&#125; desc="Alt description" /&gt;
          </pre>
          <pre>
            <div>&lt;Link to="http://www.facebook.com" target="_blank"&gt;</div>
              <div style={{paddingLeft:`${20}px`}}>&lt;Glyphicon glyph="facebook" color="white" size=&#123;30&#125; desc="Facebook" /&gt;</div>
            <div>&lt;/Link&gt;</div>
          </pre>
          <pre>
            <div>&lt;Link to="http://www.twitter.com" target="_blank"&gt;</div>
              <div style={{paddingLeft:`${20}px`}}>&lt;Glyphicon glyph="twitter" color="white" size=&#123;30&#125; desc="Twitter" /&gt;</div>
            <div>&lt;/Link&gt;</div>
          </pre>
          <pre>
            <div>&lt;Link to="http://www.linkedin.com" target="_blank"&gt;</div>
              <div style={{paddingLeft:`${20}px`}}>&lt;Glyphicon glyph="linkedin" color="white" size=&#123;30&#125; desc="Linkedin" /&gt;</div>
            <div>&lt;/Link&gt;</div>
          </pre>
        </section>
      </div>
    );
  }
}

export default Icons;