<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: X-Requested-With, Content-Type, Accept, Origin, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

$search = @$_REQUEST['search'];
$film = @$_REQUEST['film'];
$news_id = @$_REQUEST['news_id'];

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

    $query['from_page'] = '2';
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

