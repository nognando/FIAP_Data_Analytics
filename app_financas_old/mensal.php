<?php include 'config.php'; ?>

<?php
// Mês selecionado (padrão: mês atual)
$mes = isset($_GET['mes']) ? intval($_GET['mes']) : date('m');
$ano = date('Y');

// Formatar para consulta SQL
$mes_formatado = str_pad($mes, 2, "0", STR_PAD_LEFT);

// Buscar transações do mês
$sql = "SELECT * FROM transacoes 
        WHERE MONTH(data) = $mes 
        ORDER BY data DESC";
$result = $conn->query($sql);

// Calcular total
$totalMes = 0;
while ($t = $result->fetch_assoc()) {
    if ($t['tipo'] == 'gasto') $totalMes -= $t['valor'];
    else $totalMes += $t['valor'];
}

// Reset pointer para usar novamente o result
$result->data_seek(0);

?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Gastos Mensais</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

    <style>
        body { background: #f2f4f7; }
        .month-label {
            font-size: 20px;
            font-weight: bold;
        }
        .range-container {
            margin-bottom: 30px;
        }
        input[type=range] {
            width: 100%;
        }
    </style>

</head>
<body>

<nav class="navbar navbar-light bg-white p-3 shadow-sm mb-4">
    <div class="container">
        <a href="index.php" class="btn btn-outline-primary">⬅ Voltar</a>
        <h3 class="m-0">📅 Gastos Mensais</h3>
        <div></div>
    </div>
</nav>

<div class="container">

    <!-- SLIDER DO MÊS -->
    <div class="card shadow-sm p-4 mb-4">

        <div class="range-container">
            <label class="form-label month-label" id="labelMes">
                Mês: <?= $mes ?>/<?= $ano ?>
            </label>

            <input type="range" class="form-range"
                   min="1" max="12" value="<?= $mes ?>"
                   id="sliderMes"
                   onchange="mudarMes(this.value)">
        </div>

        <h5 class="text-secondary">Total do Mês:</h5>
        <h2 class="<?= $totalMes >= 0 ? 'text-success' : 'text-danger' ?>">
            R$ <?= number_format($totalMes, 2, ',', '.') ?>
        </h2>

    </div>


    <!-- LISTAGEM MENSAL -->
    <div class="card shadow-sm p-4">

        <h4 class="mb-3">Transações de <?= $mes ?>/<?= $ano ?></h4>

        <table class="table table-hover">
            <thead>
                <tr>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Data</th>
                    <th>Categoria</th>
                </tr>
            </thead>

            <tbody>
                <?php while ($row = $result->fetch_assoc()): ?>
                    <tr>
                        <td>
                            <span class="badge bg-<?= $row['tipo'] == 'gasto' ? 'danger' : 'success' ?>">
                                <?= $row['tipo'] ?>
                            </span>
                        </td>

                        <td><?= $row['descricao'] ?></td>

                        <td>R$ <?= number_format($row['valor'], 2, ',', '.') ?></td>

                        <td><?= date('d/m/Y', strtotime($row['data'])) ?></td>

                        <td><?= $row['categoria'] ?></td>
                    </tr>
                <?php endwhile; ?>
            </tbody>

        </table>

    </div>

</div>

<script>
function mudarMes(m) {
    window.location.href = "mensal.php?mes=" + m;
}
</script>

</body>
</html>