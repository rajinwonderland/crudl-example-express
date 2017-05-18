import { resolveQuery } from '../utils'
import uuid from 'uuid'

export default function createMutation(methodName, mutationString) {
    return function mutation(next) {
        return {
            [methodName]: req => next[methodName](Object.assign(req, {
                data: {
                    query: resolveQuery(req, mutationString),
                    variables: {
                        input: Object.assign({ clientMutationId: uuid.v4() }, req.data),
                    },
                }
            }))
        }
    }
}
