function urlRouter(url, pages) {
    switch (true) {
        case url.includes("product-category/"):
            return { url: url, userData: { label: "MAIN_CATEGORY", pages } };
            break;
        case url.includes("/shop/"):
            return { url: url, userData: { label: "DETAIL", pages } };
            break;
        default:
            break;
    }
}

exports.urlRouter = urlRouter;
