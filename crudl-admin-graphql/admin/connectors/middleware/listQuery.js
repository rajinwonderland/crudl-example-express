
function buildArgs(object) {
    let args = Object.getOwnPropertyNames(object).map(name => {
        return `${name}: ${JSON.stringify(object[name])}`
    }).join(', ')
    return args ? `(${args})` : ''
}

function buildOrderBy(req) {
    if (req.sorting && req.sorting.length > 0) {
        return {
            orderBy: req.sorting.map(field => {
                let prefix = field.sorted == 'ascending' ? '' : '-'
                return prefix + field.sortKey
            }).join(',')
        }
    }
    return {}
}


function buildQueryString(req, options) {
    if (Object.prototype.toString.call(options.fields) === '[object Array]') {
        options.fields = options.fields.join(', ')
    }

    let args = buildArgs(Object.assign({},
        options.args,
        req.page,
        req.filters,
        buildOrderBy(req),
        req.args
    ))
    return `{
        ${options.name} ${args} {
            totalCount, filteredCount,
            pageInfo { hasNextPage, hasPreviousPage, startCursor, endCursor }
            edges { node { ${options.fields} }}
        }
    }`
}

export default function createListQuery(namePl, fields, args) {
    const NamePl = namePl.charAt(0).toUpperCase() + namePl.slice(1);
    const options = { name: `all${NamePl}`, fields, args }

    return function listQuery(next) {
        return {
            read: function (req) {
                if (req.resolved) {
                    return next.read(req)
                }

                // Build the query
                req.data = { query: buildQueryString(req, options) }

                return next.read(req).then((res) => {
                    const { totalCount, filteredCount, pageInfo, edges } = res.data.data[options.name]
                    // Split pagination from data
                    res.pagination = { totalCount, filteredCount, pageInfo }
                    res.data = edges.map(item => item.node)
                    return res
                })
            }
        }
    }
}
