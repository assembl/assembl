import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import ColumnSynthesis from '../../../../../js/app/components/debate/multiColumns/columnSynthesis';

describe('ColumnSynthesis component', () => {
  it('should render a folded post', () => {
    const props = {
      classifier: 'positive',
      synthesisTitle: 'We need to input the optical SSL microchip!',
      synthesisBody:
        'Excepturi est rerum nulla explicabo ex voluptatibus quam repellendus. Repudiandae quia nesciunt autem et aliquid. Dolores nisi perferendis voluptas corrupti voluptate molestias est. Porro et rerum sunt accusantium dolores qui.',
      hyphenStyle: {
        borderTopColor: 'green'
      }
    };
    const renderer = new ShallowRenderer();
    renderer.render(<ColumnSynthesis {...props} />);
    const result = renderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});