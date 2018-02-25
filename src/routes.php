<?php

use Slim\Http\Request;
use Slim\Http\Response;

// Routes

$app->get('/', function (Request $request, Response $response, array $args) {

    // Render index view
    return $this->renderer->render($response, 'index.phtml', $args);
});

$app->post('/api/nicks', function (Request $request, Response $response, array $args) {

    $lookupList = $request->getParsedBody()["data"];

    $data_string = file_get_contents(__DIR__ . '/../data/photo_data.json');
    $photo_data = json_decode($data_string, true);

    $results = [];
    foreach ($lookupList as &$name) {
        $id = explode("#", $name)[0];
        $password = explode("#", $name)[1];
        if(array_key_exists($id, $photo_data) && ($photo_data[$id]['password']) == $password) {
            $results[$name] = $photo_data[$id]["nickname"];
        }
    }

    // Render index view
    return $response->withJson($results);
});

$app->post('/api/album', function (Request $request, Response $response, array $args) {

    $name = $request->getParsedBody()["name"];
    $id = explode("#", $name)[0];
    $password = explode("#", $name)[1];

    $data_string = file_get_contents(__DIR__ . '/../data/photo_data.json');
    $photo_data = json_decode($data_string, true);

    if(!array_key_exists($id, $photo_data)) {
        return $response->withJson(["error" => "Album not found"]);
    }

    $results = [];
    foreach ($photo_data[$id]["photos"] as $photo) {
        array_push($results, [
            "id" => $photo["id"],
            "rating" => $photo["like"]
        ]);
    }

    // Render index view
    return $response->withJson($results);
});

$app->get('/api/photo/{album}/{id}/{password}/{index}', function (Request $request, Response $response, array $args) {
    $password = $args['password'];
    $data_string = file_get_contents(__DIR__ . '/../data/photo_data.json');
    $photo_data = json_decode($data_string, true);

    if(!array_key_exists($args['album'], $photo_data) && $photo_data[$args['album']]['password'] == $args['password']) {
        return $response;
    }
    $album = $photo_data[$args['album']];

    if(!(intval($args["index"]) < count($album['photos']))) {
        return $response;
    }
    $photo = $album['photos'][$args['index']];

    $file = __DIR__.'/../data/photos/'.$args['album'].'/'.$photo['display_name'];
    if (file_exists($file)) {
        $response = $response->withHeader('Content-Description', 'File Transfer');
        $response = $response->withHeader('Content-Type', 'application/octet-stream');
        $response = $response->withHeader('Content-Disposition', 'attachment;filename="'.$photo['display_name'].'"');
        $response = $response->withHeader('Cache-Control', 'max-age=31536000');
        $response = $response->withHeader('Content-Length', filesize($file));
        $filestream = new \GuzzleHttp\Psr7\LazyOpenStream($file, 'r');
        $response = $response->withBody($filestream);
    }
    return $response;
});

$app->post('/api/rate', function (Request $request, Response $response, array $args) {
    $params = $request->getParsedBody();

    $data_string = file_get_contents(__DIR__ . '/../data/photo_data.json');
    $photo_data = json_decode($data_string, true);

    if(!array_key_exists($params["album_id"], $photo_data)) {
        return $response->withJson(["error" => "Album not found"]);
    }
    $album = $photo_data[$params["album_id"]];

    if($album["password"] != $params["password"]) {
        return $response->withJson(["error" => "Incorrect password"]);
    }

    $index = intval($params["index"]);
    if(!($index < count($album['photos']) && $album['photos'][$index]["id"] == $params["photo_id"])) {
        return $response->withJson(["error" => "Photo not found"]);
    }

    $photo_data[$params["album_id"]]['photos'][$index]["like"] = boolval(intval($params["like"]));

    file_put_contents(__DIR__ . '/../data/photo_data.json', json_encode($photo_data));

    // Render index view
    return $response->withJson(["success" => true]);
});

$app->post('/api/selected', function (Request $request, Response $response, array $args) {
    $params = $request->getParsedBody();
    $data_string = file_get_contents(__DIR__ . '/../data/photo_data.json');
    $photo_data = json_decode($data_string, true);

    $id = explode("#", $params['password_string'])[0];
    $password = explode("#", $params['password_string'])[1];

    if(!array_key_exists($id, $photo_data)) {
        return $response->withJson(["error" => "Album not found"]);
    }
    $album = $photo_data[$id];

    if($album["password"] != $password) {
        return $response->withJson(["error" => "Incorrect password"]);
    }

    $results = [];
    foreach($album['photos'] as $photo) {
        array_push($results, [
            'like' => $photo['like'],
            'filename' => $photo['filename']
        ]);
    }
    return $response->withJson(['photos' => $results]);
});
