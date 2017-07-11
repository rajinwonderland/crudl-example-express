import { slugify } from '../utils'

import { list, detail } from '../connectors'

const tags = list('tags');
const tag = detail('tags'); // Partial parametrization of a detail connector: the id parameter is not yet bound
const entries = list('entries');

//-------------------------------------------------------------------
var listView = {
    path: 'tags',
    title: 'Tags',
    actions: {
        /* counting the entries requires an additional API call per row. please note that the
        number of entries could be added at the database level, removing this additional call. */
        list: function (req) {
            return tags.read(req)
            .then(res => {
                // The result of the following line is an array of promises, where each promise resolves
                // to an array of entries associated with the item
                let promises = res.map(item => entries.read(crudl.req().filter('tags', item._id)))
                // We return a single promise that synchronizes on all the promises created in the previous step
                return Promise.all(promises)
                // We create a new attribute called 'counter_entries'
                .then((itemEntries) => {
                    res.forEach((item, i) => Object.assign(item, { counter_entries: itemEntries[i].length }))
                    return res
                })
            })
		}
    },
    // bulkActions: {
    //     delete: {
    //         description: 'Delete selected',
    //         modalConfirm: {
    //             message: "All the selected items will be deleted. This action cannot be reversed!",
    //             modalType: 'modal-delete',
    //             labelConfirm: "Delete All",
    //         },
    //         action: (selection) => {
    //             return Promise.all(selection.map(
    //                 item => tag(item._id).delete(crudl.req()))
    //             )
    //             .then(() => crudl.successMessage(`All items (${selection.length}) were deleted`))
    //         },
    //     },
    // }
}

listView.fields = [
    {
        name: '_id',
        label: 'ID',
    },
    {
        name: 'name',
        label: 'Name',
        main: true,
        sortable: true,
        sorted: 'ascending',
        sortpriority: '1',
        sortKey: 'slug',
    },
    {
        name: 'slug',
        label: 'Slug',
        sortable: true,
    },
    {
        name: 'counter_entries',
        label: 'No. Entries',
    },
]

listView.filters = {
    fields: [
        {
            name: 'name',
            label: 'Search',
            field: 'Search',
            helpText: 'Name'
        },
    ]
}

//-------------------------------------------------------------------
var changeView = {
    path: 'tags/:_id',
    title: 'Tag',
    actions: {
        get: function (req) { return tag(crudl.path._id).read(req) },
        delete: function (req) { return tag(crudl.path._id).delete(req) },
        save: function (req) { return tag(crudl.path._id).update(req) },
    },
}

changeView.fields = [
    {
        name: 'name',
        label: 'Name',
        field: 'String',
    },
    {
        name: 'slug',
        label: 'Slug',
        field: 'String',
        readOnly: true,
        onChange: {
            in: 'name',
            setInitialValue: (name) => slugify(name.value),
        },
        helpText: `Slug is automatically generated when saving the Tag.`,
    },
]

//-------------------------------------------------------------------
var addView = {
    path: 'tags/new',
    title: 'New Tag',
    fields: changeView.fields,
    actions: {
        add: function (req) { return tags.create(req) },
    },
}


module.exports = {
    listView,
    changeView,
    addView,
}
