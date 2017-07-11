import { slugify, select } from '../utils'
import React from 'react'

import { list, detail, options } from '../connectors'

const categories = list('categories')
const category = detail('categories')
const entries = list('entries')
const sections = list('sections')
const section = detail('sections')

//-------------------------------------------------------------------
var listView = {
    path: 'categories',
    title: 'Categories',
    actions: {
        /* counting the entries requires an additional API call per row. please note that the
        number of entries could be added at the database level, removing this additional call. */
        list: function (req) {
            return categories.read(req)
            .then(res => {
                // The result of the following line is an array of promises, where each promise resolves
                // to an array of entries associated with the item
                let promises = res.map(item => entries.read(req.filter('category', item._id)))
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
    // bulkActions: {
    //     delete: {
    //         description: 'Delete selected',
    //         modalConfirm: {
    //             message: "All the selected items will be deleted. This action cannot be reversed!",
    //             modalType: 'modal-delete',
    //             labelConfirm: "Delete All",
    //         },
    //         action: selection => Promise.all(selection.map(
    //             item => category(item._id).delete(crudl.req()).then(
    //                 () => crudl.successMessage(`Deleted ${selection.length} items.`)
    //             )
    //         ))
    //     },
    //     changeSection: {
    //         description: 'Change Section',
    //         before: (selection) => ({ onProceed, onCancel }) => (
    //             <div>
    //                 {crudl.createForm({
    //                     id: 'select-section',
    //                     title: 'Select Section',
    //                     fields: [{
    //                         name: 'section',
    //                         label: 'Section',
    //                         field: 'Select',
    //                         lazy: () => options('sections', '_id', 'name').read(crudl.req()),
    //                     }],
    //                     onSubmit: values => onProceed(
    //                         selection.map(s => Object.assign({}, s, { section: values.section }))
    //                     ),
    //                     onCancel,
    //                 })}
    //             </div>
    //         ),
    //         action: (selection) => {
    //             return Promise.all(selection.map(
    //                 item => category(item._id).update(crudl.req(item)))
    //             ).then(() => crudl.successMessage('Successfully changed the sections'))
    //         },
    //     },
    // },
}

listView.fields = [
    {
        name: '_id',
        label: 'ID',
    },
    {
        name: 'section',
        getValue: select('section.name'),
        label: 'Section',
        sortable: true,
        sorted: 'ascending',
        sortpriority: '1',
    },
    {
        name: 'name',
        label: 'Name',
        main: true,
        sortable: true,
        sorted: 'ascending',
        sortpriority: '2',
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
            name: 'search',
            label: 'Search',
            field: 'Search',
            helpText: 'Name'
        },
        {
            name: 'section',
            label: 'Section',
            field: 'Select',
            lazy: () => options('sections', '_id', 'name').read(crudl.req()),
            initialValue: '',
        },
    ]
}

//-------------------------------------------------------------------
var changeView = {
    path: 'categories/:_id',
    title: 'Category',
    actions: {
        get: function (req) { return category(crudl.path._id).read(req) },
        delete: function (req) { return category(crudl.path._id).delete(req) },
        save: function (req) { return category(crudl.path._id).update(req) },
    },
}

changeView.fields = [
    {
        name: 'section',
        label: 'Section',
        field: 'Select',
        required: true,
        lazy: () => options('sections', '_id', 'name').read(crudl.req()),
        // add: {
        //     title: 'New section',
        //     actions: {
        //         add: req => sections.create(req).then(data => data._id),
        //     },
        //     fields: [
        //         {
        //             name: 'name',
        //             label: 'Name',
        //             field: 'String',
        //             required: true
        //         },
        //         {
        //             name: 'slug',
        //             label: 'Slug',
        //             field: 'String',
        //             onChange: {
        //                 in: 'name',
        //                 setInitialValue: (name) => slugify(name.value),
        //             },
        //             helpText: <span>If left blank, the slug will be automatically generated.
        //             More about slugs <a href="http://en.wikipedia.org/wiki/Slug" target="_blank">here</a>.</span>,
        //         },
        //     ],
        // },
        // edit: {
        //     title: 'Section',
        //     actions: {
        //         get: (req) => section(crudl.context('section')).read(req),
        //         save: (req) => section(crudl.context('section')).update(req).then(data => data._id),
        //     },
        //     fields: [
        //         {
        //             name: 'name',
        //             label: 'Name',
        //             field: 'String',
        //             required: true
        //         },
        //         {
        //             name: 'slug',
        //             label: 'Slug',
        //             field: 'String',
        //             onChange: {
        //                 in: 'name',
        //                 setInitialValue: (name) => slugify(name.value),
        //             },
        //             helpText: <span>If left blank, the slug will be automatically generated.
        //             More about slugs <a href="http://en.wikipedia.org/wiki/Slug" target="_blank">here</a>.</span>,
        //         },
        //     ],
        // },
    },
    {
        name: 'name',
        label: 'Name',
        field: 'String',
        required: true,
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
    path: 'categories/new',
    title: 'New Category',
    fields: changeView.fields,
    actions: {
        add: function (req) { return categories.create(req) },
    },
}


module.exports = {
    listView,
    changeView,
    addView,
}
