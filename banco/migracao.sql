-- ============================================================
-- Nexativo - migração de um banco criado com a versão anterior.
-- Execute uma única vez em projeto_integrador.
-- Se alguma coluna já existir, o MySQL mostrará erro nessa linha
-- ("Duplicate column name"): ignore-a e continue com as demais.
-- ============================================================
USE projeto_integrador;

-- usuarios: colunas usadas pelo login, cadastro e painel de usuários
ALTER TABLE usuarios ADD COLUMN setor VARCHAR(100) NOT NULL DEFAULT 'Atendimento';
ALTER TABLE usuarios ADD COLUMN perfil VARCHAR(30) NOT NULL DEFAULT 'Usuário';
ALTER TABLE usuarios ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Ativo';
UPDATE usuarios SET perfil = 'Administrador' WHERE cargo = 'Administrador';

-- categorias: ícone e status exibidos e editados na tela de categorias
ALTER TABLE categorias ADD COLUMN icone VARCHAR(16) NOT NULL DEFAULT '📍';
ALTER TABLE categorias ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'Ativa';

-- ocorrencias: denúncias anônimas e gestão (responsável, prazo, orçamento)
ALTER TABLE ocorrencias MODIFY id_usuario INT NULL;
ALTER TABLE ocorrencias ADD COLUMN responsavel VARCHAR(100) NULL;
ALTER TABLE ocorrencias ADD COLUMN prazo DATE NULL;
ALTER TABLE ocorrencias ADD COLUMN orcamento_estimado DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE ocorrencias ADD COLUMN orcamento_aprovado DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE ocorrencias ADD COLUMN orcamento_gasto DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Histórico: denúncias anônimas não têm autor
ALTER TABLE historico_ocorrencias MODIFY id_usuario INT NULL;

-- Tabelas novas
CREATE TABLE IF NOT EXISTS observacoes_ocorrencia (
    id_observacao INT AUTO_INCREMENT PRIMARY KEY,
    id_ocorrencia INT NOT NULL,
    id_usuario INT NULL,
    texto TEXT NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencias(id_ocorrencia) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tarefas_ocorrencia (
    id_tarefa INT AUTO_INCREMENT PRIMARY KEY,
    id_ocorrencia INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    concluida TINYINT(1) NOT NULL DEFAULT 0,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ocorrencia) REFERENCES ocorrencias(id_ocorrencia) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS preferencias_usuarios (
    id_usuario INT PRIMARY KEY,
    notificacoes TINYINT(1) NOT NULL DEFAULT 1,
    alertas_urgentes TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Responsável atual de cada ocorrência (a partir dos atendimentos já existentes)
UPDATE ocorrencias o
JOIN (
    SELECT a.id_ocorrencia, e.nome
    FROM atendimentos a
    JOIN equipes e ON e.id_equipe = a.id_equipe
    WHERE a.id_atendimento = (
        SELECT MAX(a2.id_atendimento) FROM atendimentos a2
        WHERE a2.id_ocorrencia = a.id_ocorrencia
    )
) ult ON ult.id_ocorrencia = o.id_ocorrencia
SET o.responsavel = ult.nome;

INSERT IGNORE INTO preferencias_usuarios (id_usuario, notificacoes, alertas_urgentes)
SELECT id_usuario, 1, 1 FROM usuarios;
