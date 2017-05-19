import uuid from 'uuid'
import pluralize from 'pluralize'

import { createFrontendConnector, createBackendConnector } from 'crudl-connectors-base'
import { crudToHttp, url, transformData } from 'crudl-connectors-base/lib/middleware'

import crudlErrors from './middleware/crudlErrors'
import continuousPagination from './middleware/continuousPagination'
import listQuery from './middleware/listQuery'
import query from './middleware/query'

const baseURL = '/graphql-api/'

// Base connector
export function createGraphQLConnector() {
    return createFrontendConnector(createBackendConnector(), true)
        .use(crudToHttp({ create: 'post', read: 'post', update: 'post', delete: 'post' }))
        .use(url(baseURL))
        .use(crudlErrors)
}

// A resource connector. Use it like this:
// const users = createResourceConnector('users', '_id, username, email')
//
// users.read()                 // list
// users.create({})             // create
// users(id).read()             // detail
// users(id).delete()           // delete
// users(id).update({...})      // update
export function createResourceConnector(namePl, fields) {
    const nameSg = pluralize.singular(namePl)
    const NameSg = nameSg.charAt(0).toUpperCase() + nameSg.slice(1)

    return createGraphQLConnector()
        .use(listQuery(namePl, fields))
        .use(query('create', `
            mutation ($input: ${NameSg}Input!) {
                add${NameSg} (data: $input) {
                    errors
                    ${nameSg} { ${fields} }
                }
            }
        `, `add${NameSg}.${nameSg}`))
        .use(query('read', `
            { ${nameSg} (id: "%_id") {${fields}} }
        `, nameSg))
        .use(query('update', `
            mutation ($input: ${NameSg}Input!) {
                change${NameSg} (id: "%_id", data: $input) {
                    errors
                    ${nameSg} {${fields}}
                }
            }
        `, `change${NameSg}.${nameSg}`))
        .use(query('delete'), `mutation { delete${NameSg} (id: "%_id") { deleted } }`, 'deleted')
        // Pagination must be the last one
        .use(continuousPagination)
}

export const login = createFrontendConnector(createBackendConnector())
    .use(url('/rest-api/login/'))
    .use(crudToHttp())
    .use(crudlErrors)
    .use(transformData('create',
        data => ({
            requestHeaders: { "Authorization": `Token ${data.token}` },
            info: data,
        })
    ))
