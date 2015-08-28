Reporting API

Reference: http://developer.piwik.org/api-reference/reporting-api

This API allows for data to be collected, queried, and pivoted. The fundamental components needed to for an api call are:
- host: piwil.coeus.ca
- idSite: found under Administration/Websites for each individual website that the piwik server manages analytics on
- authToken: found under Administration/Users for each user
- format: data stream can be returned in many formats: HTML, JSON, XML, PHP code, CSV, RSS
- period: the period of concern, eg. &period=range&date=2011-01-01,2011-02-15 (note, YYYY-MM-DD)
  - special keywords: day, week, month, year, range
- date: the date of concern (note, YYYY-MM-DD)
  - special:
    - today, yesterday
    - lastX, eg. &date=last10&period=day
    - previousX
- segment: allows to query subset of data using advanced queries
  Read more about it here: http://developer.piwik.org/api-reference/reporting-api-segmentation


For visual elements, use the ImageGraph module

API signature: 
ImageGraph.get (idSite, period, date, apiModule, apiAction, graphType = '', outputType = '0', columns = '', labels = '', showLegend = '1', width = '', height = '', fontSize = '9', legendFontSize = '', aliasedGraph = '1', idGoal = '', colors = '', textColor = '222222', backgroundColor = 'FFFFFF', gridColor = 'CCCCCC', idSubtable = '', legendAppendMetric = '1', segment = '')

Eg. from piwik demo site:
http://demo.piwik.org/?module=API&method=ImageGraph.get&idSite=7&period=day&date=today&apiModule=UserCountry&apiAction=getCountry&outputType=0&showLegend=1&fontSize=9&aliasedGraph=1&textColor=222222&backgroundColor=FFFFFF&gridColor=CCCCCC&legendAppendMetric=1&format=JSON&token_auth=anonymous 

Note, module=API is usually the case
method = method signiature from documentation
apiModule = Module Name
apiAction = Action Name


TODO: Find the html snipplet on dashboard to export already existing piwik widgets to an iframe
