import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbSurveyTable } from '../../../../../../js/app/components/debate/navigation/tables/surveyTable';

describe('SurveyTable component', () => {
  it('should match the SurveyTable', () => {
    const data = {
      thematics: [
        {
          id: 'foo',
          parentId: 'root'
        },
        {
          id: 'bar',
          parentId: 'root'
        }
      ],
      rootIdea: {
        id: 'root'
      }
    };
    const props = {
      identifier: 'survey',
      phaseId: 'phaseFoo',
      data: data
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbSurveyTable {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});