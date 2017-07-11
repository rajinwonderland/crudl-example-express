import { slugify } from '../utils'
import React from 'react'

import { list, detail, options } from '../connectors'

const sections = list('sections');
const section = detail('sections');
const entries = list('entries');

//-------------------------------------------------------------------
var listView = {
    path: 'sections',
    title: 'Sections',
    actions: {
        /* counting the entries requires an additional API call per row. please note that the
        number of entries could be added at the database level, removing this additional call. */
        list: function (req) {
            return sections.read(req)
            .then(res => {
                // The result of the following line is an array of promises, where each promise resolves
                // to an array of entries associated with the item
                let promises = res.map(item => entries.read(req.filter('section', item._id)))
                // We return a single promise that synchronizes on all the promises created in the previous step
                return Promise.all(promises)
                // We create a new attribute called 'counter_entries'
                .then((itemEntries) => {
                    res.forEach((item, i) => Object.assign(item, { counter_entries: itemEntries[i].length}))
                    return res
                })
            })
		}
    },
}

// listView.bulkActions = {
//     delete: {
//         description: 'Delete selected',
//         modalConfirm: {
//             message: "All the selected items will be deleted. This action cannot be reversed!",
//             modalType: 'modal-delete',
//             labelConfirm: "Delete All",
//         },
//         action: (selection) => {
//             return Promise.all(selection.map(
//                 item => section(item._id).delete(crudl.req()))
//             )
//             .then(() => crudl.successMessage(`All items (${selection.length}) were deleted`))
//         },
//     }
// }

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

//-------------------------------------------------------------------
var changeView = {
    path: 'sections/:_id',
    title: 'Section',
    actions: {
        get: function (req) { return section(crudl.path._id).read(req) },
        delete: function (req) { return section(crudl.path._id).delete(req) },
        save: function (req) { return section(crudl.path._id).update(req) },
    },
}

changeView.fields = [
    {
        name: 'name',
        label: 'Name',
        field: 'String',
        required: true
    },
    {
        name: 'slug',
        label: 'Slug',
        field: 'String',
        onChange: {
            in: 'name',
            setInitialValue: (name) => slugify(name.value),
        },
        helpText: <span>If left blank, the slug will be automatically generated.
            More about slugs <a href="http://en.wikipedia.org/wiki/Slug" target="_blank">here</a>.</span>,
    },
]

//-------------------------------------------------------------------
var addView = {
    path: 'sections/new',
    title: 'New Section',
    fields: changeView.fields,
    actions: {
        add: function (req) { return sections.create(req) },
    },
}


module.exports = {
    listView,
    changeView,
    addView,
}
