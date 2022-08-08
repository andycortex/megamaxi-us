const Apify = require("apify");
const Router = require("./router.js");
const Cheerio = require("cheerio");

const {
    utils: { log },
} = Apify;

const BASE_URL = "https://www.megamaxi.com/ ";

class ItemModel {
    constructor() {
        this.ItemCode = "";
        this.ItemUrl = "";
        this.ItemTitle = "";
        this.ItemQty = "20";
        this.ItemStatus = ""; // On Sale | Sold Out
        this.BrandName = "";
        this.ItemPrice = "";
        this.ItemRetailPrice = "";
        this.ShippingInfo = "";
        this.StandardImage = "";
        this.OtherImages = [];
        this.ItemDescription = "";
        this.ItemOption = {};
        this.ItemOptionData = [];
        this.ItemWeight = "";
        this.ItemSize = "";
        this.ItemExpiredate = "";
        this.ISBNCode = "";
        this.UPCCode = "";
        this.ItemMFGdate = "";
        this.ItemModelNo = "";
        this.ItemMaterial = "";
        this.Memo = "";
        this.Category = "";
    }
}

exports.handleStart = async ({ request, $ }) => {};

exports.handleMainCategory = async ({ request, $ }) => {
    const requestQueue = await Apify.openRequestQueue();

    async function getItems($) {
        let items = $("div.product_item--info-inner h2 a").toArray();
        return items.map((item) => $(item).attr("href"));
    }

    async function getPagination($) {
        let pagination = $(
            "nav[class*='la-pagination'] ul li:nth-last-child(2) a"
        ).text();
        const pageURLS = await generatePages(2, Number(pagination));
        return pageURLS;
    }

    async function generatePages(min, max) {
        let paginationUrls = [];
        for (let page = min; page <= max; page++) {
            let pagUrl = `${request.url}page/${page}/`;
            paginationUrls.push(pagUrl);
        }
        return paginationUrls;
    }

    /**************************************************************************/

    let pages = request.userData.pages;
    let isPaginaton = request.url.includes("/page/");

    if (pages === undefined && isPaginaton) {
        let itemsUrls = await getItems($);

        for (const url of itemsUrls) {
            let req = Router.urlRouter(url);
            await requestQueue.addRequest(req);
        }
    } else if (pages === "0" || pages === "auto") {
        let itemsUrls = await getItems($);
        let pagesUrls = await getPagination($);

        for (const url of pagesUrls) {
            let req = Router.urlRouter(url);
            await requestQueue.addRequest(req);
        }

        for (const url of itemsUrls) {
            let req = Router.urlRouter(url);
            await requestQueue.addRequest(req);
        }
    } else if (pages.includes("-")) {
        pages = pages.split("-");
        let minPage = Number(pages[0]);
        let maxPage = Number(pages[1]);
        let pagesUrls = await generatePages(minPage, maxPage);

        for (const url of pagesUrls) {
            let req = Router.urlRouter(url);
            await requestQueue.addRequest(req);
        }

        if (minPage == 1) {
            let itemsUrls = await getItems($);
            for (const url of itemsUrls) {
                let req = Router.urlRouter(url);
                await requestQueue.addRequest(req);
            }
        }
    } else if (
        !pages.includes("-") &&
        !pages.includes("auto" && pages != "0")
    ) {
        pages = Number(pages);
        if (pages == 1) {
            let itemsUrls = await getItems($);
            for (const url of itemsUrls) {
                let req = Router.urlRouter(url);
                await requestQueue.addRequest(req);
            }
        } else {
            let pagesUrls = await generatePages(pages, pages);
            for (const url of pagesUrls) {
                let req = Router.urlRouter(url);
                await requestQueue.addRequest(req);
            }
        }
    }
};

exports.handleSubCategory = async ({ request, $ }) => {};

exports.handleDetail = async ({ request, $ }) => {
    // async function getItemOptionData($) {
    //     let itemImages = [];
    //     let itemSizes = [];
    //     let itemOptionData = [];
    //     let itemOptions = {};

    //     let newItem = {};

    //     let variations = $(".GL-z label img").toArray();
    //     itemImages = variations.map((item) =>
    //         $(item).attr("src").replace("144", "640")
    //     );

    //     let sizes = $(".ER-z label").toArray();
    //     itemSizes = sizes.map((size) => $(size).text());

    //     newItem.images = itemImages;
    //     // newItem.sizes = itemSizes;

    //     itemOptionData.push(newItem);

    //     let itemColor = $("div.vu-z label span").toArray();
    //     options = itemColor.map((item) => $(item).text());
    //     itemOptions.Color = options.join(",");

    //     return {
    //         itemOptions,
    //         itemOptionData,
    //         itemImages,
    //     };
    // }

    async function getBrandTitle($) {
        let brand = $("div.tab-content table tbody tr td p").text().trim();
        let title = `${brand} ${$("h1").text().trim()}`;
        return {
            brand,
            title,
        };
    }

    async function getPrices($) {
        let salePrice = $(
            "p.price del span[class*='woocommerce-Price-amount'] bdi"
        )
            .text()
            .replace("$", "")
            .trim();

        let retailPrice = $("ins span[class*='woocommerce-Price-amount'] bdi")
            .text()
            .replace("$", "")
            .trim();
            
        return { salePrice, retailPrice };
    }

    async function getImages($) {
        let standardImage = $(
            "figure.woocommerce-product-gallery__wrapper div a img"
        ).attr("src");
        let otherImages = standardImage;

        return { standardImage, otherImages };
    }

    async function getDescription($) {
        let description = $("#tab-description div.tab-content")
            .html()
            .replaceAll("\t", "")
            .replaceAll("\n", "");
        return { description };
    }

    async function getCategory($) {
        let categories = $("span.posted_in a").toArray();
        categories = categories.map((item) => $(item).text().trim());
        categories = categories.join(" > ");
        return { categories };
    }

    async function getItemCode($) {
        let code = $(
            "div[class='summary entry-summary'] span.custom-conditions:nth-last-child(3)"
        )
            .text()
            .replace("SKU:", "")
            .trim();
        return { code };
    }
    async function getAvailability($) {
        let prodAvailable = $(
            "div[class='summary entry-summary'] span.custom-conditions:nth-last-child(5)"
        )
            .text()
            .replace("Stock en bodega:", "")
            .trim();
        if (Number(prodAvailable) > 1) {
            return "On Sale";
        } else {
            return "Sold out";
        }
    }
    /********************************************************************************/
    // let itemOptionData = await getItemOptionData($);
    let brandAndTitle = await getBrandTitle($);
    let prices = await getPrices($);
    let images = await getImages($);
    let dsc = await getDescription($);
    let categ = await getCategory($);
    let itemCode = await getItemCode($);
    let availability = await getAvailability($);

    /********************************************************************************/
    let item = new ItemModel();
    item.ItemUrl = request.url;
    item.BrandName = brandAndTitle.brand;
    item.ItemTitle = brandAndTitle.title;
    item.ItemRetailPrice = prices.retailPrice;
    item.ItemPrice = prices.salePrice;
    // item.ItemStatus = itemOptionData.itemStatus;
    item.StandardImage = images.standardImage;
    item.OtherImages = images.otherImages;
    item.ItemDescription = dsc.description;
    item.Category = categ.categories;
    // item.ItemOption = itemOptionData.itemOptions;
    // item.ItemOptionData = itemOptionData.itemOptionData;
    item.ItemCode = itemCode.code;
    item.ItemStatus = availability;
    // item.ItemModelNo = item.ItemCode
    Apify.pushData(item);
};
