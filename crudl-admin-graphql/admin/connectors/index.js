import { createFrontendConnector, createBackendConnector } from 'crudl-connectors-base'
import { crudToHttp, url, transformData } from 'crudl-connectors-base/lib/middleware'

import crudlErrors from './middleware/crudlErrors'
import continuousPagination from './middleware/continuousPagination'
import mutation from './middleware/mutation'
import query from './middleware/query'
import listQuery from './middleware/listQuery'

const baseURL = '/graphql-api/'

function createGraphQLConnector() {
    return createFrontendConnector(createBackendConnector())
        .use(url(baseURL))
        .use(crudToHttp({ create: 'post', read: 'post', update: 'post', delete: 'post' }))
        .use(crudlErrors);
}

export const users = createGraphQLConnector()
    .use(listQuery({
        name: 'allUsers',
        fields: '_id, username, first_name, last_name, email, is_active, is_staff, date_joined',
    }))
    .use(continuousPagination)

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
