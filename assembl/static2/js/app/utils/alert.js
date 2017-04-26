/*
  A module that manages the alert system in Assembl
*/
// Singleton object that will contain the AlertManager, which will be used to show/hide/manipulate the alert system
class AlertManagerClass {
  setComponent(comp) {
    this.alertComponent = comp;
  }
  displayAlert(style, msg, topPosition = false, time = 6000) {
    this.alertComponent.setState({
      base: false,
      alertStyle: style,
      alertMsg: msg,
      showAlert: true,
      topPosition: topPosition
    });
    setTimeout(() => {
      this.alertComponent.setState({
        showAlert: false
      });
    }, time);
  }
}

const manager = new AlertManagerClass();

export default manager;