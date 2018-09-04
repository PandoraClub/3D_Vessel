<?php

//Data and Username
require_once("../../local_config.php");
require_once(APP_INC_PATH."bootstrap_frontend.php");
sessionsClass::site_protection(true,true,true,false,false);

$userid = dbase::globalMagic($_SESSION['userid']);

$data = Admin::get_user($userid,false,'profile',true);
if ($data !== false){
    $username = dbase::globalMagic($data['username']);
}

//Read JSON posted
$data = json_decode(file_get_contents('php://input'), true);
$sql_query = "";

//Database
require_once '../../db.php';
use Illuminate\Database\Capsule\Manager as DB;
$colors = DB::table('viewer_user_colors')->where('username', $username)->get();

foreach ($data as $r=>$rowColor) {
    $key = $rowColor['attributeKey'];
    $prop = $rowColor['attributeValue'];
    $hexColor = $rowColor['hexColor'];

    $vuc = DB::table('viewer_user_colors')->where([
        ['attribute_key', '=', $key],
        ['attribute_value', '=', $prop],
        ['username', '=', $username]
    ])->first();

    if ($vuc) {
        DB::table('viewer_user_colors')->where([
            ['attribute_key', '=', $key],
            ['attribute_value', '=', $prop],
            ['username', '=', $username]
        ])->update(['hex_color' => $hexColor]);
        echo "UPD " . $vuc->id . "\n";
    } else {
        $dbId = DB::table('viewer_user_colors')->insertGetId(
            array('attribute_key' => $key, 'attribute_value' => $prop, 'hex_color' => $hexColor, 'username' => $username )
        );
        echo "INS " . $dbId . "\n";
    }
}

?>

