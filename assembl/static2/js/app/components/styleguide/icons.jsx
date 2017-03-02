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
            <span className="icon-add">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-catch">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-checked">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-discussion">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-edit">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-cancel">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-faq">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-filter">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-profil">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-idea">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-link">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-menu-on">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-message">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-expert">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-pepite">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-plus">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-schedule">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-search">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-search2">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-share">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-delete">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-synthesis">&nbsp;</span>
          </div>
          <div className="inline padding">
            <span className="icon-mindmap">&nbsp;</span>
          </div>
          <div style={{backgroundColor:"#000", width:"200px"}}>
            <div className="inline padding">
              <Link to="http://www.facebook.com" target="_blank">
                <Glyphicon glyph="facebook" color="white" size={30} desc="Facebook" />
              </Link>
            </div>
            <div className="inline padding">
              <Link to="http://www.linkedin.com" target="_blank">
                <Glyphicon glyph="twitter" color="white" size={30} desc="Twitter" />
              </Link>
            </div>
            <div className="inline padding">
              <Link to="http://www.twitter.com" target="_blank">
                <Glyphicon glyph="linkedin" color="white" size={30} desc="Linkedin" />
              </Link>
            </div>
          </div>
        </section>
        <section>
          <h3 className="dark-title-3">Code</h3>
          <pre>
            &lt;span className="icon-add black"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-catch white"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-checked grey"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-discussion"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-edit"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-cancel"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-faq"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-filter"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-profil"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-idea"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-link"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-menu-on"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-message"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-expert"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-pepite"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-plus"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-schedule"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-search"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-search2"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-share"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-delete"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-synthesis"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="icon-mindmap"&gt;&lt;/span&gt;
          </pre>
          <pre>
            <div>&lt;Link to="http://www.facebook.com" target="_blank"&gt;</div>
              <div style={{paddingLeft:`${20}px`}}>&lt;Glyphicon glyph="facebook" color="white" size={30} desc="Facebook"/&gt;</div>
            <div>&lt;/Link&gt;</div>
          </pre>
          <pre>
            <div>&lt;Link to="http://www.linkedin.com" target="_blank"&gt;</div>
              <div style={{paddingLeft:`${20}px`}}>&lt;Glyphicon glyph="linkedin" color="white" size={30} desc="Linkedin"/&gt;</div>
            <div>&lt;/Link&gt;</div>
          </pre>
          <pre>
            <div>&lt;Link to="http://www.twitter.com" target="_blank"&gt;</div>
              <div style={{paddingLeft:`${20}px`}}>&lt;Glyphicon glyph="twitter" color="white" size={30} desc="Twitter"/&gt;</div>
            <div>&lt;/Link&gt;</div>
          </pre>
        </section>
      </div>
    );
  }
}

export default Icons;