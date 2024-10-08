"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = require("cheerio");
const models_1 = require("../../models");
class MangaReader extends models_1.MangaParser {
    constructor() {
        super(...arguments);
        this.name = 'MangaReader';
        this.baseUrl = 'https://mangareader.to';
        this.logo = 'https://pbs.twimg.com/profile_images/1437311892905545728/TO0hFfUr_400x400.jpg';
        this.classPath = 'MANGA.MangaReader';
        /**
         *
         * @param query Search query
         */
        this.search = async (query) => {
            try {
                const { data } = await this.client.get(`${this.baseUrl}/search?keyword=${query}`);
                const $ = (0, cheerio_1.load)(data);
                const results = $('div.manga_list-sbs div.mls-wrap div.item')
                    .map((i, el) => {
                    var _a;
                    return ({
                        id: (_a = $(el).find('a.manga-poster').attr('href')) === null || _a === void 0 ? void 0 : _a.split('/')[1],
                        title: $(el).find('div.manga-detail h3.manga-name a').text().trim(),
                        image: $(el).find('a.manga-poster img').attr('src'),
                        genres: $(el)
                            .find(`div.manga-detail div.fd-infor span > a`)
                            .map((i, genre) => $(genre).text())
                            .get(),
                    });
                })
                    .get();
                return {
                    results: results,
                };
            }
            catch (err) {
                //   console.log(err);
                throw new Error(err.message);
            }
        };
        this.fetchMangaInfo = async (mangaId) => {
            const mangaInfo = {
                id: mangaId,
                title: '',
            };
            try {
                const { data } = await this.client.get(`${this.baseUrl}/${mangaId}`);
                const $ = (0, cheerio_1.load)(data);
                const container = $('div.container');
                mangaInfo.title = container.find('div.anisc-detail h2.manga-name').text().trim();
                mangaInfo.image = container.find('img.manga-poster-img').attr('src');
                mangaInfo.description = $('div.modal-body div.description-modal').text().split('\n').join(' ').trim();
                mangaInfo.genres = container
                    .find('div.sort-desc div.genres a')
                    .map((i, genre) => $(genre).text().trim())
                    .get();
                const chapters = container
                    .find(`div.chapters-list-ul ul li`)
                    // .find(`#en-chapters li`)
                    .map((i, el) => {
                    var _a, _b;
                    const id = $(el).parent().attr('id');
                    return {
                        language: (_a = id === null || id === void 0 ? void 0 : id.split('-')[0]) !== null && _a !== void 0 ? _a : 'en',
                        id: (_b = $(el).find('a').attr('href')) === null || _b === void 0 ? void 0 : _b.split('/read/')[1],
                        title: $(el).find('a').attr('title').trim(),
                        chapter: $(el).find('a span.name').text().split('Chapter ')[1].split(':')[0],
                    };
                })
                    .get();
                for (const chapter of chapters) {
                    let key = chapter.language;
                    key =
                        {
                            en: 'English Chapters',
                            es: 'Spanish Chapters',
                            ja: 'Japanese Chapters',
                        }[key] || key;
                    if (!mangaInfo.chapters) {
                        mangaInfo.chapters = { [key]: [] };
                    }
                    if (!mangaInfo.chapters[key]) {
                        mangaInfo.chapters[key] = [];
                    }
                    mangaInfo.chapters[key].push(chapter);
                }
                // reverse chapters
                if (!!mangaInfo.chapters)
                    mangaInfo.chapters = Object.fromEntries(Object.entries(mangaInfo.chapters).map(([key, value]) => [key, value.reverse()]));
                return mangaInfo;
            }
            catch (err) {
                throw new Error(err.message);
            }
        };
        this.fetchChapterPages = async (chapterId) => {
            try {
                const { data } = await this.client.get(`${this.baseUrl}/read/${chapterId}`);
                const $ = (0, cheerio_1.load)(data);
                const readingId = $('div#wrapper').attr('data-reading-id');
                if (!readingId) {
                    throw new Error('Unable to find pages');
                }
                const ajaxURL = `https://mangareader.to/ajax/image/list/chap/${readingId}?mode=vertical&quality=high&hozPageSize=1`;
                const { data: pagesData } = await this.client.get(ajaxURL);
                const $PagesHTML = (0, cheerio_1.load)(pagesData.html);
                const pagesSelector = $PagesHTML('div#main-wrapper div.container-reader-chapter div.iv-card');
                const pages = pagesSelector
                    .map((i, el) => {
                    const element = $(el);
                    const isShuffled = element.hasClass('shuffled');
                    const img = element.attr('data-url').replace('&amp;', '&');
                    return {
                        img: isShuffled ? 'https://chibi.aryak.dev/unshuffle/' + encodeURIComponent(img) : img,
                        page: i + 1,
                    };
                })
                    .get();
                return pages;
            }
            catch (err) {
                throw new Error(err.message);
            }
        };
    }
}
// (async () => {
//   const manga = new MangaReader();
//   const search = await manga.search('one piece');
//   const info = await manga.fetchMangaInfo(search.results[0].id);
//   const pages = await manga.fetchChapterPages(info.chapters![0].id);
//   console.log(pages);
// })();
exports.default = MangaReader;
//# sourceMappingURL=mangareader.js.map