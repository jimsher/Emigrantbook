<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $token = "PYgf3g33GkpEfBNJHBYrwM2cw6sEM2vh"; // შენი ტოკენი
    
    // 1. ვიგებთ თავისუფალ სერვერს
    $srvJson = file_get_contents('https://api.gofile.io/servers');
    $srvData = json_decode($srvJson, true);
    $serverName = $srvData['data']['servers'][0]['name'];

    // 2. ვამზადებთ ფაილს გასაგზავნად
    $file_path = $_FILES['file']['tmp_name'];
    $file_name = $_FILES['file']['name'];
    $file_type = $_FILES['file']['type'];

    $cfile = new CURLFile($file_path, $file_type, $file_name);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "https://$serverName.gofile.io/contents/uploadfile");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ['file' => $cfile]);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $token"]);

    $response = curl_exec($ch);
    curl_close($ch);

    echo $response; // ვუბრუნებთ პასუხს საიტს
}
?>
