<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: X-Requested-With, Content-Type, Accept, Origin, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

$search = @$_REQUEST['search'];
$search_json = @$_REQUEST['search_json'];
$film = @$_REQUEST['film'];
$news_id = @$_REQUEST['news_id'];

$url_parse = 'https://uakino.club/';

function parse_search_page($url, $search, $page)
{
    $curl = curl_init($url);

    $query['do'] = 'search';
    $query['subaction'] = 'search';
    $query['from_page'] = "{$page}";
    $query['story'] = $search;
    $content = http_build_query($query);

    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_POSTFIELDS, $content);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_HEADER, false);
    curl_setopt($curl, CURLOPT_TIMEOUT, 30);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($curl);

    if (curl_errno($curl)) {
//        print_r(curl_error($curl));
//        print_r(curl_errno($curl));
    }

    $result = str_replace(["\r\n", "\n"], '', $response);

    $dom = new \DOMDocument();
    $dom->loadHTML($result);

    $data = [];
    $next_page = false;

    foreach($dom->getElementsByTagName('div') as $div) {
        if ( $div->hasAttribute('class')
            && $div->getAttribute('class') == 'movie-item short-item') {

            $item = [];

            foreach ($div->getElementsByTagName('a') as $a_title) {
                if($a_title->hasAttribute('class')
                    && $a_title->hasAttribute('href')
                    && $a_title->getAttribute('class') == 'movie-title') {

                    $item['href'] = trim($a_title->getAttribute('href'));
                    $item['title'] = trim($a_title->nodeValue);
                }
            }

            foreach ($div->getElementsByTagName('div') as $div_season) {
                if($div_season->hasAttribute('class')
                    && $div_season->getAttribute('class') == 'full-season') {
                    $item['season'] = trim($div_season->nodeValue);
                }
            }

            foreach ($div->getElementsByTagName('div') as $div_year) {
                if($div_year->hasAttribute('class')
                    && $div_year->getAttribute('class') == 'deck-value') {
                    $item['info'][] = trim($div_year->nodeValue);
                }
            }

            $data[] = [
                'href' => @$item['href'],
                'title' => @$item['title'],
                'season' => @$item['season'],
                'year' => @$item['info'][2],
                'type' => @$item['info'][1],
                'imdb' => @$item['info'][0],
            ];
        }
    }

    foreach($dom->getElementsByTagName('span') as $span) {
        if ( $span->hasAttribute('class')
            && $span->getAttribute('class') == 'navigation') {
            $next_page = true;
        }
    }

    return [$data, $next_page];
}

if (!empty($search_json)) {
    list($data, $next_page) = parse_search_page($url_parse, $search_json, 0);
    if ($next_page) {
        list($data2, $next_page) = parse_search_page($url_parse, $search_json, 2);
        $data = array_merge($data, $data2);
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    die();
}

if (!empty($search)) {

    echo 'parse';

    $curl = curl_init('https://uakino.club/');

    $query['do'] = 'search';
    $query['subaction'] = 'search';
    $query['from_page'] = '0';
    $query['story'] = $search;
    $content = http_build_query($query);

    curl_setopt($curl, CURLOPT_POST, true);
    curl_setopt($curl, CURLOPT_POSTFIELDS, $content);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_HEADER, false);
    curl_setopt($curl, CURLOPT_TIMEOUT, 30);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($curl);

    if (curl_errno($curl)) {
        print_r(curl_error($curl));
        print_r(curl_errno($curl));
    }

    $result = str_replace(["\r\n", "\n"], '', $response);
    echo($result);
    die();
}

if (!empty($film)) {

    echo 'parse film';

    $curl = curl_init($film);

    $content = http_build_query([]);

    curl_setopt($curl, CURLOPT_POST, false);
    curl_setopt($curl, CURLOPT_POSTFIELDS, $content);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_HEADER, false);
    curl_setopt($curl, CURLOPT_TIMEOUT, 30);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($curl);

    if (curl_errno($curl)) {
        print_r(curl_error($curl));
        print_r(curl_errno($curl));
    }

    $result = str_replace(["\r\n", "\n"], '', $response);
    echo($result);
    die();
}

if (!empty($news_id)) {

    echo 'parse';



    $query['news_id'] = $news_id;
    $query['xfield'] = 'playlist';
    $content = http_build_query($query);

    $curl = curl_init('https://uakino.club/engine/ajax/playlists.php?' . $content);

    curl_setopt($curl, CURLOPT_POST, false);
//    curl_setopt($curl, CURLOPT_POSTFIELDS, $content);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_HEADER, false);
    curl_setopt($curl, CURLOPT_TIMEOUT, 30);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($curl);

    if (curl_errno($curl)) {
        print_r(curl_error($curl));
        print_r(curl_errno($curl));
    }

    $result = str_replace(["\r\n", "\n"], '', print_r(json_decode($response), 1));
    echo($result);
    die();
}

