
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
        buildOrderBy(req)
    ))
    return `{
        ${options.name} ${args} {
            totalCount, filteredCount,
            pageInfo { hasNextPage, hasPreviousPage, startCursor, endCursor }
            edges { node { ${options.fields} }}
        }
    }`
}

const defaultArgs = { first: 20 };

export default function createListQuery(options) {
    const opts = Object.assign({}, options)
    opts.args = Object.assign({}, defaultArgs, opts.args)

    return function listQuery(next) {
        return {
            read: function (req) {
                // Set the query
                req.data = { query: buildQueryString(req, opts) }

                // Procede in the connector chain
                return next.read(req)
                .then((res) => {
                    res.data = res.data.data[options.name]
                    return res
                })
            }
        }
    }
}
