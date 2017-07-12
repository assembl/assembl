import React from 'react';
import { Row, Col, FormGroup, FormControl, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';

const TEXT_AREA_MAX_LENGTH = 3000;
const TEXT_AREA_ROWS = 10;

const AnswerForm = ({ body }) => {
  const handleBodyChange = () => {};
  const resetForm = () => {};
  const answerPost = () => {};
  return (
    <Row>
      <Col xs={12} md={12}>
        <div className="color"><span className="assembl-icon-back-arrow" />&nbsp;<Translate value="debate.answer" /></div>
      </Col>
      <Col xs={12} md={12} className="margin-m">
        <FormGroup>
          <FormControl
            className="txt-area"
            componentClass="textarea"
            placeholder={I18n.t('debate.insert')}
            maxLength={TEXT_AREA_MAX_LENGTH}
            rows={TEXT_AREA_ROWS}
            value={body}
            onChange={handleBodyChange}
          />
          <div className="annotation margin-xs">
            {/* <Translate
              value="debate.remaining_x_characters"
              nbCharacters={bodyRemainingChars < 10000 ? bodyRemainingChars : TEXT_AREA_MAX_LENGTH}
            /> */}
          </div>
          <Button className="button-cancel button-dark btn btn-default left margin-l" onClick={resetForm}>
            <Translate value="cancel" />
          </Button>
          <Button className="button-submit button-dark btn btn-default right margin-l" onClick={answerPost}>
            <Translate value="debate.post" />
          </Button>
        </FormGroup>
      </Col>
    </Row>
  );
};

export default AnswerForm;