import { createFrontendConnector, createBackendConnector } from '@crudlio/crudl-connectors-base'
import { crudToHttp, url, transformData } from '@crudlio/crudl-connectors-base/lib/middleware'

import crudlErrors from './middleware/crudlErrors'
import numberedPagination from './middleware/numberedPagination'
import buildQuery from './middleware/buildQuery'

const baseURL = '/rest-api/'

function createExpressConnector(urlPath) {
  return createFrontendConnector(createBackendConnector({ baseURL, }))
    .use(buildQuery())
    .use(crudToHttp())
    .use(url(urlPath))
    .use(crudlErrors);
}

export const list = createExpressConnector(':collection/')
    .use(numberedPagination)

export const detail = createExpressConnector(':collection/:id/')

// Resolves to { options: [{value, label}, {value, label}, ... ] }
export const options = (collection, valueKey, labelKey) => list(collection)
    .use(next => ({
        read: req => next.read(req.filter('limit', 1000000)).then(res => Object.assign(res, {
            data: {
                options: res.data.map(item => ({
                    value: item[valueKey],
                    label: item[labelKey],
                }))
            },
        })),
    }))

export const login = createExpressConnector('login/')
    .use(transformData('create',
        data => ({
            requestHeaders: { "Authorization": `Token ${data.token}` },
            info: data,
        })
    ))
