Group and panels architecture
=============================

The class hierarchy is the following

* :js:class:`groupContainer`
 * :js:attr:`groupContainer.collection` : contains a :js:class:`GroupSpecs` collection
  * :js:class:`GroupSpecModel`
   * :js:attr:`GroupSpecModel.panels` : contains a :js:class:`PanelSpecs` collection
    * :js:class:`PanelSpecModel`
     * :js:attr:`PanelSpecModel.type` : one of :js:class:`PanelSpecTypes`
 * :js:attr:`groupContainer`.children : is a :js:class:`groupContent` iterator
  * :js:attr:`groupContent`.children : is a :js:class:`PanelWrapper` iterator
   * :js:class:`PanelWrapper`
    * :js:attr:`PanelWrapper.contentsView` : is a subclass of :js:class:`AssemblPanel`, of which every panel inherits
