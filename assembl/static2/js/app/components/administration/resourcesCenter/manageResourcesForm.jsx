import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';

import * as actions from '../../../actions/adminActions/resourcesCenter';
import EditResourceForm from './editResourceForm';

export const createResourceTooltip = (
  <Tooltip id="createResourceTooltip">
    <Translate value="administration.resourcesCenter.createResource" />
  </Tooltip>
);

const ManageResourcesForm = ({ createResource, resources, selectedLocale }) => {
  return (
    <div>
      {resources.map((id) => {
        return <EditResourceForm key={id} id={id} locale={selectedLocale} />;
      })}
      <OverlayTrigger placement="top" overlay={createResourceTooltip}>
        <div
          onClick={() => {
            return createResource(resources.size + 1);
          }}
          className="plus margin-l"
        >
          +
        </div>
      </OverlayTrigger>
    </div>
  );
};

const mapStateToProps = (state) => {
  const { resourcesInOrder, resourcesById } = state.admin.resourcesCenter;
  return {
    resources: resourcesInOrder.filter((id) => {
      return !resourcesById.get(id).get('toDelete');
    }),
    selectedLocale: state.admin.selectedLocale
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    createResource: (nextOrder) => {
      const newId = Math.round(Math.random() * -1000000).toString();
      return dispatch(actions.createResource(newId, nextOrder));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageResourcesForm);