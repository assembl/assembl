// @flow
import React from 'react';
import { connect } from 'react-redux';
import Section from '../components/common/section';
import { Col, Grid, Row } from 'react-bootstrap';
import Header from './synthesis';

type Props = {
  subject: string,
  body: string
};

class Synthesis extends React.Component<Props> {
  handleLoad = () => {};

  render() {
    const { subject, body } = this.props;
    return (
      <Grid>
        <Header title={subject} imgUrl="" type="synthesis" />
        <Section title="" className="synthesis-block">
          <Row>
            <Col mdOffset={3} md={8} smOffset={1} sm={10}>
              <div dangerouslySetInnerHTML={{ __html: body }} />
            </Col>
          </Row>
        </Section>
      </Grid>
    );
  }
}

const mockProps = () => ({
  title: 'Un bon titre de synthèse',
  body: '<p>OMG</p>'
});

export default connect(mockProps)(Synthesis);