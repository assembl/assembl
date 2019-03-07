// @flow
import React from 'react';
import { FormGroup, Row, Col } from 'react-bootstrap';
import Section from '../components/common/section';
import FormControlWithLabel from '../components/common/formControlWithLabel';

const CreateSynthesis = () => (
  <div className="administration max-container create-synthesis">
    <Section title="debate.syntheses.createNewSynthesis" translate>
      <Row>
        <Col xs={8}>
          <div className="admin-box">
            <FormControlWithLabel label="Titre de la synthèse" required type="text" value="" onChange={() => {}} />
          </div>
        </Col>e
      </Row>
    </Section>
  </div>
);

export default CreateSynthesis;