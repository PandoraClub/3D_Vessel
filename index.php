<!DOCTYPE html>
<html>
    <head>
        <meta charset=utf-8>
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
        <title>BAPLIE Viewer Online - 3D Vessel</title>
        <link rel="stylesheet" href="system/css/styles.css" />
        <link rel="stylesheet" href="system/lib/css/colorpicker/colorjoe.css" />
    </head>
    <body>
        <!-- --------------------------
           Developed by www.saants.es
        --------------------------- -->

        <h3 id="hint_area">Processing...</h3>
        <canvas id="container_mtl"></canvas>
        <img src="system/model/container_side-top.jpg" id="texture_20" class="texture"></body>
        <img src="system/model/container_side-top_40.jpg" id="texture_40" class="texture"></body>

        <div id="search_popup">
            <p>Input multiple container numbers with any delimiter</p>
            <img src="system/images/close.png" id="btn_close">
            <div id="search_body">
                <div id="search_left">
                    <textarea id="search_content"></textarea>
                </div>
                <div id="search_right">
                    <input type="button" id="btn_apply_filter" value="Apply Filter">
                    <input type="button" id="btn_clear_filter" value="Clear Filter">
                </div>
            </div>
        </div>
        <div id="app-3d"" class="app3d-main-panel"
            data-gpu="It seems that your graphic card does not support WebGL. Without it we cannot show you the 3D Vessel Content.<br />Try using another browser."
            data-webgl="Your browser does not support WebGL. Without it we cannot show you the 3D Vessel Content.<br />Only for modern browsers & IE11+">
        
            <div id="prevnext-container" class="prevnext-container">
                <span id="bay-prev" class="prevnext bay-prev noselect ">&larr; Previous bay</span>
                <span id="bay-next" class="prevnext bay-next active noselect ">Next bay &rarr;</span>
            </div>

            <div id="app-3d-loading-div" class="app3d-loading-div">
                <div id="app-3d-loading-div-text" class="app3d-loading-div-text"></div>
                <img src="system/images/logo.png" alt="loading" class="app3d-loading-logo-img" />
            </div>
        </div>
        <!-- <img id="img-loader-logo" class="hidden" src="system/images/logo.png" /> -->
        
        <h1 id="titleH1" class="titleH1"></h1>
        <h2 id="titleBay" class="titleBay"></h2>
        <span id="open-panel" class="open-close-panel noselect">
            See container data for this bay
        </span>
        <div id="nav_buttons">
            <span>-</span>
            <img src="system/images/tabslider-right.png">
        </div>
        <div class="info-panel">
            <div id="info-window" class="info-window"></div>
            <div class="generate-pdf">
                <button id="btnLaunchPDF" class="btnLaunchPDF">PRINT Full Cargo View</button>
            </div>
            <section id="group_vessel_detail" class="collapse">
                <div class="btn_collapse expand">
                    <h3 class="group_title">Vessel Details</h3>
                    <span class="">-</span>
                </div>
                <group>
                    <div class="expand-view">
                        <input id="shipView" type="checkbox" checked="checked" /> <label for="shipView" class="noselect">Show Vessel</label>
                    </div>
                    <div class="expand-view">
                        <input id="view-hcs" checked type="checkbox" /> <label for="view-hcs" class="noselect">Show Hatch Covers</label>
                    </div>
                    <div class="expand-view">
                        <h3>Add a Bridge:</h3>
                        <select id="dropAddHouse"></select>
                    </div>
                </group>
            </section>
            <section id="group_bay_detail" class="collapse">
                <div class="btn_collapse expand">
                    <h3 class="group_title">Bay Details</h3>
                    <span class="">-</span>
                </div>
                <group>
                    <div class="view-hcs">
                        <input id="expandView" type="checkbox" /> <label for="expandView" class="noselect">View Bay By Bay</label>
                    </div>
                    <div class="view-hcs hidden">
                        <input id="baynumView" type="checkbox"/> <label for="baynumView">View Bay Numbers</label>
                    </div>
                    <div class="view-hcs">
                        <h3>View a specific Bay:</h3>
                        <select id="dropBays"></select>
                    </div>
                </group>
            </section>
            <section id="group_container_detail" class="collapse">
                <div class="btn_collapse expand">
                    <h3 class="group_title">Find / Filter Containers</h3>
                    <span class="">-</span>
                </div>
                <group>
                    <div class="filtering">
                        <input type="button" value="Find Multiple Containers" id="btn_find_multi">
                    </div>
                    <div class="filtering">
                        <h3>Filter containers by:</h3>
                        <select id="dropFilter"></select>
                        <select id="dropFilterValue" disabled><option value=''>No filter</option></select>
                        <input id="showWireframesFiltered" checked type="checkbox" /> <label for="showWireframesFiltered" class="noselect">Show wireframes</label>
                    </div>
                </group>
            </section>
            <section id="group_color_detail" class="collapse">
                <div class="btn_collapse expand">
                    <h3 class="group_title">Colour By Options</h3>
                    <span class="">-</span>
                </div>
                <group>
                    <div class="coloring">
                        <h3>Colour containers by:</h3>
                        <select id="dropColors"></select>
                        <ul id="tableColors"></ul>
                        <button id="launchColorsWidget" class="launchColorsWidget">Customize colours</button>
                    </div>
                </group>
            </section>
            <div class="instructions">
            Arrow keys control sidewards movement, mouse controls rotation and zoom. Esc loads default view
            </div>            
        </div>
        <div id="bay-panel" class="bay-panel">
            <span id="close-panel" class="open-close-panel noselect">
                <br />&larr; back to 3D view
            </span>
            <iframe id="bay-iframe-container" class="iframe-container" width="100%"></iframe>
        </div>    
        
        <div id="tracer" class="tracer"> </div>
        <form id="posted-values" class="posted-values">
            <input type="hidden" name="json" id="json" />
            <input type="hidden" name="bay" id="bay" />            
        </form>
<?php /* *************************************************************** */
 
require_once("../local_config.php");
require_once(APP_INC_PATH."bootstrap_frontend.php");
sessionsClass::site_protection(true,true,true,false,false);

$userid = dbase::globalMagic($_SESSION['userid']);

$data = Admin::get_user($userid,false,'profile',true);
if ($data !== false){
    $username = dbase::globalMagic($data['username']);
}

//Query DB for username
$sql_results ="SELECT attribute_key, attribute_value, hex_color FROM " . DB_NAME . ".viewer_user_colors WHERE username = '".$username."';";

//ALTER TABLE foobar_data MODIFY COLUMN col VARCHAR(255) NOT NULL DEFAULT '{}';
$datagroup = dbase::globalQueryPlus($sql_results,$conn,2);

$joiner = "___";
$response;

if($datagroup[1]>0){
    $looped = dbase::loop_to_array($datagroup[0]);
    
    foreach($looped as $key=>$value){
        $response[($looped[$key]['attribute_key']).$joiner.($looped[$key]['attribute_value'])] = $looped[$key]['hex_color'];
    }
}
/* *************************************************************** */ ?>

        <script>
            var bayviewRoute = "../bayview.php";
            var generatePdfRoute = "php/generatePDF.php";
            var writeColorsRoute = "php/writeColors.php";
            var generatePdfBaseUrlRoute = "/BAPLIEViewerDisk/files/baplies/scanplans/<?php echo $username; ?>/";
            var downloadPdfBaseUrlRoute = "/SCANPLANS/<?php echo $username; ?>/";
            
            var userSettings = { 
                    colors: <?php echo json_encode($response) ?>
                };

        </script>
        
        <!--[if IE]>
        <script src="system/lib/js/polyfills/browser-polyfill.min.js"></script>
        <script src="system/lib/js/polyfills/es6-promise.js"></script>
        <![endif]-->
        <script src="system/lib/js/colorpicker/min/one-color-min.js"></script>
        <script src="system/lib/js/colorpicker/min/colorjoe-min.js"></script>
        <script src="system/js/build/min/libraries-for-app3d-min.js"></script>
        <script src="system/lib/js/underscore/underscore-min.js"></script>
        <script src="system/lib/js/jquery/jquery-3.1.1.min.js"></script>
        <script src="system/lib/js/jquery/upload-progress.js"></script>

        <script src="system/lib/js/three/loaders/MTLLoader.js"></script>
        <script src="system/lib/js/three/loaders/OBJLoader.js"></script>

        <script src="system/js/build/app3d.js"></script>

    </body>
</html>