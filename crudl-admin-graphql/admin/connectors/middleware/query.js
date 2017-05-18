
export default function createQuery(methodName, queryString) {
    return function query(next) {
        return {
            read: req => next.read(Object.assign(req,
                {
                    data: {
                        query: queryString,
                    }
                }
            ))
        }
    }
}
