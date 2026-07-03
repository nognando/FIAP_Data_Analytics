<?php
$host = "localhost";
$user = "u454088166_nogueira";
$pass = "F@lxmen30";
$db   = "u454088166_financas_db";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Erro ao conectar: " . $conn->connect_error);
}
?>