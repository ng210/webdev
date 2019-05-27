# SimonsVoss Coding Case

## Solution design
There is a data source and a type description as JSON files. In my solution the backend creates a model on start-up. This model resolves the references (UUID) in the JSON files and builds an index, that is a map between UUID and object. This preparation is to accelerate and simplify the search operations.
The backend uses express as middleware, accept requests on the path of _/search/[search expression]_, _/[resource type]/[resource id]_, all other requests are responded with a 404 message. In order to handle CORS requests the _options_ (preflight) HTTP verb is processed.
The frontend is quite minimalistic, consits of a text field and a button to start a search and a table to display the results. The columns of the table are specified in a map (_columns) that bind a column to an attribute of the result entries. This makes it easy to add new columns. In the first column there are links to the resources, that trigger a GET operation according to the RESTful form and returns a JSON representation of the requested resource.
Since I did not use any UI frameworks, I added an async function (send) for the AJAX communication. The function sends XHR requests to a fixed URL using the _GET_ method. To enhance the functionality of the web page with the other RESTful actions this send function has to be changed.

## Usage
The search expression can be one or more words seperated by white spaces. The expression has to be at least 3 characters long. This was added as a resonable criterium to limit search results. The search can be launched either by pressing _ENTER_ or by clicking the _Search_ button.
