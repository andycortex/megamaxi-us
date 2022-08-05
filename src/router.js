function urlRouter(url, pages) {
    switch (true) {
        case !url.includes("/product/"):
            return { url: url, userData: { label: "MAIN_CATEGORY", pages } };
            break;
        case url.includes("/product/"):
            return { url: url, userData: { label: "DETAIL", pages } };
            break;
        default:
            break;
    }
}

exports.urlRouter = urlRouter;
