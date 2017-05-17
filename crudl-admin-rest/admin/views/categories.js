import { slugify, select } from '../utils'
import React from 'react'

import { list, detail, options } from '../connectors'

const categories = list('categories');
const category = detail('categories');
const entries = list('entries');

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
    }
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
