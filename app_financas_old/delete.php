<?php
include 'config.php';

$id = $_GET['id'];

$conn->query("DELETE FROM transacoes WHERE id = $id");

header("Location: index.php");