<?php include 'config.php'; ?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Controle de Orçamento</title>
    <a href="mensal.php" class="btn btn-secondary mb-3">📅 Ver Gastos Mensais</a>

    <!-- BOOTSTRAP 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

    <style>
        body {
            background: #f2f4f7;
        }
        .card {
            border-radius: 12px;
        }
        .navbar {
            border-bottom: 1px solid #ddd;
        }
        .table thead {
            background: #0d6efd;
            color: #fff;
        }
    </style>
</head>
<body>

<!-- NAVBAR -->
<nav class="navbar navbar-light bg-white p-3 shadow-sm mb-4">
    <div class="container">
        <h3 class="m-0">💰 Controle de Orçamento</h3>
    </div>
</nav>


<div class="container">

    <!-- CARD FORM -->
    <div class="card shadow-sm p-4 mb-4">
        <h4 class="mb-3">Adicionar Transação</h4>

        <form action="add.php" method="POST" class="row g-3">

            <div class="col-md-3">
                <label class="form-label">Tipo</label>
                <select name="tipo" class="form-select" required>
                    <option value="receita">Receita</option>
                    <option value="gasto">Gasto</option>
                </select>
            </div>

            <div class="col-md-3">
                <label class="form-label">Valor</label>
                <input type="number" step="0.01" name="valor" class="form-control" required>
            </div>

            <div class="col-md-3">
                <label class="form-label">Data</label>
                <input type="date" name="data" class="form-control" required>
            </div>

            <div class="col-md-3">
                <label class="form-label">Categoria</label>
                <input type="text" name="categoria" class="form-control" placeholder="Ex: Mercado" required>
            </div>

            <div class="col-md-12">
                <label class="form-label">Descrição</label>
                <input type="text" name="descricao" class="form-control" required>
            </div>

            <div class="col-md-12">
                <button class="btn btn-primary w-100">Adicionar</button>
            </div>

        </form>
    </div>


    <!-- LISTAGEM -->
    <div class="card shadow-sm p-4">
        <h4 class="mb-3">Transações</h4>

        <table class="table table-hover">
            <thead>
                <tr>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Data</th>
                    <th>Categoria</th>
                    <th>Ações</th>
                </tr>
            </thead>

            <tbody>
                <?php
                $sql = "SELECT * FROM transacoes ORDER BY data DESC";
                $result = $conn->query($sql);

                while ($row = $result->fetch_assoc()):
                ?>
                <tr>
                    <td>
                        <span class="badge bg-<?php echo $row['tipo'] == 'gasto' ? 'danger' : 'success'; ?>">
                            <?= $row['tipo'] ?>
                        </span>
                    </td>

                    <td><?= $row['descricao'] ?></td>

                    <td>R$ <?= number_format($row['valor'], 2, ',', '.') ?></td>

                    <td><?= date('d/m/Y', strtotime($row['data'])) ?></td>

                    <td><?= $row['categoria'] ?></td>

                    <td>
                        <a href="delete.php?id=<?= $row['id'] ?>"
                           class="btn btn-sm btn-outline-danger"
                           onclick="return confirm('Tem certeza que deseja excluir?')">
                           Excluir
                        </a>
                    </td>
                </tr>
                <?php endwhile; ?>
            </tbody>
        </table>

    </div>

</div>

</body>
</html>