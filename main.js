/**
 * This template is a production ready boilerplate for developing with `CheerioCrawler`.
 * Use this to bootstrap your projects using the most up-to-date code.
 * If you're looking for examples or want to learn more, see README.
 */

const Apify = require("apify");
const {
    handleMainCategory,
    handleDetail,
} = require("./src/routes");

const Router = require("./src/router");

const {
    utils: { log },
} = Apify;

Apify.main(async () => {
    const { categoriesUrls, productsUrls, pages, keyword } =
        await Apify.getInput();
    const requestQueue = await Apify.openRequestQueue();
    const proxyConfiguration = await Apify.createProxyConfiguration({
        countryCode: "US",
    });

    if (categoriesUrls && pages) {
        for (let url of categoriesUrls) {
            url = url.url;
            let req = Router.urlRouter(url, pages);
            await requestQueue.addRequest(req);
        }
    }

    // if (keyword && pages) {
    //     let url = `https://ww1.cuevana3.me/?s=${keyword}`;
    //     let req = Router.urlRouter(url, pages);
    //     await requestQueue.addRequest(req);
    // }

    if (productsUrls) {
        for (let url of productsUrls) {
            url = url.url;
            let req = Router.urlRouter(url);
            await requestQueue.addRequest(req);
        }
    }

    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        proxyConfiguration,
        maxConcurrency: 15,
        maxRequestRetries: 20,
        preNavigationHooks: [
            /*
            async () => {
                await Apify.utils.sleep(300);
            },
        */
        ],
        handlePageFunction: async (context) => {
            const {
                url,
                userData: { label },
            } = context.request;
            log.info("Page opened.", { label, url });
            switch (label) {
                case "MAIN_CATEGORY":
                    return handleMainCategory(context);
                case "DETAIL":
                    return handleDetail(context);
            }
        },
    });

    log.info("Starting the crawl.");
    await crawler.run();
    log.info("Crawl finished.");
});
