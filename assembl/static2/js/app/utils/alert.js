/*
  A module that manages the alert system in Assembl  
*/

// Singleton object that will contain the AlertManager, which will be used to show/hide/manipulate the alert system
let alert;

class AlertManager {
  constructor(component){
    this.alertComponent = component;
  }

  displayAlert(style, msg, time=6000) {
    this.alertComponent.setState({
      alertStyle: style,
      alertMsg: msg,
      showAlert: true
    });
    setTimeout(() => {
      this.alertComponent.setState({
        showAlert: false
      });
    }, time);
  };
}

export const Alert = (comp) => {
  if (!alert && comp) {
    alert = new AlertManager(comp)
    return alert;
  }
  else { return alert; }
};
