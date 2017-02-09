import React from 'react';
import { Glyphicon } from 'react-bootstrap';

class Icons extends React.Component {
  render() {
    return (
      <div>
        <h2 className="title-2 underline" id="icons">ICONS</h2>
        <section>
          <div className="rounded-icon"><Glyphicon glyph="search" /></div>
          <div className="rounded-icon"><Glyphicon glyph="user" /></div>
          <div className="white-icon"><Glyphicon glyph="question-sign" /></div>
          <div className="black-icon"><Glyphicon glyph="comment" /></div>
          <div className="black-icon"><Glyphicon glyph="log-in" /></div>
          <div className="black-icon"><Glyphicon glyph="user" /></div>
          <div className="black-icon"><Glyphicon glyph="eye-open" /></div>
          <div className="black-icon"><Glyphicon glyph="align-justify" /></div>
          <div className="black-icon"><Glyphicon glyph="remove" /></div>
          <div style={{ backgroundColor: '#4a4a4a', width: `${100}px`, padding: `${10}px`, display: 'inline' }}>
            <img src="/static2/img/social/Facebook.svg" alt="Facebook" width="20px" style={{ marginRight: `${10}px` }} />
            <img src="/static2/img/social/Twitter.svg" alt="Twitter" width="20px" style={{ marginRight: `${10}px` }} />
            <img src="/static2/img/social/Linkedin.svg" alt="Linkedin" width="20px" style={{ marginRight: `${10}px` }} />
          </div>
        </section>
        <section>
          <h3 className="title-3">Code</h3>
          <div className="box">
            <div>
              <div className="code">
                <span>&lt;</span>
                <span>div className=&quot;rounded-icon&quot;</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>Glyphicon glyph=&quot;search&quot; /</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>/div</span>
                <span>&gt;</span>
              </div>
              <div className="code">
                <span>&lt;</span>
                <span>div className=&quot;rounded-icon&quot;</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>Glyphicon glyph=&quot;user&quot; /</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>/div</span>
                <span>&gt;</span>
              </div>
              <div className="code">
                <span>&lt;</span>
                <span>div className=&quot;white-icon&quot;</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>Glyphicon glyph=&quot;question-sign&quot; /</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>/div</span>
                <span>&gt;</span>
              </div>
              <div className="code">
                <span>&lt;</span>
                <span>div className=&quot;black-icon&quot;</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>Glyphicon glyph=&quot;comment&quot; /</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>/div</span>
                <span>&gt;</span>
              </div>
              <div className="code">
                <span>&lt;</span>
                <span>div className=&quot;black-icon&quot;</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>Glyphicon glyph=&quot;log-in&quot; /</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>/div</span>
                <span>&gt;</span>
              </div>
              <div className="code">
                <span>&lt;</span>
                <span>div className=&quot;black-icon&quot;</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>Glyphicon glyph=&quot;user&quot; /</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>/div</span>
                <span>&gt;</span>
              </div>
              <div className="code">
                <span>&lt;</span>
                <span>div className=&quot;black-icon&quot;</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>Glyphicon glyph=&quot;eye-open&quot; /</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>/div</span>
                <span>&gt;</span>
              </div>
              <div className="code">
                <span>&lt;</span>
                <span>div className=&quot;black-icon&quot;</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>Glyphicon glyph=&quot;align-justify&quot; /</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>/div</span>
                <span>&gt;</span>
              </div>
              <div className="code">
                <span>&lt;</span>
                <span>div className=&quot;black-icon&quot;</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>Glyphicon glyph=&quot;remove&quot; /</span>
                <span>&gt;</span>
                <span>&lt;</span>
                <span>/div</span>
                <span>&gt;</span>
              </div>
              <div className="code">
                <span>&lt;</span>
                <span>img src=&quot;/static2/img/social/Facebook.svg&quot; alt=&quot;Facebook&quot;/&nbsp;</span>
                <span>&gt;</span>
              </div>
              <div className="code">
                <span>&lt;</span>
                <span>img src=&quot;/static2/img/social/Twitter.svg&quot; alt=&quot;Twitter&quot;/&nbsp;</span>
                <span>&gt;</span>
              </div>
              <div className="code">
                <span>&lt;</span>
                <span>img src=&quot;/static2/img/social/Linkedin.svg&quot; alt=&quot;Linkedin&quot;/&nbsp;</span>
                <span>&gt;</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default Icons;