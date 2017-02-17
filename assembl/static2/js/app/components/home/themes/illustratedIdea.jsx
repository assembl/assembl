import React from 'react';
import { Link } from 'react-router';
import { Glyphicon } from 'react-bootstrap';

class IllustratedIdea extends React.Component {
  render() {
    const { imgUrl, title, nbPosts, nbUsers } = this.props.theme;
    return(
      <div className="illustrated-idea illustration-box">
        <div className="image-box" style={{ backgroundImage: 'url(' + imgUrl + ')' }}>&nbsp;</div>
        <Link className="content-box">
          <h3 className="light-title-3">{title}</h3>
          <div className="stats">
            <div className="inline">{nbPosts}</div>
            <div className="white-icon"><Glyphicon glyph="envelope" /></div>
            <div className="inline padding">-</div>
            <div className="inline">{nbUsers}</div>
            <div className="white-icon"><Glyphicon glyph="user" /></div>
          </div>
        </Link>
        <div className="color-box">&nbsp;</div>
        <div className="box-hyphen">&nbsp;</div>
        <div className="box-hyphen rotate-hyphen">&nbsp;</div>
      </div>
    );
  }
}

export default IllustratedIdea;