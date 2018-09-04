<?php
echo "<!-- readColors.php init -->\n";

require_once("../../local_config.php");
echo "<!-- " . APP_INC_PATH . " -->\n";
require_once(APP_INC_PATH."bootstrap_frontend.php");
sessionsClass::site_protection(true,true,true,false,false);
echo "<!-- read includes -->\n";

function readColors() {
	echo "<!-- readColors-function -->\n";
	$response;

	$userid = dbase::globalMagic($_SESSION['userid']);

	$data = Admin::get_user($userid,false,'profile',true);
	if ($data !== false){
		$username = dbase::globalMagic($data['username']);
	}
	echo "<!--" . $username . "-->\n";

	//Query DB for username
	$sql_results ="SELECT attribute_key, attribute_value, hex_color FROM userbase.viewer_user_colors WHERE username = '".$username."';";
	echo "<!--" . $sql_results. "-->\n";

	//ALTER TABLE foobar_data MODIFY COLUMN col VARCHAR(255) NOT NULL DEFAULT '{}';
	$datagroup = dbase::globalQueryPlus($sql_results,$conn,2);

	if($datagroup[1]>0){
		$looped = dbase::loop_to_array($datagroup[0]);
		
		foreach($looped as $key=>$value){
			$response[$looped[$key]['attribute_key'].".".$looped[$key]['attribute_value']] = $looped[$key]['hex_color'];
		}
	}

	echo "<!--" . json_encode($response. "-->\n");
	return $response;
}

$responseColors = readColors();

?>