<?php
include 'config.php';

$tipo = $_POST['tipo'];
$desc = $_POST['descricao'];
$valor = $_POST['valor'];
$data = $_POST['data'];
$categoria = $_POST['categoria'];

$sql = "INSERT INTO transacoes(tipo, descricao, valor, data, categoria)
 VALUES ('$tipo', '$desc', '$valor', '$data', '$categoria')";

if ($conn->query($sql)) {
    header("Location: index.php");
} else {
    echo "Erro: " . $conn->error;
}