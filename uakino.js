// For uakino.club
// blackenedd18@gmail.com
// v.1.3

(function () {
    'use strict';

    function uakino(component, _object) {
        var network = new Lampa.Reguest();
        var extract = {};
        var embed = component.proxy('uakino') + ''; //https://uakino.club/
        var url_server = 'http://new.agart.ua/get.php';
        var object = _object;
        var select_title = '';
        var select_id = '';
        var filter_items = {};
        var choice = {
            season: 0,
            voice: -1,
            quality: -1
        };

        /**
         * Пошук
         * @param {Object} _object
         * @param {String}
         */
        this.search = function (_object, filmId, sim) {
            var _this = this;
            if (this.wait_similars && sim) return getPage(sim[0].link);
            object = _object;
            select_title = object.search;
            var url = url_server + "?search_json=" + encodeURIComponent(cleanTitle(select_title));
            network["native"](url, function (json) {
                if (json) {
                    _this.wait_similars = true;
                    var similars = [];
                    for(let item of json) {
                        similars.push({
                            title: item.title,
                            link: item.href,
                            year: item.imdb + ', ' + item.year + ', ' + item.type + ' | ' + item.season,
                            filmId: 'similars'
                        });
                    }
                    component.similars(similars);
                    component.loading(false);
                } else {
                    component.emptyForQuery(select_title);
                }
            }, function (a, c) {
                component.empty(network.errorDecode(a, c));
            }, false);
        };

        this.search_old = function (_object, kp_id, sim) {
            var _this = this;

            if (this.wait_similars && sim) return getPage(sim[0].link);
            object = _object;
            select_title = object.movie.title;
            select_title = object.search;
            var url = url_server + "?search=" + encodeURIComponent(cleanTitle(select_title));

            network["native"](url, function (text) {

                var str = text.replace(/\n/, '');
                str = str.replace(/\r\n/, '');
                str = str.replace('parse', '');
                str = str.replace('\t', '');
                str = str.replace('\t\t', '');
                str = str.replace('\t\t\t', '');
                str = str.replace('\t\t\t\t', '');

                var links = str.match(/<a class="movie-title"[^>]+>(.*?)<\/a>/g);
                var links2 = str.match( /<div id=['|"]dle-content(.*?)<!-- підключаємо бокову колонку/ );

                var relise = object.search_date || (object.movie.number_of_seasons ? object.movie.first_air_date : object.movie.release_date) || '0000';
                var need_year = parseInt((relise + '').slice(0, 4));
                var found_url = '';

                if (links) {
                    var cards = [];

                    links.filter(function (l) {
                        var link = $(l),
                            titl = link.attr('title') || link.text() || '';
                        var year = parseInt(titl.split('(').pop().slice(0, -1));

                        year = $(link).parent().find('.deck-value').text();
                        year = parseInt(year);

                        if (year > need_year - 2 && year < need_year + 2) cards.push({
                            year: year,
                            title: titl.split(/\(\d{4}\)/)[0].trim(),
                            link: link.attr('href')
                        });
                    });
                    var card = cards.find(function (c) {
                        return c.year == need_year;
                    });
                    if (!card) card = cards.find(function (c) {
                        return c.title == select_title;
                    });
                    if (!card && cards.length == 1) card = cards[0];
                    if (card) found_url = cards[0].link;
                    if (found_url) getPage(found_url);else if (links.length) {
                        _this.wait_similars = true;
                        var similars = [];

                        var no_find_all = true;

                        if (links2) {
                            var root = $(links2[0]);
                            var items = $(root).find('.movie-item.short-item');
                            if (items) {
                                $(items).each(function () {

                                    no_find_all = false;

                                    var href = $(this).find('a.movie-title').attr('href');
                                    var title = $(this).find('a.movie-title').text();
                                    var full = $(this).find('.full-season').text();
                                    var info = $(this).find('div.deck-value:eq(0), div.deck-value:eq(1), div.deck-value:eq(2)').text()

                                    similars.push({
                                        title: title,
                                        link: href,
                                        year: info + ' | ' + full,
                                        filmId: 'similars'
                                    });
                                });
                            }
                        }

                        if(no_find_all) {
                            links.forEach(function (l) {
                                var link = $(l),
                                    titl = link.attr('title') || link.text();

                                var year = $(l).parent().find('.deck-value').text();

                                year = parseInt(year);

                                similars.push({
                                    title: titl,
                                    link: link.attr('href'),
                                    year: year,
                                    filmId: 'similars'
                                });
                            });
                        }


                        component.similars(similars);
                        component.loading(false);
                    } else component.emptyForQuery(select_title);
                } else component.emptyForQuery(select_title);
            }, function (a, c) {
                component.empty(network.errorDecode(a, c));
            }, false, {
                dataType: 'text'
            });
        };

        this.extendChoice = function (saved) {
            Lampa.Arrays.extend(choice, saved, true);
        };
        /**
         * Сброс фильтра
         */


        this.reset = function () {
            component.reset();
            choice = {
                season: 0,
                voice: -1
            };
            append(filtred());
            component.saveChoice(choice);
        };
        /**
         * Применить фильтр
         * @param {*} type
         * @param {*} a
         * @param {*} b
         */


        this.filter = function (type, a, b) {
            choice[a.stype] = b.index;
            component.reset();
            filter();
            append(filtred());
            component.saveChoice(choice);
        };
        /**
         * Уничтожить
         */


        this.destroy = function () {
            network.clear();
            extract = null;
        };

        function cleanTitle(str) {
            return str.replace('.', '').replace(':', '');
        }

        function filter() {
            filter_items = {
                season: [],
                voice: [],
                quality: []
            };

            if (object.movie.number_of_seasons) {
                if (extract[0].playlist) {
                    extract.forEach(function (item) {
                        filter_items.season.push(item.comment);
                    });
                }
            }

            component.filter(filter_items, choice);
        }

        function filtred() {
            var filtred = [];

            if (object.movie.number_of_seasons) {
                var playlist = extract[choice.season].playlist || extract;
                var season = parseInt(extract[choice.season].comment);
                playlist.forEach(function (serial) {

                    filtred.push({
                        file: serial.file,
                        stream: serial.file,
                        title: serial.voice + ' ' + serial.title,
                        quality: '',
                        season: isNaN(season) ? 1 : season,
                        info: serial.voice,
                        subtitles: parseSubs(serial.subtitle || '')
                    });
                });
            } else {
                extract.forEach(function (elem) {

                    if (!elem.title) elem.title = elem.voice + ' ' + elem.title;
                    if (!elem.quality) elem.quality = '';
                    if (!elem.info) elem.info = '';
                });
                filtred = extract;
            }

            return filtred;
        }

        function parseSubs(vod) {
            var subtitles = [];
            vod.split(',').forEach(function (s) {
                var nam = s.match("\\[(.*?)]");

                if (nam) {
                    var url = s.replace(/\[.*?\]/, '').split(' or ')[0];

                    if (url) {
                        subtitles.push({
                            label: nam[1],
                            url: url
                        });
                    }
                }
            });
            return subtitles.length ? subtitles : false;
        }
        /**
         * Получить данные о фильме
         * @param {String} str
         */


        function getPage(url) {
            network.clear();
            network.timeout(1000 * 10);
            network["native"](  url_server + '?film=' + url, function (str) {
                str = str.replace(/\n/g, '');
                str = str.replace(/\r\n/, '');

                var MOVIE_ID = str.match('save_last_viewed\\((.*?)\\);');

                if (MOVIE_ID) {
                    select_id = MOVIE_ID[1];
                    select_id = select_id.replace("'", '');
                    select_id = select_id.replace("'", '');

                    network.clear();
                    network.timeout(1000 * 10);


                    var find_video = str.match(/<link itemprop="video" value="(.*?)">/);
                    var find_video_title = str.match(/property="og:title" content="(.*?)"/);

                    var find_h1_title = str.match(/<span\s+class="solototle"\s+itemprop="name">(.*?)<\/span>/);

                    console.log(find_h1_title);
                    console.log('h1');


                    network["native"](url_server + '?news_id=' + select_id, function (user_data) {

                        var find_series = user_data.match(/playlists-lists/g);

                        console.log(  'news_id' );
                        console.log( select_id );


                        component.loading(false);
                        var found = [];

                        if (find_series) {

                            console.log( 'find_series' );
                            console.log( find_series );

                            var series_links = user_data.match(/<li data-file[^>]+>(.*?)<\/li>/g);

                            series_links.forEach(function (l) {
                                var link = $(l);
                                var file = link.attr('data-file') || '';
                                var voice = link.attr('data-voice') || '';
                                var text = link.text() || '';

                                voice = voice.replace(']', ' ');
                                voice = voice.replace('[', ' ');

                                found.push({
                                    file: file,
                                    stream: '',
                                    title: '',
                                    quality: '',
                                    voice: voice + ' ' + text,
                                    subtitles: false,
                                    subtitle: false,
                                    info: ' '
                                });
                            });

                            // found.reverse();

                            if (found) {

                                console.log( 'found' )
                                console.log( found )

                                extract = found;

                                filter();
                                append(filtred());

                            } else component.empty(Lampa.Lang.translate('torrent_parser_no_hash'));

                        } else {

                            console.log( 'find_video' );
                            console.log( find_video );

                            if (find_video) {

                                network["native"](find_video[1], function (text) {

                                    text = text.replace(/\n/, '');
                                    text = text.replace(/\r\n/, '');
                                    text = text.replace(/\t/, '');

                                    var find_m3u8 = text.match(/m3u8/);
                                    var playerJs = text.match( /(Playerjs\((\[[^\}]+)?\{s*[^\}\{]{3,}?:.*\}([^\{]+\])?)/ );

                                    var find_m3u8_bool = false;

                                    if (find_m3u8 && playerJs) {

                                        console.log( 'find_m3u8' )

                                        var playerJsString = playerJs[0];
                                        playerJsString = playerJsString.replace('Playerjs(', '');
                                        playerJsString = playerJsString.replace("'[", '');
                                        playerJsString = playerJsString.replace("id:", '"id":');
                                        playerJsString = playerJsString.replace("file:", '"file":');
                                        playerJsString = playerJsString + '}';

                                        try {

                                            var jsonP = JSON.parse(playerJsString);

                                            if (jsonP.file.folder) {
                                                for (var _s of jsonP.file.folder) {
                                                    for (var _e of _s.folder) {

                                                        find_m3u8_bool = true;

                                                        found.push({
                                                            file: _e.file,
                                                            stream: _e.file,
                                                            title: '',
                                                            quality: '',
                                                            voice: _s.title + ' ' + _e.title,
                                                            subtitles: false,
                                                            subtitle: false,
                                                            info: ' '
                                                        });
                                                    }
                                                }
                                            }

                                            console.log( 'jsonP' )
                                        } catch (e) {

                                            component.empty(Lampa.Lang.translate('torrent_parser_no_hash'));
                                        }
                                    }


                                    if ( ! find_m3u8_bool) {

                                        console.log( 'find one file' )

                                        found.push({
                                            file: find_video[1],
                                            stream: '',
                                            title: find_video_title ? find_video_title[1] : ' | Show UA',
                                            quality: '',
                                            voice: 'Show UA',
                                            subtitles: false,
                                            subtitle: false,
                                            info: ' '
                                        });
                                    }



                                    if (found) {

                                        console.log( 'found' )
                                        console.log( found )

                                        extract = found;

                                        filter();
                                        append(filtred());

                                    } else  component.empty(Lampa.Lang.translate('torrent_parser_no_hash'));

                                }, function (a, c) {
                                    component.empty(network.errorDecode(a, c));
                                }, false, {
                                    dataType: 'text'
                                });

                            } else {
                                component.emptyForQuery(select_title);
                            }

                        }


                        if (found) {
                        } else component.empty(Lampa.Lang.translate('torrent_parser_no_hash'));

                    }, function (a, c) {
                        component.empty(network.errorDecode(a, c));
                    }, false, {
                        dataType: 'text'
                    });
                } else component.emptyForQuery(select_title);
            }, function (a, c) {
                component.empty(network.errorDecode(a, c));
            }, false, {
                dataType: 'text'
            });
        }

        function getFile(element) {
            var quality = {},
                first = '';
            var preferably = Lampa.Storage.get('video_quality_default', '1080');

            element.qualitys = '';

            var find_m3u8 = element.file.match(/m3u8/);
            if (find_m3u8) {
                element.stream = element.file;

                return {
                    file: element.stream,
                    quality: quality
                };
            }

            // network.clear();
            // network.timeout(1000 * 10);
            network["native"](element.file, function (text) {
                var source = text.match('file:"(.*?)"');
                if (source) {
                    element.stream = source[1];
                }

                element.qualitys = '';
                return {
                    file: element.stream,
                    quality: quality
                };

            }, function (a, c) {
                component.empty(network.errorDecode(a, c));
            }, false, {
                dataType: 'text'
            });



        }
        /**
         * Показать файлы
         */


        function append(items) {
            component.reset();
            var viewed = Lampa.Storage.cache('online_view', 5000, []);
            items.forEach(function (element, index) {
                if (element.season) element.title = 'S' + element.season + ' / ' + element.title;
                if (element.voice) element.title = element.voice;
                if (typeof element.episode == 'undefined') element.episode = index + 1;
                var hash = Lampa.Utils.hash(element.season ? [element.season, element.episode, element.title].join('') : element.title + element.file);
                var view = Lampa.Timeline.view(hash);
                var item = Lampa.Template.get('online', element);
                var hash_file = Lampa.Utils.hash(element.season ? [element.season, element.episode, element.title, 'uakino'].join('') : element.title + element.file + 'uakino');
                element.timeline = view;
                item.append(Lampa.Timeline.render(view));

                if (Lampa.Timeline.details) {
                    item.find('.online__quality').append(Lampa.Timeline.details(view, ' / '));
                }

                if (viewed.indexOf(hash_file) !== -1) item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                item.on('hover:enter', function () {
                    if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);


                    console.log( 'element' )
                    console.log( element )

                    // network.clear();
                    // network.timeout(1000 * 10);
                    network["native"](element.file, function (text) {
                        var source = text.match('file:"(.*?)"');
                        if (source) {
                            element.stream = source[1];
                        }

                        var find_m3u8 = element.file.match(/m3u8/);

                        console.log(  'find_m3u8'  )
                        console.log(  find_m3u8  )

                        if (find_m3u8) {
                            element.stream = element.file;
                        }

                        if (element.stream) {
                            var playlist = [];
                            var first = {
                                url: element.stream,
                                timeline: view,
                                title: element.season ? element.title : element.voice ? object.movie.title + ' / ' + element.title : element.title,
                                subtitles: element.subtitles,
                                quality: element.qualitys
                            };

                            if (element.season) {

                                items.forEach(function (elem) {
                                    getFile(elem);

                                    if (find_m3u8) {
                                        playlist.push({
                                            title: elem.title,
                                            url: elem.stream,
                                            timeline: elem.timeline,
                                            subtitles: elem.subtitles,
                                            quality: elem.qualitys
                                        });
                                    }
                                });
                            } else {
                                if (find_m3u8) {
                                    playlist.push(first);
                                }
                            }

                            if(find_m3u8) {
                                if (playlist.length > 1) first.playlist = playlist;
                            }

                            Lampa.Player.play(first);

                            if(find_m3u8) {
                                Lampa.Player.playlist(playlist);
                            }


                            if (viewed.indexOf(hash_file) == -1) {
                                viewed.push(hash_file);
                                item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                                Lampa.Storage.set('online_view', viewed);
                            }



                        } else Lampa.Noty.show(Lampa.Lang.translate('online_nolink'));


                    }, function (a, c) {
                        component.empty(network.errorDecode(a, c));
                    }, false, {
                        dataType: 'text'
                    });


                });
                component.append(item);
                component.contextmenu({
                    item: item,
                    view: view,
                    viewed: viewed,
                    hash_file: hash_file,
                    file: function file(call) {
                        call(getFile(element));
                    }
                });
            });
            component.start(true);
        }
    }

    function component(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({
            mask: true,
            over: true
        });
        var files = new Lampa.Files(object);
        var filter = new Lampa.Filter(object);
        var balanser = Lampa.Storage.get('online_balanser', 'uakino');
        var last_bls = Lampa.Storage.cache('online_last_balanser', 200, {});

        if (last_bls[object.movie.id]) {
            balanser = last_bls[object.movie.id];
        }

        this.proxy = function (name) {
            var prox = Lampa.Storage.get('online_proxy_all');
            var need = Lampa.Storage.get('online_proxy_' + name);
            if (need) prox = need;

            if (prox && prox.slice(-1) !== '/') {
                prox += '/';
            }

            return prox;
        };

        var sources = {
            uakino: new uakino(this, object)
        };
        var last;
        var last_filter;
        var extended;
        var selected_id;
        var filter_translate = {
            season: Lampa.Lang.translate('torrent_serial_season'),
            voice: Lampa.Lang.translate('torrent_parser_voice'),
            source: Lampa.Lang.translate('settings_rest_source')
        };
        var filter_sources = ['uakino'];
        var ignore_sources = ['uakino'];
        var kiposk_sources = []; // шаловливые ручки

        if (filter_sources.indexOf(balanser) == -1) {
            balanser = 'uakino';
            Lampa.Storage.set('online_balanser', 'uakino');
        }

        scroll.body().addClass('torrent-list');

        function minus() {
            scroll.minus(window.innerWidth > 580 ? false : files.render().find('.files__left'));
        }

        window.addEventListener('resize', minus, false);
        minus();
        /**
         * Подготовка
         */

        this.create = function () {
            var _this = this;

            this.activity.loader(true);

            filter.onSearch = function (value) {
                Lampa.Activity.replace({
                    search: value,
                    clarification: true
                });
            };

            filter.onBack = function () {
                _this.start();
            };

            filter.render().find('.selector').on('hover:focus', function (e) {
                last_filter = e.target;
            });

            filter.onSelect = function (type, a, b) {
                if (type == 'filter') {
                    if (a.reset) {
                        if (extended) sources[balanser].reset();else _this.start();
                    } else {
                        sources[balanser].filter(type, a, b);
                    }
                } else if (type == 'sort') {
                    balanser = a.source;
                    Lampa.Storage.set('online_balanser', balanser);
                    last_bls[object.movie.id] = balanser;
                    Lampa.Storage.set('online_last_balanser', last_bls);

                    _this.search();

                    setTimeout(Lampa.Select.close, 10);
                }
            };

            filter.render().find('.filter--sort span').text(Lampa.Lang.translate('online_balanser'));
            filter.render();
            files.append(scroll.render());
            scroll.append(filter.render());
            this.search();
            return this.render();
        };
        /**
         * Начать поиск
         */


        this.search = function () {
            this.activity.loader(true);
            this.filter({
                source: filter_sources
            }, {
                source: 0
            });
            this.reset();
            this.find();
        };

        this.find = function () {
            var _this2 = this;

            var query = object.search;

            var display = function display(json) {

                if (json.data && json.data.length) {
                    if (json.data.length == 1 || object.clarification) {
                        _this2.extendChoice();

                        sources[balanser].search(object, json.data[0].kp_id || json.data[0].filmId, json.data);
                    } else {
                        _this2.similars(json.data);

                        _this2.loading(false);
                    }
                } else _this2.emptyForQuery(query);
            };



            network.clear();
            network.timeout(1000 * 15);

            if (ignore_sources.indexOf(balanser) >= 0) {
                display({
                    data: [{
                        title: object.movie.title || object.movie.name
                    }]
                });
            }

        };

        this.extendChoice = function () {
            var data = Lampa.Storage.cache('online_choice_' + balanser, 500, {});
            var save = data[selected_id || object.movie.id] || {};
            extended = true;
            sources[balanser].extendChoice(save);
        };

        this.saveChoice = function (choice) {
            var data = Lampa.Storage.cache('online_choice_' + balanser, 500, {});
            data[selected_id || object.movie.id] = choice;
            Lampa.Storage.set('online_choice_' + balanser, data);
        };
        /**
         * Есть похожие карточки
         * @param {Object} json
         */


        this.similars = function (json) {
            var _this3 = this;

            json.forEach(function (elem) {
                var year = elem.start_date || elem.year || '';
                elem.title = elem.title || elem.ru_title || elem.en_title || elem.nameRu || elem.nameEn;
                elem.quality = '';
                elem.info  = year ? year : '----';
                var item = Lampa.Template.get('online_folder', elem);
                item.on('hover:enter', function () {
                    _this3.activity.loader(true);

                    _this3.reset();

                    object.search_date = year;
                    selected_id = elem.id;

                    _this3.extendChoice();

                    if (balanser == 'videocdn'  ) sources[balanser].search(object, [elem]);else sources[balanser].search(object, elem.kp_id || elem.filmId, [elem]);
                });

                _this3.append(item);
            });
        };
        /**
         * Очистить список файлов
         */


        this.reset = function () {
            last = false;
            scroll.render().find('.empty').remove();
            filter.render().detach();
            scroll.clear();
            scroll.append(filter.render());
        };
        /**
         * Загрузка
         */


        this.loading = function (status) {
            if (status) this.activity.loader(true);else {
                this.activity.loader(false);
                this.activity.toggle();
            }
        };
        /**
         * Построить фильтр
         */


        this.filter = function (filter_items, choice) {
            var select = [];

            var add = function add(type, title) {
                var need = Lampa.Storage.get('online_filter', '{}');
                var items = filter_items[type];
                var subitems = [];
                var value = need[type];
                items.forEach(function (name, i) {
                    subitems.push({
                        title: name,
                        selected: value == i,
                        index: i
                    });
                });
                select.push({
                    title: title,
                    subtitle: items[value],
                    items: subitems,
                    stype: type
                });
            };

            filter_items.source = filter_sources;
            choice.source = filter_sources.indexOf(balanser);
            select.push({
                title: Lampa.Lang.translate('torrent_parser_reset'),
                reset: true
            });
            Lampa.Storage.set('online_filter', choice);
            if (filter_items.voice && filter_items.voice.length) add('voice', Lampa.Lang.translate('torrent_parser_voice'));
            if (filter_items.season && filter_items.season.length) add('season', Lampa.Lang.translate('torrent_serial_season'));
            filter.set('filter', select);
            filter.set('sort', filter_sources.map(function (e) {
                return {
                    title: e,
                    source: e,
                    selected: e == balanser
                };
            }));
            this.selected(filter_items);
        };
        /**
         * Закрыть фильтр
         */


        this.closeFilter = function () {
            if ($('body').hasClass('selectbox--open')) Lampa.Select.close();
        };
        /**
         * Показать что выбрано в фильтре
         */


        this.selected = function (filter_items) {
            var need = Lampa.Storage.get('online_filter', '{}'),
                select = [];

            for (var i in need) {
                if (filter_items[i] && filter_items[i].length) {
                    if (i == 'voice') {
                        select.push(filter_translate[i] + ': ' + filter_items[i][need[i]]);
                    } else if (i !== 'source') {
                        if (filter_items.season.length >= 1) {
                            select.push(filter_translate.season + ': ' + filter_items[i][need[i]]);
                        }
                    }
                }
            }

            filter.chosen('filter', select);
            filter.chosen('sort', [balanser]);
        };
        /**
         * Добавить файл
         */


        this.append = function (item) {
            item.on('hover:focus', function (e) {
                last = e.target;
                scroll.update($(e.target), true);
            });
            scroll.append(item);
        };
        /**
         * Меню
         */


        this.contextmenu = function (params) {
            params.item.on('hover:long', function () {
                function show(extra) {
                    var enabled = Lampa.Controller.enabled().name;
                    var menu = [{
                        title: Lampa.Lang.translate('torrent_parser_label_title'),
                        mark: true
                    }, {
                        title: Lampa.Lang.translate('torrent_parser_label_cancel_title'),
                        clearmark: true
                    }, {
                        title: Lampa.Lang.translate('time_reset'),
                        timeclear: true
                    }];

                    if (Lampa.Platform.is('webos')) {
                        menu.push({
                            title: Lampa.Lang.translate('player_lauch') + ' - Webos',
                            player: 'webos'
                        });
                    }

                    if (Lampa.Platform.is('android')) {
                        menu.push({
                            title: Lampa.Lang.translate('player_lauch') + ' - Android',
                            player: 'android'
                        });
                    }

                    menu.push({
                        title: Lampa.Lang.translate('player_lauch') + ' - Lampa',
                        player: 'lampa'
                    });

                    if (extra) {
                        menu.push({
                            title: Lampa.Lang.translate('copy_link'),
                            copylink: true
                        });
                    }

                    if (Lampa.Account.working() && params.element && typeof params.element.season !== 'undefined' && Lampa.Account.subscribeToTranslation) {
                        menu.push({
                            title: Lampa.Lang.translate('online_voice_subscribe'),
                            subscribe: true
                        });
                    }

                    Lampa.Select.show({
                        title: Lampa.Lang.translate('title_action'),
                        items: menu,
                        onBack: function onBack() {
                            Lampa.Controller.toggle(enabled);
                        },
                        onSelect: function onSelect(a) {
                            if (a.clearmark) {
                                Lampa.Arrays.remove(params.viewed, params.hash_file);
                                Lampa.Storage.set('online_view', params.viewed);
                                params.item.find('.torrent-item__viewed').remove();
                            }

                            if (a.mark) {
                                if (params.viewed.indexOf(params.hash_file) == -1) {
                                    params.viewed.push(params.hash_file);
                                    params.item.append('<div class="torrent-item__viewed">' + Lampa.Template.get('icon_star', {}, true) + '</div>');
                                    Lampa.Storage.set('online_view', params.viewed);
                                }
                            }

                            if (a.timeclear) {
                                params.view.percent = 0;
                                params.view.time = 0;
                                params.view.duration = 0;
                                Lampa.Timeline.update(params.view);
                            }

                            Lampa.Controller.toggle(enabled);

                            if (a.player) {
                                Lampa.Player.runas(a.player);
                                params.item.trigger('hover:enter');
                            }

                            if (a.copylink) {
                                if (extra.quality) {
                                    var qual = [];

                                    for (var i in extra.quality) {
                                        qual.push({
                                            title: i,
                                            file: extra.quality[i]
                                        });
                                    }

                                    Lampa.Select.show({
                                        title: 'Ссылки',
                                        items: qual,
                                        onBack: function onBack() {
                                            Lampa.Controller.toggle(enabled);
                                        },
                                        onSelect: function onSelect(b) {
                                            Lampa.Utils.copyTextToClipboard(b.file, function () {
                                                Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                                            }, function () {
                                                Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                                            });
                                        }
                                    });
                                } else {
                                    Lampa.Utils.copyTextToClipboard(extra.file, function () {
                                        Lampa.Noty.show(Lampa.Lang.translate('copy_secuses'));
                                    }, function () {
                                        Lampa.Noty.show(Lampa.Lang.translate('copy_error'));
                                    });
                                }
                            }

                            if (a.subscribe) {
                                Lampa.Account.subscribeToTranslation({
                                    card: object.movie,
                                    season: params.element.season,
                                    episode: params.element.translate_episode_end,
                                    voice: params.element.translate_voice
                                }, function () {
                                    Lampa.Noty.show(Lampa.Lang.translate('online_voice_success'));
                                }, function () {
                                    Lampa.Noty.show(Lampa.Lang.translate('online_voice_error'));
                                });
                            }
                        }
                    });
                }

                params.file(show);
            }).on('hover:focus', function () {
                if (Lampa.Helper) Lampa.Helper.show('online_file', Lampa.Lang.translate('helper_online_file'), params.item);
            });
        };
        /**
         * Показать пустой результат
         */


        this.empty = function (msg) {
            var empty = Lampa.Template.get('list_empty');
            if (msg) empty.find('.empty__descr').text(msg);
            scroll.append(empty);
            this.loading(false);
        };
        /**
         * Показать пустой результат по ключевому слову
         */


        this.emptyForQuery = function (query) {
            this.empty(Lampa.Lang.translate('online_query_start') + ' (' + query + ') ' + Lampa.Lang.translate('online_query_end'));
        };

        this.getLastEpisode = function (items) {
            var last_episode = 0;
            items.forEach(function (e) {
                if (typeof e.episode !== 'undefined') last_episode = Math.max(last_episode, parseInt(e.episode));
            });
            return last_episode;
        };
        /**
         * Начать навигацию по файлам
         */


        this.start = function (first_select) {
            if (Lampa.Activity.active().activity !== this.activity) return; //обязательно, иначе наблюдается баг, активность создается но не стартует, в то время как компонент загружается и стартует самого себя.

            if (first_select) {
                var last_views = scroll.render().find('.selector.online').find('.torrent-item__viewed').parent().last();
                if (object.movie.number_of_seasons && last_views.length) last = last_views.eq(0)[0];else last = scroll.render().find('.selector').eq(3)[0];
            }

            Lampa.Background.immediately(Lampa.Utils.cardImgBackground(object.movie));
            Lampa.Controller.add('content', {
                toggle: function toggle() {
                    Lampa.Controller.collectionSet(scroll.render(), files.render());
                    Lampa.Controller.collectionFocus(last || false, scroll.render());
                },
                up: function up() {
                    if (Navigator.canmove('up')) {
                        if (scroll.render().find('.selector').slice(3).index(last) == 0 && last_filter) {
                            Lampa.Controller.collectionFocus(last_filter, scroll.render());
                        } else Navigator.move('up');
                    } else Lampa.Controller.toggle('head');
                },
                down: function down() {
                    Navigator.move('down');
                },
                right: function right() {
                    if (Navigator.canmove('right')) Navigator.move('right');else filter.show(Lampa.Lang.translate('title_filter'), 'filter');
                },
                left: function left() {
                    if (Navigator.canmove('left')) Navigator.move('left');else Lampa.Controller.toggle('menu');
                },
                back: this.back
            });
            Lampa.Controller.toggle('content');
        };

        this.render = function () {
            return files.render();
        };

        this.back = function () {
            Lampa.Activity.backward();
        };

        this.pause = function () {};

        this.stop = function () {};

        this.destroy = function () {
            network.clear();
            files.destroy();
            scroll.destroy();
            network = null;
            sources.uakino.destroy();
            window.removeEventListener('resize', minus);
        };
    }

    if (!Lampa.Lang) {
        var lang_data = {};
        Lampa.Lang = {
            add: function add(data) {
                lang_data = data;
            },
            translate: function translate(key) {
                return lang_data[key] ? lang_data[key].ru : key;
            }
        };
    }

    Lampa.Lang.add({
        online_watch: {
            ru: 'Смотреть онлайн',
            en: 'Watch online',
            ua: 'Дивитися онлайн',
            zh: '在线观看'
        },
        title_watch: {
            ru: 'Смотреть онлайн',
            en: 'Watch online',
            ua: 'Дивитися онлайн',
            zh: '在线观看'
        },
        online_nolink: {
            ru: 'Не удалось извлечь ссылку',
            uk: 'Неможливо отримати посилання',
            en: 'Failed to fetch link',
            zh: '获取链接失败'
        },
        online_waitlink: {
            ru: 'Работаем над извлечением ссылки, подождите...',
            uk: 'Працюємо над отриманням посилання, зачекайте...',
            en: 'Working on extracting the link, please wait...',
            zh: '正在提取链接，请稍候...'
        },
        online_balanser: {
            ru: 'Балансер',
            uk: 'Балансер',
            en: 'Balancer',
            zh: '平衡器'
        },
        helper_online_file: {
            ru: 'Удерживайте клавишу "ОК" для вызова контекстного меню',
            uk: 'Утримуйте клавішу "ОК" для виклику контекстного меню',
            en: 'Hold the "OK" key to bring up the context menu',
            zh: '按住“确定”键调出上下文菜单'
        },
        online_query_start: {
            ru: 'По запросу',
            uk: 'На запит',
            en: 'On request',
            zh: '根据要求'
        },
        online_query_end: {
            ru: 'нет результатов',
            uk: 'немає результатів',
            en: 'no results',
            zh: '没有结果'
        },
        title_online: {
            ru: 'Онлайн',
            uk: 'Онлайн',
            en: 'Online',
            zh: '在线的'
        },
        title_proxy: {
            ru: 'Прокси',
            uk: 'Проксі',
            en: 'Proxy',
            zh: '代理人'
        },
        online_proxy_title: {
            ru: 'Основной прокси',
            uk: 'Основний проксі',
            en: 'Main proxy',
            zh: '主要代理'
        },
        online_proxy_descr: {
            ru: 'Будет использоваться для всех балансеров',
            uk: 'Використовуватиметься для всіх балансерів',
            en: 'Will be used for all balancers',
            zh: '将用于所有平衡器'
        },
        online_proxy_placeholder: {
            ru: 'Например: http://proxy.com',
            uk: 'Наприклад: http://proxy.com',
            en: 'For example: http://proxy.com',
            zh: '例如：http://proxy.com'
        },
        title_status: {
            ru: 'Статус',
            uk: 'Статус',
            en: 'Status',
            zh: '地位'
        },
        online_voice_subscribe: {
            ru: 'Подписаться на перевод',
            uk: 'Підписатися на переклад',
            en: 'Subscribe to translation',
            zh: '订阅翻译'
        },
        online_voice_success: {
            ru: 'Вы успешно подписались',
            uk: 'Ви успішно підписалися',
            en: 'You have successfully subscribed',
            zh: '您已成功订阅'
        },
        online_voice_error: {
            ru: 'Возникла ошибка',
            uk: 'Виникла помилка',
            en: 'An error has occurred',
            zh: '发生了错误'
        }
    });

    function resetTemplates() {
        Lampa.Template.add('online', "<div class=\"online selector\">\n        <div class=\"online__body\">\n            <div style=\"position: absolute;left: 0;top: -0.3em;width: 2.4em;height: 2.4em\">\n                <svg style=\"height: 2.4em; width:  2.4em;\" viewBox=\"0 0 128 128\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <circle cx=\"64\" cy=\"64\" r=\"56\" stroke=\"white\" stroke-width=\"16\"/>\n                    <path d=\"M90.5 64.3827L50 87.7654L50 41L90.5 64.3827Z\" fill=\"white\"/>\n                </svg>\n            </div>\n            <div class=\"online__title\" style=\"padding-left: 2.1em;\">{title}</div>\n            <div class=\"online__quality\" style=\"padding-left: 3.4em;\">{quality}{info}</div>\n        </div>\n    </div>");
        Lampa.Template.add('online_folder', "<div class=\"online selector\">\n        <div class=\"online__body\">\n            <div style=\"position: absolute;left: 0;top: -0.3em;width: 2.4em;height: 2.4em\">\n                <svg style=\"height: 2.4em; width:  2.4em;\" viewBox=\"0 0 128 112\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect y=\"20\" width=\"128\" height=\"92\" rx=\"13\" fill=\"white\"/>\n                    <path d=\"M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z\" fill=\"white\" fill-opacity=\"0.23\"/>\n                    <rect x=\"11\" y=\"8\" width=\"106\" height=\"76\" rx=\"13\" fill=\"white\" fill-opacity=\"0.51\"/>\n                </svg>\n            </div>\n            <div class=\"online__title\" style=\"padding-left: 2.1em;\">{title}</div>\n            <div class=\"online__quality\" style=\"padding-left: 3.4em;\">{quality}{info}</div>\n        </div>\n    </div>");
    }

    var button = "<div class=\"full-start__button selector view--online\" data-subtitle=\"v1.0\">\n    <svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:svgjs=\"http://svgjs.com/svgjs\" version=\"1.1\" width=\"512\" height=\"512\" x=\"0\" y=\"0\" viewBox=\"0 0 30.051 30.051\" style=\"enable-background:new 0 0 512 512\" xml:space=\"preserve\" class=\"\">\n    <g xmlns=\"http://www.w3.org/2000/svg\">\n        <path d=\"M19.982,14.438l-6.24-4.536c-0.229-0.166-0.533-0.191-0.784-0.062c-0.253,0.128-0.411,0.388-0.411,0.669v9.069   c0,0.284,0.158,0.543,0.411,0.671c0.107,0.054,0.224,0.081,0.342,0.081c0.154,0,0.31-0.049,0.442-0.146l6.24-4.532   c0.197-0.145,0.312-0.369,0.312-0.607C20.295,14.803,20.177,14.58,19.982,14.438z\" fill=\"currentColor\"/>\n        <path d=\"M15.026,0.002C6.726,0.002,0,6.728,0,15.028c0,8.297,6.726,15.021,15.026,15.021c8.298,0,15.025-6.725,15.025-15.021   C30.052,6.728,23.324,0.002,15.026,0.002z M15.026,27.542c-6.912,0-12.516-5.601-12.516-12.514c0-6.91,5.604-12.518,12.516-12.518   c6.911,0,12.514,5.607,12.514,12.518C27.541,21.941,21.937,27.542,15.026,27.542z\" fill=\"currentColor\"/>\n    </g></svg>\n\n    <span>uakino.club</span>\n    </div>"; // нужна заглушка, а то при страте лампы говорит пусто

    Lampa.Component.add('online', component); //то же самое

    resetTemplates();
    Lampa.Listener.follow('full', function (e) {
        if (e.type == 'complite') {
            var btn = $(Lampa.Lang.translate(button));
            btn.on('hover:enter', function () {
                resetTemplates();
                Lampa.Component.add('online', component);
                Lampa.Activity.push({
                    url: '',
                    title: 'uakino.club',
                    component: 'online',
                    search: e.data.movie.title,
                    search_one: e.data.movie.title,
                    search_two: e.data.movie.original_title,
                    movie: e.data.movie,
                    page: 1
                });
            });
            e.object.activity.render().find('.view--torrent').after(btn);
        }
    }); ///////ONLINE/////////

    Lampa.Params.select('online_proxy_all', '', '');
    Lampa.Params.select('online_proxy_uakino', '', '');

    Lampa.Template.add('settings_proxy', "<div>\n    " +
        "<div class=\"settings-param selector\" data-type=\"input\" data-name=\"online_proxy_all\" placeholder=\"#{online_proxy_placeholder}\">\n        <div class=\"settings-param__name\">#{online_proxy_title}</div>\n        <div class=\"settings-param__value\"></div>\n        <div class=\"settings-param__descr\">#{online_proxy_descr}</div>\n    </div>\n\n     " +
        "<div class=\"settings-param selector\" data-type=\"input\" data-name=\"online_proxy_uakino\" placeholder=\"#{online_proxy_placeholder}\">\n        <div class=\"settings-param__name\">UAKINO</div>\n        <div class=\"settings-param__value\"></div>\n    </div>\n\n</div>");

    function addSettingsProxy() {
        if (Lampa.Settings.main && !Lampa.Settings.main().render().find('[data-component="proxy"]').length) {
            var field = $(Lampa.Lang.translate("<div class=\"settings-folder selector\" data-component=\"proxy\">\n            <div class=\"settings-folder__icon\">\n                <svg height=\"46\" viewBox=\"0 0 42 46\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <rect x=\"1.5\" y=\"26.5\" width=\"39\" height=\"18\" rx=\"1.5\" stroke=\"white\" stroke-width=\"3\"/>\n                <circle cx=\"9.5\" cy=\"35.5\" r=\"3.5\" fill=\"white\"/>\n                <circle cx=\"26.5\" cy=\"35.5\" r=\"2.5\" fill=\"white\"/>\n                <circle cx=\"32.5\" cy=\"35.5\" r=\"2.5\" fill=\"white\"/>\n                <circle cx=\"21.5\" cy=\"5.5\" r=\"5.5\" fill=\"white\"/>\n                <rect x=\"31\" y=\"4\" width=\"11\" height=\"3\" rx=\"1.5\" fill=\"white\"/>\n                <rect y=\"4\" width=\"11\" height=\"3\" rx=\"1.5\" fill=\"white\"/>\n                <rect x=\"20\" y=\"14\" width=\"3\" height=\"7\" rx=\"1.5\" fill=\"white\"/>\n                </svg>\n            </div>\n            <div class=\"settings-folder__name\">#{title_proxy}</div>\n        </div>"));
            Lampa.Settings.main().render().find('[data-component="more"]').after(field);
            Lampa.Settings.main().update();
        }
    }

    if (window.appready) addSettingsProxy();else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') addSettingsProxy();
        });
    } ///////FILMIX/////////




})();