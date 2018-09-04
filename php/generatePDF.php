<?php
    header('Content-Type: application/json');
    
    /*
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);*/

    require('fpdf.php');

    set_time_limit(0);

    //Make dir
    $const_location_url = $_POST["locationUrl"];
    $conts_download_url = $_POST["downloadUrl"];
    mkdir($const_location_url, 0755, true);

    $title = $_POST["title"];
    $page_size = $_POST["pageSize"];
    $page_size_w = $_POST["pageSizeW"];
    $page_size_h = $_POST["pageSizeH"];
    $page_orientation = $_POST["pageOrientation"];
    $filterBy = $_POST["filterBy"];
    $num_images = intval($_POST["numImages"]);

    $vesselName = $_POST["vesselName"];
    $vesselCallSign = $_POST["vesselCallSign"];
    $sender = $_POST["sender"];
    $recipient = $_POST["recipient"];
    $placeOfDeparture = $_POST["placeOfDeparture"];
    $voyageNumber = $_POST["voyageNumber"];
    $footerLeft = $_POST["footerLeft"];
    $footerRight = $_POST["footerRight"];

    function saveImage($id, $name, $data, $loc) {
        
        //check there is an image
        if($data == "" or strpos($data, "data:image/") === false) { return; }
        
        //Separate type from image data
        list($type, $data) = explode(';', $data);
        list(, $data)      = explode(',', $data);
        $data = base64_decode($data);
        
        //Get image format (png or jpg)
        $image_format = str_replace('data:image/', '', $type);
        
        //Compose Image name       
        $image_name = $id . "_" . $name . "." . $image_format;
        
        //Save it to disk
        file_put_contents($loc . $image_name, $data);
        
        //returns the name of the image, if needed...
        return $loc . $image_name;
    }

    function generateRandomString($length = 10) {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        return $randomString;
    }

    class PDF extends FPDF
    {
        // Cabecera de página
        function Header()
        {
            $leftText = "";
            if (isset($GLOBALS["sender"])) { $leftText .= "EDI Sender: " . $GLOBALS['sender'] . "\n"; }
            if (isset($GLOBALS["recipient"])) { $leftText .= "EDI Recipient: " . $GLOBALS['recipient']; }

            $rightText = "";
            if (isset($GLOBALS["voyageNumber"])) { $rightText .= "Vessel Voyage: " . $GLOBALS['voyageNumber'] . "\n"; }
            if (isset($GLOBALS["vesselCallSign"])) { $rightText .= "Vessel Call-Sign: " . $GLOBALS['vesselCallSign'] . "\n"; }
            if (isset($GLOBALS["placeOfDeparture"])) { $rightText .= "Place of Departure: " . $GLOBALS['placeOfDeparture'] . "\n"; }
                        
            $ww = ($GLOBALS['page_size_w'] - 1) / 3;
            $this->SetXY(0.5, 0.2);
            $this->SetFont('Arial','',7);
            $this->MultiCell($ww,0.12,$leftText, 0, 'L');

            $this->SetXY(0.5 + $ww, 0.1);
            $this->SetFont('Arial','B',15);
            $this->Cell($ww,0.5, $GLOBALS['vesselName'], 0, 0, 'C');

            $this->SetXY(0.5 + $ww * 2, 0.2);
            $this->SetFont('Arial','',7);
            $this->MultiCell($ww,0.12,$rightText, 0, 'R');
        }

        // Pie de página
        function Footer()
        {
            $leftText = $GLOBALS['filterBy'] . "\n" .$GLOBALS['footerLeft'];
            $rightText = date('jS \of F Y h:i:s A') . "\n" .$GLOBALS['footerRight'];

            $ww = ($GLOBALS['page_size_w'] - 1) / 3;
            $this->SetY(-0.5);
            $this->SetFont('Arial','',7);
            $this->MultiCell($ww,0.12,$leftText, 0, 'L');

            $this->SetXY(0.5 + $ww, -0.5);           
            $this->SetFont('Arial','I',7);
            $this->MultiCell($ww,0.5,'Page '.$this->PageNo().'/{nb}', 0, 'C');

            $this->SetXY(0.5 + $ww * 2, -0.5);            
            $this->SetFont('Arial','',7);
            $this->MultiCell($ww,0.12,$rightText, 0, 'R');
        }
    }    

    $temp_id = generateRandomString(16);

    //Save images
    for ($i = 0; $i < $num_images; $i++) {
        $images["page_" . $i] = saveImage( $temp_id, "page_" . $i, $_POST["page_" . $i], $const_location_url);
    }

    //Generate PDF
    $pdf = new PDF($page_orientation, "in", $page_size);
    $pdf->AliasNbPages();
    for ($i = 0; $i < $num_images; $i++) {
        $pdf->AddPage();
        $pdf->Image($images["page_" . $i], 0, 0.5, $page_size_w, $page_size_h);
    }
    $pdf->Output("F", $const_location_url . $temp_id . ".pdf");

    //House-keeping
    for ($i = 0; $i < $num_images; $i++) {
        unlink($images["page_" . $i]);
    }

    //return JSON array
    $value = array(
        "numPages" => $num_images, 
        "pdfName" => $temp_id,
        "download" => $conts_download_url . $temp_id . ".pdf"
    );
    echo json_encode($value);    
?>
