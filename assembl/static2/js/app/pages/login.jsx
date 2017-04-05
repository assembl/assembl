import React from 'react';
import { connect } from 'react-redux';
import { Grid, Row, Col } from 'react-bootstrap';
import get from 'lodash/get';
import AsLogin from '../components/login/assemblLogin';
import {Facebook, Google, Twitter} from '../components/login/socialMediaLogin';
import parse from '../utils/literalStringParser';


class Login extends React.Component {
  render() {
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;    
    let next = get(this.props, 'location.query.next', null);
    let error_message = get(this.props, 'location.query.error', null);
    return (
      <Grid fluid className="login-container">
        <div className="login-view">
          <div className="box-title">{debateData.topic}</div>
          <div className="box">
            <Row className="max-container center">
              <Col xs={12} md={6}>
                <Facebook />
                <Twitter />
                <Google />
              </Col>          
              <Col xs={12} md={6}>
                <AsLogin next={next} error_message={error_message}
                  slug={debateData.slug} rootPath={rootPath}/>
              </Col>
            </Row>
          </div>
        </div>
      </Grid>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    context: state.context
  };
};

export default connect(mapStateToProps)(Login);