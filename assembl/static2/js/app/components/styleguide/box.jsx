import React from 'react';
import { Row, Col } from 'react-bootstrap';

class Box extends React.Component {
  render() {
    const imgUrl = 'http://www.yannarthusbertrand.org/img/2012/03/vu-du-ciel-9_p11_l.jpg';
    return (
      <div className="margin-xxl">
        <h2 className="dark-title-2 underline" id="box" style={{ borderBottom: "1px solid #ccc"}}>BOX</h2>
        <section>
          <div className="box-title">Box title</div>
          <div className="box">Box content</div>
          <div className="insert-box margin-m" style={{ border: '1px solid #f3f0f4' }}>
            <h3 className="dark-title-3">Box title</h3>
            <div className="box-hyphen">&nbsp;</div>
            <div>Box content</div>
          </div>
          <Row>
            <Col xs={12} md={4} className="no-padding">
              <div className="illustration-box margin-m">
                <div className="image-box" style={{ backgroundImage: 'url(' + imgUrl + ')' }}>&nbsp;</div>
                <a className="content-box">&nbsp;</a>
                <div className="color-box">&nbsp;</div>
                <div className="box-hyphen">&nbsp;</div>
                <div className="box-hyphen rotate-hyphen">&nbsp;</div>
              </div>
            </Col>
          </Row>
          <div className="margin-m">&nbsp;</div>
          <div className="theme-box" style={{ width: `${300}px`, height: `${300}px`, borderTop: '1px solid #f3f0f4', borderRight: '1px solid #f3f0f4', borderBottom: '1px solid #f3f0f4' }}>&nbsp;</div>
        </section>
        <section>
          <h3 className="dark-title-3">Code</h3>
          <pre>
            <div>&lt;div className="box-title"&gt;Box title&lt;/div&gt;</div>
            <div>&lt;div className="box"&gt;Box content&lt;/div&gt;</div>
          </pre>
          <pre>
            <div>&lt;div className="insert-box"&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;h3 className="dark-title-3"&gt;Box title&lt;/h3&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;div className="box-hyphen"&gt;&nbsp;&lt;/div&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;div&gt;Box content&lt;/div&gt;</div>
            <div>&lt;/div&gt;</div>
          </pre>
          <pre>
            <div>&lt;div className="illustration-box"&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;div className="image-box" style=&#123;&#123; backgroundImage: 'url(imgUrl)' &#125;&#125;>&nbsp&lt;/div&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;Link className="content-box"&gt;Content here&lt;/Link&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;div className="color-box"&gt;&nbsp&lt;/div&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;div className="box-hyphen"&gt;&nbsp&lt;/div&gt;</div>
              <div style={{ marginLeft: `${20}px` }}>&lt;div className="box-hyphen rotate-hyphen"&gt;&nbsp&lt;/div&gt;</div>
            <div>&lt;/div&gt;</div>
          </pre>
          <pre>
            &lt;div className="theme-box"&gt;&nbsp;&lt;/div&gt;
          </pre>
        </section>
      </div>
    );
  }
}
export default Box;