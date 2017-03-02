import React from 'react';
import { Link } from 'react-router';

class Icons extends React.Component {
  render() {
    return (
      <div className="margin-xxl">
        <h2 className="dark-title-2 underline" id="icons" style={{ borderBottom: "1px solid #ccc"}}>ICONS</h2>
        <section>
          <div className="inline padding">
            <span className="glyph-black">A</span>
          </div>
          <div className="inline padding">
            <span className="glyph-black">B</span>
          </div>
          <div className="inline padding">
            <span className="glyph-black">C</span>
          </div>
          <div className="inline padding">
            <span className="glyph-grey">D</span>
          </div>
          <div className="inline padding">
            <span className="glyph-grey">E</span>
          </div>
          <div style={{backgroundColor:"#000", width:"200px"}}>
            <div className="inline padding">
              <Link to="http://www.facebook.com" target="_blank">
                <span className="glyph-white">F</span>
              </Link>
            </div>
            <div className="inline padding">
              <Link to="http://www.linkedin.com" target="_blank">
                <span className="glyph-white">G</span>
              </Link>
            </div>
            <div className="inline padding">
              <Link to="http://www.twitter.com" target="_blank">
                <span className="glyph-white">H</span>
              </Link>
            </div>
          </div>
        </section>
        <section>
          <h3 className="dark-title-3">Code</h3>
          <pre>
            &lt;span className="glyph-black"&gt;A&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="glyph-black"&gt;B&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="glyph-black"&gt;C&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="glyph-grey"&gt;D&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="glyph-grey"&gt;E&lt;/span&gt;
          </pre>
          <pre>
            <div>&lt;Link to="http://www.facebook.com" target="_blank"&gt;</div>
              <div style={{paddingLeft:`${20}px`}}>&lt;span className="glyph-white"&gt;F&lt;/span&gt;</div>
            <div>&lt;/Link&gt;</div>
          </pre>
          <pre>
            <div>&lt;Link to="http://www.linkedin.com" target="_blank"&gt;</div>
              <div style={{paddingLeft:`${20}px`}}>&lt;span className="glyph-white"&gt;G&lt;/span&gt;</div>
            <div>&lt;/Link&gt;</div>
          </pre>
          <pre>
            <div>&lt;Link to="http://www.twitter.com" target="_blank"&gt;</div>
              <div style={{paddingLeft:`${20}px`}}>&lt;span className="glyph-white"&gt;H&lt;/span&gt;</div>
            <div>&lt;/Link&gt;</div>
          </pre>
        </section>
      </div>
    );
  }
}

export default Icons;