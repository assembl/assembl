import React from 'react';
import { OverlayTrigger } from 'react-bootstrap';
import { connect } from 'react-redux';

import * as actions from '../../../actions/adminActions/resourcesCenter';
import { createResourceTooltip } from '../../common/tooltips';
import EditResourceForm from './editResourceForm';
import { createRandomId } from '../../../utils/globalFunctions';

const ManageResourcesForm = ({ createResource, resources, editLocale }) => (
  <div style={{ paddingBottom: '50px' }}>
    {resources.map((id, index) => <EditResourceForm key={id} id={id} editLocale={editLocale} index={index} />)}
    <OverlayTrigger placement="top" overlay={createResourceTooltip}>
      <div onClick={() => createResource(resources.size + 1)} className="plus margin-l" id="add-media-button">
        +
      </div>
    </OverlayTrigger>
  </div>
);

const mapStateToProps = (state) => {
  const { resourcesInOrder, resourcesById } = state.admin.resourcesCenter;
  return {
    resources: resourcesInOrder.filter(id => !resourcesById.get(id).get('_toDelete'))
  };
};

const mapDispatchToProps = dispatch => ({
  createResource: (nextOrder) => {
    const newId = createRandomId();
    return dispatch(actions.createResource(newId, nextOrder));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(ManageResourcesForm);