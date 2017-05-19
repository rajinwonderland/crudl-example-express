function getInfo(data) {
    let hasNext = data.pageInfo.hasNextPage
    let next = hasNext && {
        after: data.pageInfo.endCursor
    }
    return {
        type: 'continuous',
        next,
        resultsTotal: data.totalCount,
        filteredTotal: data.filteredCount
    }
}

export default function continuousPagination(next) {
    return {
        read: req => next.read(req).then((res) => {
            if (res.data.pageInfo) {
                const paginationDescriptor = getInfo(res.data);
                res.data = res.data.edges.map(edge => edge.node);
                res.data.pagination = paginationDescriptor;
            }
            return res;
        }),
    };
}
