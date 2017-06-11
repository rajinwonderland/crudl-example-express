# CRUDL express example
This is a [CRUDL](http://crudl.io/) example with [Node.js](https://nodejs.org), [Express](http://expressjs.com/) (REST and GraphQL) and [MongoDB](https://mongodb.com).

* CRUDL is still under development and the syntax might change (esp. with connectors and views).
* The relevant part for your admin interface is within the folder crudl-admin-rest/admin/ (resp. crudl-admin-graphql/admin/). All other files and folders are generally given when using CRUDL.
* The views are intentionally verbose in order to illustrate the possibilites with CRUDL.

## Contents
* [Requirements](#requirements)
* [Installation](#installation)
    * [Installation (REST)](#installation-rest)
    * [Installation (GraphQL)](#installation-graphql)
* [CRUDL documentation](#crudl-documentation)
* [Interface](#interface)
* [Connectors & Views](#connectors--views)
    * [Connectors](#connectors)
    * [Views](#views)
* [Notes](#notes)
    * [Authentication](#authentication)
    * [Field dependency](#field-dependency)
    * [Foreign Key, Many-to-Many](#foreign-key-many-to-many)
    * [Relation with different endpoint](#relation-with-different-endpoint)
    * [Normalize/denormalize](#normalizedenormalize)
    * [Custom components](#custom-components)
    * [Initial values](#initial-values)
    * [Validate fields and form](#validate-fields-and-form)
    * [Custom column with listView](#custom-column-with-listview)
    * [Multiple sort with listView](#multiple-sort-with-listview)
    * [Filtering with listView](#filtering-with-listview)
    * [Change password](#change-password)
* [Limitations](#limitations)
* [Credits & Links](#credits--links)

## Requirements
* Node.js 5+
* MongoDB 2.6+

## Installation
In order to use this example, you need to setup the API and serve the CRUDL admin interface (either REST or GraphQL or both).

### Installation (REST)
1. Start mongodb:

    ```shell
    $ mongod --dbpath "/path/to/my/database/"
    ```

2. Clone this repository and cd into the new folder:

    ```shell
    $ git clone https://github.com/crudlio/crudl-example-express.git
    $ cd crudl-example-express
    ```

2. Initialize the database and start the server:

    ```shell
    $ cd blog
    blog $ npm install --no-optional
    blog $ npm run initdb
    blog $ npm run start
    ```

    If nodemon is not yet installed, you need to run ``npm install -g nodemon`` before starting the server.

4. Open a new terminal window/tab and build the CRUDL admin file. Go to /crudl-admin-rest/ and type:

    ```shell
    crudl-admin-rest $ npm install --no-optional
    crudl-admin-rest $ npm run watchify
    ```

5. Open your browser, go to ``http://localhost:3000/crudl-rest/`` and login with the demo user (demo/demo).

### Installation (GraphQL)
Steps 1 to 3 are equal to [Installation (REST)](#installation-rest).

4. Open a new terminal window/tab and build the CRUDL admin file. Go to /crudl-admin-graphql/ and type:

    ```shell
    crudl-admin-graphql $ npm install --no-optional
    crudl-admin-graphql $ npm run watchify
    ```

5. Open your browser, go to ``http://localhost:3000/crudl-graphql/`` and login with the demo user (demo/demo).

## CRUDL documentation
https://github.com/crudlio/crudl

## Interface
What you get with CRUDL is an administration interface which consists of these elements:

**Dashboard**
* The main entry page (currently just contains a description).

**listView** (per ressource)
* A sortable table with all objects per ressource.
* The objects are usually paginated (either numbered or continuous).
* Includes a sidebar with search and filters.

**change/addView** (per object)
* The form (fields and fieldsets) for adding/updating an object.
* Optionally with tabs for complex relations (e.g. links with entries).

Moreover, you'll have a **Menu/Navigation** (on the left hand side), a **Login/Logout** page and **Messages**.

## Notes
While this example is simple, there's still a couple of more advanced features in order to represent a real-world scenario.

## Connectors & Views
In order for CRUDL to work, you mainly need to define _connectors_ and _views_.

### Connectors
The _connectors_ provide the views with a unified access to different APIs like REST or GraphQL. Each _connector_ usually represents a single API endpoint (or query) and implements the CRUD methods (create, read, update, delete). Moreover, the _connector_ handles pagination and transforms the request/response.

There is a npm package implementing general connectors [crudl-connectors-base](https://github.com/crudlio/crudl-connectors-base) that can be extended (using middleware) to fit your particular needs.

### Views
With views, you create the visual representation by defining the _listView_, _changeView_ and _addView_ options:

```javascript
var listView = {
    // Required
    path: "api/path/to/collection",
    title: "Collection Name",
    actions: {
        list: listConnector.read,
    }
    fields: [],
    // Optional
    filters: [],
    normalize: (data) => { },
}

var changeView = {
    // Required
    path: "api/path/to/collection/:_id",
    title: "Detail Name",
    actions: {
        get: req => detailConnector(crudl.path._id).read(req),
        save: req => detailConnector(crudl.path._id).update(req),
        delete: req => detailConnector(crudl.path._id).delete(req),
    },
    // Either fields or fieldsets
    fields: [],
    fieldsets: [],
    // Optional
    tabs: [],
    normalize: (data) => { },
    denormalize: (data) => { },
    validate: function (values) { },
}
```

### Authentication
Both the REST and GraphQL API is only accessible for logged-in users based on TokenAuthentication. Besides the Token, we also return an attribute _info_ in order to subsequently have access to the currently logged-in user (e.g. for filtering). The _info_ is exposed in the global variable `crudl.auth`.

The REST login [connector](crudl-admin-rest/admin/connectors/index.js) looks like this:
```js
const login = createExpressConnector('login/')
    .use(transformData('create',
        data => ({
            requestHeaders: { "Authorization": `Token ${data.token}` },
            info: data,
        })
    ))
```

### Field dependency
With _Entries_, the _Categories_ depend on the selected _Section_. If you change the field _Section_, the options of field _Category_ are populated based on the chosen _Section_ due to the _watch_ method.

```javascript
{
    name: 'category',
    field: 'Autocomplete',
    onChange: [
        {
            in: 'section',
            setProps: (section) => {
                if (!section.value) {
                    return {
                        readOnly: true,
                        helpText: 'In order to select a category, you have to select a section first',
                    }
                }
                // Get the catogories options filtered by section
                return options('categories', '_id', 'name')
                .read(crudl.req().filter('section', section.value))
                .then(({ options }) => {
                    if (options.length > 0) {
                        return {
                            readOnly: false,
                            helpText: 'Select a category',
                            options,
                        }
                    } else {
                        return {
                            readOnly: true,
                            helpText: 'No categories available for the selected section.'
                        }
                    }
                })
            }
        }
    ],
}
```

You can use the same syntax with list filters (see entries.js).

### Foreign Key, Many-to-Many
There are a couple of foreign keys being used (e.g. _Section_ or _Category_ with _Entry_) and one many-to-many field (_Tags_ with _Entry_).

```js
{
    name: 'section',
    label: 'Section',
    field: 'Select',
    lazy: () => options('sections', '_id', 'name').read(crudl.req()),
},
{
    name: 'category',
    label: 'Category',
    field: 'Autocomplete',
    actions: {
        select: req => options('categories', '_id', 'name')
            .read(req.filter('idIn', req.data.selection.map(item => item.value).toString()))
            .then(({ options }) => options),
        search: (req) => {
            return options('categories', '_id', 'name')
            .read(req.filter('name', req.data.query).filter('section', crudl.context('section')))
            .then(({ options }) => options)
        },
    },
},
{
    name: 'tags',
    label: 'Tags',
    field: 'AutocompleteMultiple',
    required: false,
    showAll: false,
    helpText: 'Select a tag',
    actions: {
        search: (req) => {
            return options('tags', '_id', 'name')
            .read(req.filter('name', req.data.query.toLowerCase()))
            .then(({ options }) => options)
        },
        select: (req) => {
            return options('tags', '_id', 'name')
            .read(req.filter('idIn', req.data.selection.map(item => item.value).toString()))
            .then(({ options }) => options)
        },
    },
}
```

### Relation with different endpoint
The descriptor _Links_ is an example of related objects which are assigned through an intermediary table with additional fields.

```javascript
changeView.tabs = [
    {
        title: 'Links',
        actions: {
            list: (req) => links.read(req.filter('entry', crudl.path._id)),
            add: (req) => links.create(req),
            save: (req) => link(req.data._id).update(req),
            delete: (req) => link(req.data._id).delete(req)
        },
        getItemTitle: (data) => `${data.url} (${data.title})`,
        fields: [
            {
                name: 'url',
                label: 'URL',
                field: 'URL',
                link: true,
            },
            {
                name: 'title',
                label: 'Title',
                field: 'String',
            },
            {
                name: '_id',
                hidden: true,
            },
            {
                name: 'entry',
                hidden: true,
                initialValue: () => crudl.context.data._id,
            },
        ],
    },
]
```
- The actions `list`, `add`, `save` and `delete` follow the same logic as the corresponding actions of list, change and add views.
- `getItemTitle: (data) => <string>` defines the displayed title of the item form. If it is not provided, then the value of the first field is used (in this case it would be the URL value).
- It's typical for the tab views to make use of hidden fields to include the related object's id in the form data.


### Normalize/denormalize
With _Entries_, we set the owner to the currently logged-in user with denormalize:

```javascript
var addView = {
    denormalize: (data) => {
        /* set owner on add. alternatively, we could manipulate the data
        with the connector by using createRequestData */
        if (crudl.auth.user) data.owner = crudl.auth.user
        return data
    }
}
```

With _Users_, we add a custom column full_name with the listView:

```javascript
var listView = {
    normalize: (list) => list.map(item => {
        item.full_name = <span><b>{item.last_name}</b>, {item.first_name}</span>
        return item
    })
}
```

### Custom field components
We have added a custom component _SplitDateTimeField.jsx_ (see admin/fields) in order to show how you're able to implement fields which are not part of the core package. Usage example:
```js
// See users.js (in both examples)
{
    name: 'date_joined',
    label: 'Date joined',
    field: SplitDateTimeField,  // Custom component
    getTime: (date) => {...},   // getTime is a required prop of SplitDateTimeField
    getDate: (date) => {...},   // getDate is a required prop of SplitDateTimeField
},
```

### Initial values
You can set initial values with every field (based on context, if needed).

```javascript
{
    name: 'date',
    label: 'Date',
    field: 'Date',
    initialValue: () => formatDate(new Date())
},
{
    name: 'user',
    label: 'User',
    field: 'hidden',
    initialValue: () => crudl.auth.user
},
```

### Validate fields and form
Validation should usually be handled with the API. That said, it sometimes makes sense to use frontend validation as well.

```javascript
{
    name: 'date_gt',
    label: 'Published after',
    field: 'Date',
    /* simple date validation */
    validate: (value, allValues) => {
        const dateReg = /^\d{4}-\d{2}-\d{2}$/
        if (value && !value.match(dateReg)) {
            return 'Please enter a date (YYYY-MM-DD).'
        }
    }
},
{
    name: 'summary',
    label: 'Summary',
    field: 'Textarea',
    validate: (value, allValues) => {
        if (!value && allValues.status == 'Online') {
            return 'The summary is required with status "Online".'
        }
    }
},
```

In order to validate the complete form, you define a function _validate_ with the _changeView_ or _addView_:

```javascript
var changeView = {
    path: 'entries/:_id',
    title: 'Blog Entry',
    actions: { ... },
    validate: function (values) {
        if (!values.category && !values.tags) {
            return { _error: 'Either `Category` or `Tags` is required.' }
        }
    }
}
```

### Custom column with listView
With _Entries_, we added a custom column to the _listView_ based on the currently logged-in user.

```javascript
var listView = {
    path: 'entries',
    title: 'Blog Entries',
    actions: {
        /* here we add a custom column based on the currently logged-in user */
        list: req => entries.read(req).then(results => results.map(item => {
            item.is_owner = crudl.auth.user === item.owner
            return item
        }))
    },
}

listView.fields = [
    { ... }
    {
        name: 'is_owner',
        label: 'Owner',
        render: 'boolean',
    },
]
```

### Multiple sort with listView
The _listView_ supports ordering by multiple columns (see entries.js).

### Filtering with listView
Filtering is done by defining fields with _listView.filters_ (see entries.js). You have all the options available with the _changeView_ (e.g. initial values, field dependency, autocompletes, ...).

### Change password
You can only change the password of the currently logged-in _User_ (see views/users.js)

## Limitations
* Sorting with MongoDB is case sensitive. With aggregation, it is possible to implement case-insensitive sorting.
* Searching is only possible on one field per ressource (this is an API limitation). If someome comes up with a decent solution on searching within multiple fiels (including nested fields), please let us know.

## Credits & Links
CRUDL and crudl-example-express is written and maintained by vonautomatisch (Patrick Kranzlmüller, Axel Swoboda, Václav Pfeifer-Mikolášek).

* http://crudl.io
* https://twitter.com/crudlio
* http://vonautomatisch.at
