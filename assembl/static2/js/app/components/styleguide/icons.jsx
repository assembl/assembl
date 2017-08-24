import React from 'react';
import { Link } from 'react-router';
import Glyphicon from '../common/glyphicon';
import Doughnut from '../svg/doughnut';
import Like from '../svg/like';
import Disagree from '../svg/disagree';
import DontUnderstand from '../svg/dontUnderstand';
import MoreInfo from '../svg/moreInfo';
import Pointer from '../svg/pointer';
import Ellipsis from '../svg/ellipsis';

const icons = [
  'assembl-icon-add',
  'assembl-icon-catch',
  'assembl-icon-checked',
  'assembl-icon-discussion',
  'assembl-icon-edit',
  'assembl-icon-cancel',
  'assembl-icon-faq',
  'assembl-icon-filter',
  'assembl-icon-down-dir',
  'assembl-icon-profil',
  'assembl-icon-idea',
  'assembl-icon-down-open',
  'assembl-icon-link',
  'assembl-icon-menu-on',
  'assembl-icon-message',
  'assembl-icon-expert',
  'assembl-icon-pepite',
  'assembl-icon-plus',
  'assembl-icon-schedule',
  'assembl-icon-search',
  'assembl-icon-search2',
  'assembl-icon-share',
  'assembl-icon-delete',
  'assembl-icon-synthesis',
  'assembl-icon-mindmap',
  'assembl-icon-up-open',
  'assembl-icon-back-arrow',
  'assembl-icon-thumb',
  'assembl-icon-symbol-assembl',
  'assembl-icon-plus-circled',
  'assembl-icon-minus-circled',
  'assembl-icon-text-bold',
  'assembl-icon-text-italics',
  'assembl-icon-text-bullets',
  'assembl-icon-text-link',
  'assembl-icon-text-attachment',
  'assembl-icon-text-align-left',
  'assembl-icon-text-align-right',
  'assembl-icon-ellipsis',
  'assembl-icon-ellipsis-vert',
]

class Icons extends React.Component {
  render() {
    return (
      <div className="margin-xxl">
        <h2 className="dark-title-2 underline" id="icons" style={{ borderBottom: "1px solid #ccc"}}>ICONS</h2>
        <section>
          <h3 className="dark-title-3">complete icons list from the fontello font</h3>
          {icons.map(icon =>
          <div className="inline padding" key={icon} title={icon}>
            <span className={icon}>&nbsp;</span>
          </div>)}
        </section>
        <section>
          <h3 className="dark-title-3">icons variations</h3>
          <div className="inline padding">
            normal<br/>
            <span className="assembl-icon-add">&nbsp;</span>
          </div>
          <div className="inline padding">
            color<br/>
            <span className="assembl-icon-add color">&nbsp;</span>
          </div>
          <div className="inline padding">
            grey<br/>
            <span className="assembl-icon-add grey">&nbsp;</span>
          </div>
          <div className="inline padding">
            black<br/>
            <span className="assembl-icon-add black">&nbsp;</span>
          </div>
          <div className="inline padding" style={{backgroundColor: 'gray', color: 'white'}}>
            white<br/>
            <span className="assembl-icon-add white">&nbsp;</span>
          </div>
        </section>
        <section>
          <h3 className="dark-title-3">other images</h3>
          <div className="inline padding">
            <div className="sentiment">
              <Like size={25} />
            </div>
          </div>
          <div className="inline padding">
            <div className="sentiment">
              <Disagree size={25} />
            </div>
          </div>
          <div className="inline padding">
            <div className="sentiment">
              <DontUnderstand size={25} />
            </div>
          </div>
          <div className="inline padding">
            <div className="sentiment">
              <MoreInfo size={25} />
            </div>
          </div>
          <div>
            <Doughnut like={123} disagree={12} />
          </div>
          <div>
            <Pointer />
          </div>
          <div>
            <Ellipsis />
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
            &lt;span className="assembl-icon-add"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="assembl-icon-add color"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="assembl-icon-add grey"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="assembl-icon-add black"&gt;&lt;/span&gt;
          </pre>
          <pre>
            &lt;span className="assembl-icon-add white"&gt;&lt;/span&gt;
          </pre>
          <pre>
            import Like from './components/svg/like'
            <div>&lt;div className="sentiment"&gt;</div>
              <div style={{paddingLeft:`${20}px`}}>&lt;Like size=&#123;25&#125; /&gt;</div>
            <div>&lt;/div&gt;</div>
          </pre>
          <pre>
            import Disagree from './components/svg/disagree'
            <div>&lt;div className="sentiment"&gt;</div>
              <div style={{paddingLeft:`${20}px`}}>&lt;Disagree size=&#123;25&#125; /&gt;</div>
            <div>&lt;/div&gt;</div>
          </pre>
          <pre>
            import DontUnderstand from './components/svg/dontUnderstand'
            <div>&lt;div className="sentiment"&gt;</div>
              <div style={{paddingLeft:`${20}px`}}>&lt;DontUnderstand size=&#123;25&#125; /&gt;</div>
            <div>&lt;/div&gt;</div>
          </pre>
          <pre>
            import MoreInfo from './components/svg/moreInfo'
            <div>&lt;div className="sentiment"&gt;</div>
              <div style={{paddingLeft:`${20}px`}}>&lt;MoreInfo size=&#123;25&#125; /&gt;</div>
            <div>&lt;/div&gt;</div>
          </pre>
          <pre>
            import Doughnut from './components/svg/Doughnut'
            <div>&lt;Doughnut like=&#123;123&#125; disagree=&#123;12&#125; /&gt;</div>
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